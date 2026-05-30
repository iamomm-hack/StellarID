import {
  StellarIDConfig,
  VerifyWalletResponse,
  IssueCredentialParams,
  IssueCredentialResponse,
  GetCredentialResponse,
  GetProofResponse,
  GetBadgeParams,
  GetBadgeResponse,
} from './types';

export class StellarID {
  private apiKey: string;
  private baseURL: string;

  constructor(config: StellarIDConfig) {
    if (!config.apiKey) {
      throw new Error('StellarID SDK Error: apiKey is required');
    }
    this.apiKey = config.apiKey;
    // Strip trailing slash if present
    const base = config.baseURL || 'https://stellarid.onrender.com/api/v1';
    this.baseURL = base.endsWith('/') ? base.slice(0, -1) : base;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `StellarID request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // ignore JSON parse errors, use fallback message
      }
      throw new Error(`StellarID SDK Error: ${errorMessage}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Verifies a Stellar wallet address, returning its reputation score, tier, and credentials.
   * @param walletAddress Valid Stellar wallet address (G...)
   */
  async verifyWallet(walletAddress: string): Promise<VerifyWalletResponse> {
    if (!walletAddress || !/^G[A-Z2-7]{55}$/.test(walletAddress)) {
      throw new Error('StellarID SDK Error: Invalid Stellar wallet address format');
    }
    return this.request<VerifyWalletResponse>(`/public/verify/${walletAddress}`);
  }

  /**
   * Issues a pending credential to a recipient via email.
   * @param params recipient details and credential metadata
   */
  async issueCredential(params: IssueCredentialParams): Promise<IssueCredentialResponse> {
    if (!params.recipientEmail) {
      throw new Error('StellarID SDK Error: recipientEmail is required');
    }
    if (!params.credential || !params.credential.name) {
      throw new Error('StellarID SDK Error: credential.name is required');
    }
    return this.request<IssueCredentialResponse>('/public/credentials/issue', {
      method: 'POST',
      body: JSON.stringify({
        recipient_email: params.recipientEmail,
        recipient_wallet: params.recipientWallet,
        credential: params.credential,
      }),
    });
  }

  /**
   * Retrieves details of a specific credential.
   * @param credentialId The unique ID of the credential
   */
  async getCredential(credentialId: string): Promise<GetCredentialResponse> {
    if (!credentialId) {
      throw new Error('StellarID SDK Error: credentialId is required');
    }
    return this.request<GetCredentialResponse>(`/public/credentials/${credentialId}`);
  }

  /**
   * Retrieves the ZK proof associated with a credential.
   * @param credentialId The unique ID of the credential
   */
  async getProof(credentialId: string): Promise<GetProofResponse> {
    if (!credentialId) {
      throw new Error('StellarID SDK Error: credentialId is required');
    }
    return this.request<GetProofResponse>(`/public/proof/${credentialId}`);
  }

  /**
   * Gets the HTML embed code and iframe URL for a wallet badge.
   * @param params parameters for styling and sizing the badge
   */
  async getBadge(params: GetBadgeParams): Promise<GetBadgeResponse> {
    if (!params.walletAddress || !/^G[A-Z2-7]{55}$/.test(params.walletAddress)) {
      throw new Error('StellarID SDK Error: Invalid Stellar wallet address format');
    }
    return this.request<GetBadgeResponse>('/public/embed/badge', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: params.walletAddress,
        style: params.style || 'dark',
        size: params.size || 'md',
      }),
    });
  }
}

// Export under alternative alias name
export { StellarID as StellarIDClient };
