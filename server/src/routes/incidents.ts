import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();

    let query = `
      SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email,
        (SELECT image_url FROM incident_images WHERE incident_id = i.id ORDER BY uploaded_at LIMIT 1) AS first_image_url,
        (SELECT video_url FROM incident_videos WHERE incident_id = i.id ORDER BY uploaded_at LIMIT 1) AS first_video_url
      FROM incidents i
      JOIN incident_categories ic ON i.category_id = ic.id
      JOIN profiles p ON i.user_id = p.id
    `;

    if (req.user?.role === 'citizen') {
      query += ' WHERE i.deleted_at IS NULL AND i.user_id = ?';
    } else {
      query += ' WHERE i.deleted_at IS NULL';
    }

    query += ' ORDER BY i.created_at DESC LIMIT 100';

    const [rows]: any = await conn.execute(
      query,
      req.user?.role === 'citizen' ? [req.user.id] : []
    );

    res.json(rows || []);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const [images]: any = await conn.execute(
      'SELECT id, image_url, uploaded_at FROM incident_images WHERE incident_id = ? ORDER BY uploaded_at',
      [req.params.id]
    );
    const [videos]: any = await conn.execute(
      'SELECT id, video_url, uploaded_at FROM incident_videos WHERE incident_id = ? ORDER BY uploaded_at',
      [req.params.id]
    );
    const incident = rows[0];
    incident.images = images || [];
    incident.videos = videos || [];
    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    const { category_id, title, description, latitude, longitude, address, incident_date, priority, images, videos } = req.body;

    if (!category_id || !title || !description || !incident_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    conn = await pool.getConnection();

    const id = uuidv4();
    const toMySQLDateTime = (d: any) => {
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    await conn.execute(
      `INSERT INTO incidents (id, user_id, category_id, title, description, latitude, longitude, address, status, priority, incident_date, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NULL)`,
      [
        id,
        req.user?.id,
        category_id,
        title,
        description,
        latitude || null,
        longitude || null,
        address || null,
        'pending',
        priority || 'medium',
        toMySQLDateTime(incident_date),
      ]
    );

    if (Array.isArray(images) && images.length > 0) {
      for (const url of images) {
        if (!url || typeof url !== 'string') continue;
        const imageId = uuidv4();
        await conn.execute(
          'INSERT INTO incident_images (id, incident_id, image_url, uploaded_at) VALUES (?, ?, ?, NOW())',
          [imageId, id, url]
        );
      }
    }
    if (Array.isArray(videos) && videos.length > 0) {
      for (const url of videos) {
        if (!url || typeof url !== 'string') continue;
        const videoId = uuidv4();
        await conn.execute(
          'INSERT INTO incident_videos (id, incident_id, video_url, uploaded_at) VALUES (?, ?, ?, NOW())',
          [videoId, id, url]
        );
      }
    }

    const [rows]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [id]
    );

    const [imgs]: any = await conn.execute(
      'SELECT id, image_url, uploaded_at FROM incident_images WHERE incident_id = ? ORDER BY uploaded_at',
      [id]
    );
    const [vids]: any = await conn.execute(
      'SELECT id, video_url, uploaded_at FROM incident_videos WHERE incident_id = ? ORDER BY uploaded_at',
      [id]
    );

    const created = rows[0] || {};
    created.images = imgs || [];
    created.videos = vids || [];
    res.status(201).json(created);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.patch('/:id', authMiddleware, roleMiddleware(['authority']), async (req: AuthRequest, res) => {
  let conn: any;
  try {
    const { status, priority, comment } = req.body;
    conn = await pool.getConnection();

    const [incident]: any = await conn.execute('SELECT * FROM incidents WHERE id = ?', [req.params.id]);

    if (!Array.isArray(incident) || incident.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Incident not found' });
    }

    const oldStatus = incident[0].status;

    await conn.beginTransaction();

    if (status) {
      await conn.execute(
        "UPDATE incidents SET status = ?, updated_at = NOW(), resolved_at = CASE WHEN ? IN ('resolved','rejected') THEN NOW() ELSE NULL END, resolved_by = ? WHERE id = ?",
        [status, status, req.user?.id, req.params.id]
      );
    }

    if (priority) {
      await conn.execute('UPDATE incidents SET priority = ?, updated_at = NOW() WHERE id = ?', [
        priority,
        req.params.id,
      ]);
    }

    if (comment || status) {
      const updateId = uuidv4();
      await conn.execute(
        'INSERT INTO incident_updates (id, incident_id, user_id, old_status, new_status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [updateId, req.params.id, req.user?.id, oldStatus, status || oldStatus, comment || null]
      );
    }

    await conn.commit();

    const [updated]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    try { if (conn) await conn.rollback(); } catch {}
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

export default router;
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    const { category_id, title, description, latitude, longitude, address, incident_date, priority, images, videos } = req.body;
    conn = await pool.getConnection();

    const [rows]: any = await conn.execute('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL', [req.params.id]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const inc = rows[0];
    if (inc.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Not allowed to edit this incident' });
    }

    if (inc.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending incidents can be edited' });
    }

    const toMySQLDateTime = (d: any) => {
      const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE incidents
       SET category_id = ?, title = ?, description = ?, latitude = ?, longitude = ?, address = ?, priority = ?, incident_date = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        category_id || inc.category_id,
        title || inc.title,
        description || inc.description,
        latitude ?? inc.latitude,
        longitude ?? inc.longitude,
        address ?? inc.address,
        priority || inc.priority,
        toMySQLDateTime(incident_date || inc.incident_date),
        req.params.id,
      ]
    );

    if (Array.isArray(images)) {
      await conn.execute('DELETE FROM incident_images WHERE incident_id = ?', [req.params.id]);
      for (const url of images) {
        if (!url || typeof url !== 'string') continue;
        const imageId = uuidv4();
        await conn.execute(
          'INSERT INTO incident_images (id, incident_id, image_url, uploaded_at) VALUES (?, ?, ?, NOW())',
          [imageId, req.params.id, url]
        );
      }
    }
    if (Array.isArray(videos)) {
      await conn.execute('DELETE FROM incident_videos WHERE incident_id = ?', [req.params.id]);
      for (const url of videos) {
        if (!url || typeof url !== 'string') continue;
        const videoId = uuidv4();
        await conn.execute(
          'INSERT INTO incident_videos (id, incident_id, video_url, uploaded_at) VALUES (?, ?, ?, NOW())',
          [videoId, req.params.id, url]
        );
      }
    }

    await conn.commit();

    const [updated]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    const [imagesRows]: any = await conn.execute(
      'SELECT id, image_url, uploaded_at FROM incident_images WHERE incident_id = ? ORDER BY uploaded_at',
      [req.params.id]
    );
    const [videosRows]: any = await conn.execute(
      'SELECT id, video_url, uploaded_at FROM incident_videos WHERE incident_id = ? ORDER BY uploaded_at',
      [req.params.id]
    );

    const incident = updated[0] || inc;
    incident.images = imagesRows || [];
    incident.videos = videosRows || [];
    res.json(incident);
  } catch (error) {
    try { if (conn) await conn.rollback(); } catch {}
    console.error('Edit incident error:', error);
    res.status(500).json({ error: 'Failed to edit incident' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();
    const [rows]: any = await conn.execute('SELECT * FROM incidents WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    const inc = rows[0];
    if (inc.user_id !== req.user?.id) {
      return res.status(403).json({ error: 'Not allowed to delete this incident' });
    }
    if (inc.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending incidents can be deleted' });
    }

    await conn.execute('UPDATE incidents SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Failed to delete incident' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});
