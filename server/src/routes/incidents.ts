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
      SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
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

    res.json(rows[0]);
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
    const { category_id, title, description, latitude, longitude, address, incident_date, priority } = req.body;

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

    const [rows]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [id]
    );

    res.status(201).json(rows[0]);
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
