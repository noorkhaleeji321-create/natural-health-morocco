import 'dotenv/config';
import express from 'express';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initSQLite, migrateData } from './server/services/dbService';
import { initDatabase } from './server/dataStore';
import apiRoutes from './server/api';
import authRoutes from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite and migrate data
  initSQLite();
  const legacyData = initDatabase();
  migrateData(legacyData);

  // Performance: Gzip / Brotli compression for lightning-fast asset loading
  app.use(compression());

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure storage and public directories exist
  const storageDir = path.join(process.cwd(), 'storage');
  const uploadsDir = path.join(storageDir, 'uploads');
  const backupsDir = path.join(storageDir, 'backups');
  [storageDir, uploadsDir, backupsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const publicDir = path.join(process.cwd(), 'public');
  const imagesDir = path.join(publicDir, 'images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // Serve static files
  app.use(express.static(publicDir));
  app.use('/assets', express.static(path.join(publicDir, 'images', 'assets')));
  app.use('/uploads', express.static(uploadsDir));

  // ==========================================
  // MOUNT MODULAR ROUTES
  // ==========================================
  app.use('/api', apiRoutes);
  app.use('/api/auth', authRoutes);

  // ==========================================
  // SERVE PRE-COMPILED BUNDLE OR VITE DEV
  // ==========================================
  const distPath = path.join(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');

  if (fs.existsSync(distIndex)) {
    console.log('📦 Serving compiled bundle from /dist for bulletproof iframe preview');
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '1d' }));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    console.log('⚡ Serving Vite middleware');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Store Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use. Attempting to shut down gracefully or reuse.`);
      process.exit(0);
    } else {
      console.error('[Server] Unhandled server error:', err);
    }
  });
}

startServer();
