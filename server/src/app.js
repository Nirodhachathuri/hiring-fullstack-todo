import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import todoRoutes from './routes/todos.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Builds the Express app without starting it, so tests can import it.
export function createApp() {
  const app = express();

  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'db-disconnected' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/todos', todoRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
