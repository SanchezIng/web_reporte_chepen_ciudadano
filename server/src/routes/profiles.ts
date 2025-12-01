import { Router } from 'express';
import pool from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      'SELECT id, email, full_name, phone, role, created_at, updated_at FROM profiles WHERE id = ?',
      [req.user?.id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  let conn: any;
  try {
    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      'SELECT id, email, full_name, phone, role, created_at FROM profiles WHERE id = ?',
      [req.params.id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

export default router;
