import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const conn = await pool.getConnection();

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

    await conn.release();
    res.json(rows || []);
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    await conn.release();

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { category_id, title, description, latitude, longitude, address, incident_date, priority } = req.body;

    if (!category_id || !title || !description || !incident_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await pool.getConnection();

    const id = uuidv4();
    const now = new Date().toISOString();

    await conn.execute(
      `INSERT INTO incidents (id, user_id, category_id, title, description, latitude, longitude, address, status, priority, incident_date, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
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
        incident_date,
        now,
        now,
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

    await conn.release();

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

router.patch('/:id', authMiddleware, roleMiddleware(['authority']), async (req: AuthRequest, res) => {
  try {
    const { status, priority, comment } = req.body;
    const conn = await pool.getConnection();

    const [incident]: any = await conn.execute('SELECT * FROM incidents WHERE id = ?', [req.params.id]);

    if (!Array.isArray(incident) || incident.length === 0) {
      await conn.release();
      return res.status(404).json({ error: 'Incident not found' });
    }

    const oldStatus = incident[0].status;
    const now = new Date().toISOString();

    await conn.execute('START TRANSACTION');

    if (status) {
      const resolved_at = status === 'resolved' || status === 'rejected' ? now : null;
      await conn.execute(
        'UPDATE incidents SET status = ?, updated_at = ?, resolved_at = ?, resolved_by = ? WHERE id = ?',
        [status, now, resolved_at, req.user?.id, req.params.id]
      );
    }

    if (priority) {
      await conn.execute('UPDATE incidents SET priority = ?, updated_at = ? WHERE id = ?', [
        priority,
        now,
        req.params.id,
      ]);
    }

    if (comment || status) {
      const updateId = uuidv4();
      await conn.execute(
        'INSERT INTO incident_updates (id, incident_id, user_id, old_status, new_status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [updateId, req.params.id, req.user?.id, oldStatus, status || oldStatus, comment || null, now]
      );
    }

    await conn.execute('COMMIT');

    const [updated]: any = await conn.execute(
      `SELECT i.*, ic.name as category_name, ic.color as category_color, p.full_name, p.email
       FROM incidents i
       JOIN incident_categories ic ON i.category_id = ic.id
       JOIN profiles p ON i.user_id = p.id
       WHERE i.id = ?`,
      [req.params.id]
    );

    await conn.release();

    res.json(updated[0]);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

export default router;
