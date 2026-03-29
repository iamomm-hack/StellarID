CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address VARCHAR(60) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  github_username VARCHAR(100),
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
