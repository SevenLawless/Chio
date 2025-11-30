import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Validate DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL as string;
if (!databaseUrl.startsWith('mysql://') && !databaseUrl.startsWith('mysqlx://')) {
  throw new Error(
    `Invalid DATABASE_URL format. Expected mysql://... but got: ${databaseUrl.substring(0, 50)}...\n` +
    `Make sure you've properly linked your MySQL service in Railway:\n` +
    `1. Go to your backend service → Variables tab\n` +
    `2. Click "+ New Variable" → "Reference Variable"\n` +
    `3. Select your MySQL service and choose "DATABASE_URL"\n` +
    `Or manually set: DATABASE_URL=\${{YourMySQLServiceName.DATABASE_URL}}`
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};

