import fs from 'fs/promises';
import path from 'path';
import { pool, query } from './prisma';

export async function runMigrations() {
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    // Get already applied migrations
    const applied = await query<{ name: string }>('SELECT name FROM _migrations');
    const appliedSet = new Set(applied.map(m => m.name));

    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        continue; // Skip already applied migrations
      }

      const migrationPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(migrationPath, 'utf-8');
      
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          await pool.execute(statement);
        } catch (error: any) {
          // Ignore duplicate index/table errors (MySQL doesn't support IF NOT EXISTS for indexes)
          if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_ENTRY') {
            console.log(`[database] Index/constraint already exists, skipping: ${statement.substring(0, 50)}...`);
            continue;
          }
          throw error;
        }
      }
      
      // Mark migration as applied
      await pool.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`[database] Applied migration: ${file}`);
    }
    
    console.log('[database] All migrations applied successfully');
  } catch (error) {
    console.error('[database] Migration error:', error);
    throw error;
  }
}

