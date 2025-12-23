import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cron from 'node-cron';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import selectedTaskRoutes from './routes/selectedTasks';
import categoryRoutes from './routes/categories';
import { errorHandler } from './middleware/errorHandler';
import { resetSelectedTasks } from './services/resetService';

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
app.use('/api/tasks/selected', selectedTaskRoutes);
app.use('/api/categories', categoryRoutes);

app.use(errorHandler);

// Schedule daily reset at 5am UTC
cron.schedule('0 5 * * *', async () => {
  console.log('[Cron] Running daily reset of selected tasks at 5am UTC');
  try {
    await resetSelectedTasks();
  } catch (error) {
    console.error('[Cron] Error in daily reset:', error);
  }
});

export default app;

