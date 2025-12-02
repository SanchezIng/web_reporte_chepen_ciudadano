import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../config/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendMail } from '../utils/mailer.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  let conn: any;
  try {
    const { email, password, full_name, phone, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    conn = await pool.getConnection();

    const [existing] = await conn.execute('SELECT id FROM profiles WHERE email = ?', [email]);
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await conn.execute(
      'INSERT INTO profiles (id, email, password_hash, full_name, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [id, email, hashedPassword, full_name, phone || null, role || 'citizen']
    );

    const token = generateToken({ id, email, role: role || 'citizen' });

    res.status(201).json({
      user: { id, email, full_name, phone, role: role || 'citizen' },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ error: message });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.post('/login', async (req: Request, res: Response) => {
  let conn: any;
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      'SELECT id, email, password_hash, full_name, phone, role FROM profiles WHERE email = ?',
      [email]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(500).json({ error: message });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

export default router;

router.post('/request-reset', async (req: Request, res: Response) => {
  let conn: any;
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    conn = await pool.getConnection();
    const [rows]: any = await conn.execute('SELECT id FROM profiles WHERE email = ?', [email]);
    const user = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    const id = uuidv4();
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (user) {
      await conn.execute(
        'INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, NOW())',
        [id, user.id, token, `${expiresAt.getFullYear()}-${String(expiresAt.getMonth() + 1).padStart(2, '0')}-${String(expiresAt.getDate()).padStart(2, '0')} ${String(expiresAt.getHours()).padStart(2, '0')}:${String(expiresAt.getMinutes()).padStart(2, '0')}:${String(expiresAt.getSeconds()).padStart(2, '0')}`]
      );
    }

    const frontend = process.env.FRONTEND_URL || (process.env.FRONTEND_URLS || 'http://localhost:5173').split(',')[0];
    const resetUrl = `${frontend.replace(/\/$/, '')}/#/auth/reset?token=${token}`;
    if (user) {
      await sendMail(email, 'Recupera tu contraseña', `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${resetUrl}">Haz clic aquí para continuar</a></p><p>Si no fuiste tú, ignora este mensaje.</p>`);
    }
    res.json({ success: true, reset_url: resetUrl });
  } catch (error) {
    console.error('Request reset error:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});

router.post('/reset', async (req: Request, res: Response) => {
  let conn: any;
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new_password required' });
    }
    conn = await pool.getConnection();
    const [rows]: any = await conn.execute(
      'SELECT pr.user_id FROM password_resets pr WHERE pr.token = ? AND pr.used_at IS NULL AND pr.expires_at > NOW() ORDER BY pr.created_at DESC LIMIT 1',
      [token]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const userId = rows[0].user_id;
    const hash = await bcrypt.hash(new_password, 10);
    await conn.beginTransaction();
    await conn.execute('UPDATE profiles SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hash, userId]);
    await conn.execute('UPDATE password_resets SET used_at = NOW() WHERE token = ?', [token]);
    await conn.commit();
    res.json({ success: true });
  } catch (error) {
    try { if (conn) await conn.rollback(); } catch {}
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  } finally {
    try { if (conn) await conn.release(); } catch {}
  }
});
