import { env } from './config/env';
import app from './app';
import { runMigrations } from './utils/migrate';
import { pool } from './utils/prisma';

const start = async () => {
  try {
    // Test database connection
    await pool.getConnection();
    console.log('[database] Connected successfully');
    
    // Run migrations
    await runMigrations();
    
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on port ${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void start();

