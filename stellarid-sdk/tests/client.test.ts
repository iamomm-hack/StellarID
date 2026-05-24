import { StellarID } from '../src/client';

describe('StellarID SDK Client Tests', () => {
  const apiKey = 'test-api-key-123';
  const walletAddress = 'GBRPDBNCJQLCDOHT2C3555YCV5B2CUXM6KGDHIKJ5Z2J6TTH6Y4GL32I'; // Valid Stellar wallet address
  let client: StellarID;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new StellarID({ apiKey, baseURL: 'https://api.test-stellarid.io/api/v1' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should throw error if apiKey is missing', () => {
    expect(() => new StellarID({ apiKey: '' })).toThrow('apiKey is required');
  });

  test('should strip trailing slash from baseURL', () => {
    const customClient = new StellarID({ apiKey, baseURL: 'https://api.test-stellarid.io/api/v1/' });
    expect((customClient as any).baseURL).toBe('https://api.test-stellarid.io/api/v1');
  });

  test('verifyWallet: should fetch and return profile details', async () => {
    const mockProfileResponse = {
      wallet_address: walletAddress,
      reputation_score: 450,
      tier: 'Proven',
      credential_count: 2,
      verified: true,
      credentials: [
        {
          id: 'cred-1',
          name: 'github_developer',
          issuer_name: 'GitHub Issuer',
          issuer_verified: true,
          issuer_verification_status: 'verified',
          issued_at: '2026-05-24T12:00:00Z',
          expires_at: '2027-05-24T12:00:00Z',
          status: 'active',
        }
      ],
      last_updated: '2026-05-24T12:05:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProfileResponse,
    });

    const result = await client.verifyWallet(walletAddress);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.test-stellarid.io/api/v1/public/verify/${walletAddress}`,
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      })
    );
    expect(result).toEqual(mockProfileResponse);
  });

  test('verifyWallet: should throw error immediately if wallet format is invalid', async () => {
    await expect(client.verifyWallet('invalid-wallet-format')).rejects.toThrow(
      'Invalid Stellar wallet address format'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('issueCredential: should send correct body and return claim info', async () => {
    const mockIssueResponse = {
      success: true,
      pending_credential_id: 'pending-cred-123',
      claim_token: 'claim-tok-xyz',
      claim_url: 'https://stellarid.io/claim/claim-tok-xyz',
      expires_at: '2026-06-24T12:00:00Z',
      created_at: '2026-05-24T12:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockIssueResponse,
    });

    const params = {
      recipientEmail: 'dev@test.com',
      recipientWallet: walletAddress,
      credential: {
        name: 'stellar_hackathon_winner',
        description: 'Stellar ID Hackathon Grand Prize Winner',
      },
    };

    const result = await client.issueCredential(params);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test-stellarid.io/api/v1/public/credentials/issue',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          recipient_email: params.recipientEmail,
          recipient_wallet: params.recipientWallet,
          credential: params.credential,
        }),
      })
    );
    expect(result).toEqual(mockIssueResponse);
  });

  test('getCredential: should fetch credential by ID', async () => {
    const mockCredDetails = {
      id: 'cred-123',
      name: 'age_verification',
      wallet_address: walletAddress,
      status: 'active',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCredDetails,
    });

    const result = await client.getCredential('cred-123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test-stellarid.io/api/v1/public/credentials/cred-123',
      expect.any(Object)
    );
    expect(result).toEqual(mockCredDetails);
  });

  test('getProof: should fetch proof details by ID', async () => {
    const mockProofDetails = {
      proof_id: 'proof-123',
      status: 'verified',
      valid: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProofDetails,
    });

    const result = await client.getProof('cred-123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test-stellarid.io/api/v1/public/proof/cred-123',
      expect.any(Object)
    );
    expect(result).toEqual(mockProofDetails);
  });

  test('getBadge: should submit params and return badge html code', async () => {
    const mockBadgeResponse = {
      html: '<iframe></iframe>',
      iframe_url: 'https://stellarid.io/embed/badge/GA...',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBadgeResponse,
    });

    const result = await client.getBadge({
      walletAddress,
      style: 'light',
      size: 'lg',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test-stellarid.io/api/v1/public/embed/badge',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          wallet_address: walletAddress,
          style: 'light',
          size: 'lg',
        }),
      })
    );
    expect(result).toEqual(mockBadgeResponse);
  });

  test('should throw meaningful error if response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Invalid API key or insufficient permissions' }),
    });

    await expect(client.verifyWallet(walletAddress)).rejects.toThrow(
      'StellarID SDK Error: Invalid API key or insufficient permissions'
    );
  });
});
