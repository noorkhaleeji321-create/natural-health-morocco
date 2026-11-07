import express from 'express';
import compression from 'compression';
import apiRoutes from '../server/api';
import authRoutes from '../server/auth';
import { initSQLite, migrateData } from '../server/services/dbService';
import { initDatabase } from '../server/dataStore';

const app = express();

// Initialize in-memory or storage state if needed
try {
  initSQLite();
  const legacyData = initDatabase();
  migrateData(legacyData);
} catch (e) {
  console.warn('[Vercel Serverless] DB init notice:', e);
}

app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

export default app;
