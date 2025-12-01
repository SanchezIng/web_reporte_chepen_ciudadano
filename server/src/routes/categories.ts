import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();

    const [rows]: any = await conn.execute('SELECT id, name, description, color, created_at FROM incident_categories ORDER BY name');

    res.json(rows || []);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

export default router;
