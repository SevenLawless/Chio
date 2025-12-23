import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://precious-education-production.up.railway.app',
    credentials: true
  }));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoints
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(errorHandler);

export default app;

