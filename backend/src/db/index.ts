import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const isNeon = process.env.DATABASE_URL?.includes('neon.tech');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep connections alive to avoid cold start delays
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Increased to 30s for Neon cold starts
  max: 10,
  // SSL config for Render / Neon
  ssl: (process.env.NODE_ENV === 'production' || isNeon) ? { rejectUnauthorized: false } : undefined,
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

async function seedDefaultData() {
  try {
    const issuerId = '11111111-2222-3333-4444-555555555555';
    const issuerRes = await pool.query('SELECT 1 FROM issuers WHERE id = $1', [issuerId]);
    if (issuerRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO issuers (id, name, description, stellar_address, credential_types, verified, logo_url, issuer_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [
          issuerId,
          'Stellar Foundation',
          'Official Stellar Foundation credentials provider',
          'GBTEST12345678901234567890123456789012345678901234567890',
          JSON.stringify(['Stellar Hackathon Winner', 'GitHub Contribution']),
          true,
          'https://stellar.org/logo.png',
          'manual',
        ]
      );
      console.log('Seeded default issuer: Stellar Foundation (ID: 11111111-2222-3333-4444-555555555555)');
    }

    const userId = '99999999-8888-7777-6666-555555555555';
    const userRes = await pool.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (id, stellar_address, email, github_username, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [
          userId,
          'GD277777777777777777777777777777777777777777777777777777',
          'test-recipient@example.com',
          'octocat',
          'user'
        ]
      );
      console.log('Seeded default user (ID: 99999999-8888-7777-6666-555555555555)');
    }

    const token = jwt.sign(
      { userId, stellarAddress: 'GD277777777777777777777777777777777777777777777777777777' },
      process.env.JWT_SECRET || 'stellarid_local_dev_secret',
      { expiresIn: '7d' }
    );

    console.log(`
  ┌────────────────────────────────────────────────────────┐
  │  [Seed Data Available]                                 │
  │  Test Issuer ID: 11111111-2222-3333-4444-555555555555 │
  │  Test User ID:   99999999-8888-7777-6666-555555555555 │
  │  Test JWT Token (for Authorization Bearer header):     │
  │  Bearer ${token}
  └────────────────────────────────────────────────────────┘
    `);
  } catch (err: any) {
    console.error('Seeding default data error:', err.message);
  }
}

async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'unverified';
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verified_by UUID;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(100);
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

      CREATE TABLE IF NOT EXISTS issuer_endorsements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        endorser_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
        endorsed_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(endorser_issuer_id, endorsed_issuer_id)
      );

      CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorser ON issuer_endorsements(endorser_issuer_id);
      CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorsed ON issuer_endorsements(endorsed_issuer_id);
    `);
    console.log('[Migration] Database verification tables and columns checked/created.');
  } catch (err: any) {
    console.error('[Migration] Error running verification schema migrations:', err.message);
  }
}

// Test connection on startup
pool.query('SELECT NOW()')
  .then(async (res) => {
    console.log(`Database connected at ${res.rows[0].now}`);
    startKeepAlive(); // Start keep-alive only after successful connection
    await runMigrations();
    seedDefaultData(); // Auto-seed default credentials/issuers for testing
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
