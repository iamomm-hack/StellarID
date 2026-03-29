import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep connections alive to avoid cold start delays
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 10,
  // SSL config for Render
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Keep-alive: ping DB every 4 minutes to prevent Render cold starts
const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000; // 4 minutes
let keepAliveStarted = false;

function startKeepAlive() {
  if (keepAliveStarted) return;
  keepAliveStarted = true;
  
  setInterval(async () => {
    try {
      await pool.query('SELECT 1');
    } catch (err: any) {
      // Silent fail - don't spam logs
    }
  }, KEEP_ALIVE_INTERVAL);
}

function formatDbError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const value = err as { code?: string; errors?: unknown[] };
    if (value.code) return `code=${value.code}`;
    if (Array.isArray(value.errors) && value.errors.length > 0) {
      const first = value.errors[0];
      if (first instanceof Error && first.message) return first.message;
    }
  }
  return String(err);
}

// Test connection on startup
pool.query('SELECT NOW()')
  .then((res) => {
    console.log(`Database connected at ${res.rows[0].now}`);
    startKeepAlive(); // Start keep-alive only after successful connection
  })
  .catch((err) => {
    console.error('Database connection error:', formatDbError(err));
  });

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
  }
  return result;
}

export default pool;
