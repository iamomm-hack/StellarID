import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function migrate(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Starting database migration...');

  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected to database');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        await client.query(statement);
        // Extract first meaningful words for logging
        const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
        console.log(`  ✓ ${preview}...`);
      } catch (err: any) {
        if (
          err.message.includes('already exists') ||
          err.code === '42710' || // duplicate_object
          err.code === '42P07'    // duplicate_table
        ) {
          const preview = statement.replace(/\s+/g, ' ').substring(0, 60);
          console.log(`  ⊘ ${preview}... (already exists, skipping)`);
        } else {
          console.error(`  ✗ Failed: ${statement.substring(0, 60)}...`);
          console.error(`    Error: ${err.message}`);
          throw err;
        }
      }
    }

    client.release();
    console.log('\nMigration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
