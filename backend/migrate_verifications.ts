import pool from './src/db';

async function migrate() {
  try {
    console.log('Running migration...');

    await pool.query(`
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'unverified';
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verified_by UUID;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(100);
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP;
      ALTER TABLE issuers ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;
    `);
    console.log('Altered issuers table.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS issuer_endorsements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        endorser_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
        endorsed_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(endorser_issuer_id, endorsed_issuer_id)
      );
    `);
    console.log('Created issuer_endorsements table.');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorser ON issuer_endorsements(endorser_issuer_id);
      CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorsed ON issuer_endorsements(endorsed_issuer_id);
    `);
    console.log('Created indexes.');

    console.log('Migration completed successfully!');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
