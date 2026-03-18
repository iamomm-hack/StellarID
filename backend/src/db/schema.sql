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
