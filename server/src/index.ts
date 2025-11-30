import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import incidentRoutes from './routes/incidents.js';
import categoryRoutes from './routes/categories.js';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGINS_RAW = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_ORIGINS = FRONTEND_ORIGINS_RAW.split(',').map((o) => o.trim().replace(/\/$/, ''));

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      const allowed =
        FRONTEND_ORIGINS.includes(cleanOrigin) ||
        /^https:\/\/web-reporte-chepen-ciudadano.*\.vercel\.app$/.test(cleanOrigin);
      callback(null, allowed);
    },
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
