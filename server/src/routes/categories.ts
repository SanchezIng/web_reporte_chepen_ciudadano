import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [rows]: any = await conn.execute('SELECT id, name, description, color, created_at FROM incident_categories ORDER BY name');

    await conn.release();

    res.json(rows || []);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
