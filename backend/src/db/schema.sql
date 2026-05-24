CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address VARCHAR(60) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  github_username VARCHAR(100),
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS issuers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stellar_address VARCHAR(60) UNIQUE NOT NULL,
  credential_types JSONB DEFAULT '[]',
  verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  issuer_type VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  issuer_id UUID REFERENCES issuers(id),
  credential_type VARCHAR(100) NOT NULL,
  claim_data JSONB NOT NULL,
  nft_token_id VARCHAR(255),
  stellar_tx_hash VARCHAR(70),
  ipfs_hash VARCHAR(100),
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  expired BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  credential_type VARCHAR(100) NOT NULL,
  claim_required VARCHAR(255) NOT NULL,
  zk_proof JSONB,
  verified BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  webhook_url TEXT,
  allowed_credential_types JSONB DEFAULT '[]',
  rate_limit_per_minute INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_expires ON credentials(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_platform ON verification_requests(platform_id);

-- Proof records for shareable verification & analytics
CREATE TABLE IF NOT EXISTS proof_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL,
  circuit_type VARCHAR(100) NOT NULL,
  claim_type VARCHAR(255),
  status VARCHAR(20) DEFAULT 'verified',
  proof_time_ms INTEGER,
  public_token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Admin role support
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_proof_records_created ON proof_records(created_at);
CREATE INDEX IF NOT EXISTS idx_proof_records_status ON proof_records(status);
CREATE INDEX IF NOT EXISTS idx_proof_records_user ON proof_records(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_records_token ON proof_records(public_token);
CREATE INDEX IF NOT EXISTS idx_credentials_issued ON credentials(issued_at);

-- Multi-signature credential approval requests
CREATE TABLE IF NOT EXISTS multisig_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_type VARCHAR(100) NOT NULL,
  required_signers JSONB NOT NULL,
  threshold INTEGER NOT NULL,
  transaction_xdr TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
);

-- Multi-signature signatures
CREATE TABLE IF NOT EXISTS multisig_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(100) NOT NULL REFERENCES multisig_requests(request_id) ON DELETE CASCADE,
  signer_address VARCHAR(60) NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(request_id, signer_address)
);

CREATE INDEX IF NOT EXISTS idx_multisig_requests_status ON multisig_requests(status);
CREATE INDEX IF NOT EXISTS idx_multisig_requests_owner ON multisig_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_multisig_signatures_request ON multisig_signatures(request_id);

-- Fee sponsorship tracking
CREATE TABLE IF NOT EXISTS fee_sponsorship_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL,
  tx_hash VARCHAR(70),
  fee_amount VARCHAR(50),
  sponsor_address VARCHAR(60),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_sponsorship_user ON fee_sponsorship_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_fee_sponsorship_created ON fee_sponsorship_logs(created_at);

-- Pending credentials for email-based claiming flow
CREATE TABLE IF NOT EXISTS pending_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_wallet VARCHAR(100),
  credential_type VARCHAR(100) NOT NULL,
  credential_data JSONB NOT NULL,
  claim_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  status VARCHAR(20) DEFAULT 'pending',
  claim_attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_credentials_token ON pending_credentials(claim_token);
CREATE INDEX IF NOT EXISTS idx_pending_credentials_email ON pending_credentials(recipient_email);
CREATE INDEX IF NOT EXISTS idx_pending_credentials_status ON pending_credentials(status);

-- Reputation system tables
CREATE TABLE IF NOT EXISTS issuer_trust_scores (
  issuer_id UUID PRIMARY KEY REFERENCES issuers(id) ON DELETE CASCADE,
  base_score DECIMAL(3,2) DEFAULT 0.10,
  community_endorsements INTEGER DEFAULT 0,
  official_verified BOOLEAN DEFAULT FALSE,
  credentials_issued INTEGER DEFAULT 0,
  credentials_revoked INTEGER DEFAULT 0,
  revocation_rate DECIMAL(4,3) DEFAULT 0.000,
  trust_score DECIMAL(3,2) DEFAULT 0.10,
  last_calculated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_reputation (
  wallet_address VARCHAR(100) PRIMARY KEY,
  total_score INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'Verified',
  credential_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMP DEFAULT NOW(),
  score_breakdown JSONB DEFAULT '{}',
  season_scores JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_reputation_score ON user_reputation(total_score);

-- Bulk issuance jobs
CREATE TABLE IF NOT EXISTS bulk_issuance_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE CASCADE,
  job_name VARCHAR(255) NOT NULL,
  credential_template JSONB NOT NULL,
  total_recipients INTEGER NOT NULL,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'queued',
  csv_ipfs_hash VARCHAR(255),
  error_log JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Bulk issuance recipients
CREATE TABLE IF NOT EXISTS bulk_issuance_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES bulk_issuance_jobs(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_wallet VARCHAR(100),
  custom_fields JSONB DEFAULT '{}',
  pending_credential_id UUID REFERENCES pending_credentials(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'queued',
  error_message TEXT,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_issuance_jobs_issuer ON bulk_issuance_jobs(issuer_id);
CREATE INDEX IF NOT EXISTS idx_bulk_issuance_recipients_job ON bulk_issuance_recipients(job_id);

-- Alter issuers table to add verification columns
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) DEFAULT 'unverified';
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP;
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain VARCHAR(255);
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verification_token VARCHAR(100);
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMP;
ALTER TABLE issuers ADD COLUMN IF NOT EXISTS endorsement_count INTEGER DEFAULT 0;

-- Create table issuer_endorsements
CREATE TABLE IF NOT EXISTS issuer_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endorser_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
  endorsed_issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(endorser_issuer_id, endorsed_issuer_id)
);

CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorser ON issuer_endorsements(endorser_issuer_id);
CREATE INDEX IF NOT EXISTS idx_issuer_endorsements_endorsed ON issuer_endorsements(endorsed_issuer_id);

-- Create table user_reputation_history
CREATE TABLE IF NOT EXISTS user_reputation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address VARCHAR(100) REFERENCES user_reputation(wallet_address) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reputation_history_wallet ON user_reputation_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_reputation_history_date ON user_reputation_history(recorded_at);

-- Developer API keys (Stripe-style)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['verify','read_profile'],
  rate_limit_per_hour INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_issuer ON api_keys(issuer_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- API usage logs (async logging)
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_key ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created ON api_usage_logs(created_at);

-- Support location and college scoping for builders
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(150);

-- User badges table
CREATE TABLE IF NOT EXISTS user_badges (
  wallet_address VARCHAR(100) NOT NULL,
  badge_id VARCHAR(50) NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (wallet_address, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_wallet ON user_badges(wallet_address);

-- User activity/streak table
CREATE TABLE IF NOT EXISTS user_activity (
  wallet_address VARCHAR(100) NOT NULL,
  activity_date DATE NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  PRIMARY KEY (wallet_address, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_wallet ON user_activity(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_activity_date ON user_activity(activity_date);
