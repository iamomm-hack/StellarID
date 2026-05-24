export interface StellarIDConfig {
  apiKey: string;
  baseURL?: string;
}

export interface CredentialListItem {
  id: string;
  name: string;
  issuer_name: string;
  issuer_verified: boolean;
  issuer_verification_status: string;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'revoked' | 'expired';
  tx_hash?: string;
}

export interface VerifyWalletResponse {
  wallet_address: string;
  reputation_score: number;
  tier: 'Verified' | 'Proven' | 'Elite Builder';
  credential_count: number;
  verified: boolean;
  credentials: CredentialListItem[];
  last_updated: string;
}

export interface IssueCredentialParams {
  recipientEmail: string;
  recipientWallet?: string;
  credential: {
    name: string;
    description?: string;
    expires_at?: string;
    metadata?: Record<string, any>;
  };
}

export interface IssueCredentialResponse {
  success: boolean;
  pending_credential_id: string;
  claim_token: string;
  claim_url: string;
  expires_at: string;
  created_at: string;
}

export interface GetCredentialResponse {
  id: string;
  name: string;
  claim_data: Record<string, any>;
  wallet_address: string;
  issuer: {
    name: string;
    verified: boolean;
    verification_status: string;
  };
  status: 'active' | 'revoked' | 'expired';
  issued_at: string;
  expires_at: string;
  revoked_at?: string;
  on_chain: {
    tx_hash?: string;
    ipfs_hash?: string;
    nft_token_id?: string;
  };
  zk_proof_available: boolean;
  zk_proof: {
    proof_id: string;
    circuit_type: string;
    public_token: string;
    verified_at: string;
  } | null;
}

export interface GetProofResponse {
  proof_id: string;
  credential_name: string;
  issuer_name: string;
  circuit_type: string;
  claim_type: string;
  status: string;
  public_token: string;
  verification_url: string;
  proof_time_ms: number;
  created_at: string;
  expires_at?: string;
  valid: boolean;
}

export interface GetBadgeParams {
  walletAddress: string;
  style?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export interface GetBadgeResponse {
  html: string;
  iframe_url: string;
}
