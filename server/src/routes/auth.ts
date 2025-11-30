import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { generateToken } from '../config/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const conn = await pool.getConnection();

    const [existing] = await conn.execute('SELECT id FROM profiles WHERE email = ?', [email]);
    if (Array.isArray(existing) && existing.length > 0) {
      await conn.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await conn.execute(
      'INSERT INTO profiles (id, email, password_hash, full_name, phone, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [id, email, hashedPassword, full_name, phone || null, role || 'citizen']
    );

    await conn.release();

    const token = generateToken({ id, email, role: role || 'citizen' });

    res.status(201).json({
      user: { id, email, full_name, phone, role: role || 'citizen' },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ error: message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const conn = await pool.getConnection();

    const [rows]: any = await conn.execute(
      'SELECT id, email, password_hash, full_name, phone, role FROM profiles WHERE email = ?',
      [email]
    );

    await conn.release();

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
  }
});

export default router;
