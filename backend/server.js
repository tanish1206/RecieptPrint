/**
 * @file server.js
 * @description Express application entry point for ReceiptPrint backend.
 * Configures middleware, mounts routes, and starts the HTTP server.
 */

import express    from 'express';
import cors       from 'cors';
import helmet     from 'helmet';
import dotenv     from 'dotenv';
import analyzeRouter from './src/routes/analyze.js';
import historyRouter from './src/routes/history.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security headers (helmet sets X-Content-Type-Options, X-Frame-Options,
//    Strict-Transport-Security, Content-Security-Policy, etc.) ───────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS — explicit allow-list, not wildcard ──────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'https://reciept-print.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods:          ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  credentials:      true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:   true,
    status:    'OK',
    timestamp: new Date().toISOString(),
    version:   process.env.npm_package_version || '1.0.0',
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success:   false,
    error:     `Route ${req.method} ${req.path} not found.`,
    code:      'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// ── Centralised error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ReceiptPrint backend running on port ${PORT}`);
  });
}

export default app;
