import request from 'supertest';
import app from '../../src/app';

// Mock stellar service
jest.mock('../../src/services/stellar', () => ({
  mintCredentialNFT: jest.fn().mockResolvedValue({
    txHash: 'claim_tx_hash_xyz789',
    tokenId: 2,
  }),
}));

// Mock IPFS service
jest.mock('../../src/services/ipfs', () => ({
  uploadToIPFS: jest.fn().mockResolvedValue('QmClaimIPFSHash999'),
}));

// Mock email service
jest.mock('../../src/services/email', () => ({
  sendClaimInvitationEmail: jest.fn().mockResolvedValue(true),
  sendClaimConfirmationEmail: jest.fn().mockResolvedValue(true),
}));

// Mock Redis service
jest.mock('../../src/services/redis', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  deleteCache: jest.fn().mockResolvedValue(undefined),
  invalidateProfileCache: jest.fn().mockResolvedValue(undefined),
  zAddLeaderboard: jest.fn().mockResolvedValue(undefined),
  zGetLeaderboard: jest.fn().mockResolvedValue(null),
  zGetRank: jest.fn().mockResolvedValue(null),
}));

// In-memory mock store for pending credentials in tests
interface PendingCredMock {
  id: string;
  issuer_id: string;
  recipient_email: string;
  recipient_wallet: string | null;
  credential_type: string;
  credential_data: any;
  claim_token: string;
  status: string;
  claim_attempts: number;
  expires_at: Date;
  claimed_at: Date | null;
}

const mockDbPendingStore: Record<string, PendingCredMock> = {};


// Mock database query
jest.mock('../../src/db', () => ({
  query: jest.fn().mockImplementation((text: string, params?: any[]) => {
    // 1. Check issuer query
    if (text.includes('SELECT') && text.includes('issuers')) {
      if (text.includes('id = $1')) {
        if (params?.[0] === 'invalid-issuer') {
          return { rows: [] };
        }
        return { rows: [{ id: params?.[0], name: 'Test Issuer', verified: true, subscription_tier: 'enterprise', subscription_status: 'active' }] };
      }
      if (text.includes('stellar_address = $1')) {
        return { rows: [{ id: 'test-issuer-id', name: 'Test Issuer', verified: true, subscription_tier: 'enterprise', subscription_status: 'active' }] };
      }
    }

    // Mock count queries
    if (text.includes('COUNT(')) {
      return { rows: [{ count: 0 }] };
    }

    // 2. Insert pending credentials
    if (text.includes('INSERT INTO pending_credentials')) {
      const id = 'pending-id-' + Math.random().toString(36).substring(2, 9);
      const token = '11111111-2222-4333-8444-555555555555';
      const mockObj: PendingCredMock = {
        id,
        issuer_id: params?.[0],
        recipient_email: params?.[1],
        recipient_wallet: params?.[2] || null,
        credential_type: params?.[3],
        credential_data: params?.[4],
        claim_token: token,
        status: 'pending',
        claim_attempts: 0,
        expires_at: params?.[5],
        claimed_at: null,
      };
      mockDbPendingStore[token] = mockObj;
      return { rows: [mockObj] };
    }

    // 3. Select pending credential by token
    if (text.includes('SELECT pc.*') && text.includes('claim_token = $1')) {
      const token = params?.[0];
      const found = mockDbPendingStore[token];
      if (!found) return { rows: [] };
      return {
        rows: [{
          ...found,
          issuer_name: 'Test Issuer',
          issuer_logo_url: 'logo.png',
          issuer_verified: true,
        }],
      };
    }

    // 4. Update status or attempt count
    if (text.includes('UPDATE pending_credentials')) {
      if (text.includes('claim_attempts = claim_attempts + 1')) {
        // Find by token or id (since params[0] is pending.id)
        const id = params?.[0];
        const token = Object.keys(mockDbPendingStore).find(k => mockDbPendingStore[k].id === id);
        if (token) {
          mockDbPendingStore[token].claim_attempts += 1;
        }
      }
      if (text.includes("status = 'claimed'")) {
        const id = params?.[1];
        const wallet = params?.[0];
        const token = Object.keys(mockDbPendingStore).find(k => mockDbPendingStore[k].id === id);
        if (token) {
          mockDbPendingStore[token].status = 'claimed';
          mockDbPendingStore[token].claimed_at = new Date();
          mockDbPendingStore[token].recipient_wallet = wallet;
        }
      }
      if (text.includes("status = 'expired'")) {
        const id = params?.[0];
        const token = Object.keys(mockDbPendingStore).find(k => mockDbPendingStore[k].id === id);
        if (token) {
          mockDbPendingStore[token].status = 'expired';
        }
      }
      return { rows: [] };
    }

    // 5. Select or insert users
    if (text.includes('SELECT') && text.includes('users')) {
      if (text.includes('stellar_address = $1') || text.includes('id = $1')) {
        return { rows: [{ id: 'mock-user-id', stellar_address: params?.[0] || 'GBTEST123', email: 'user@example.com' }] };
      }
    }
    if (text.includes('INSERT INTO users')) {
      return { rows: [{ id: 'mock-user-id', stellar_address: params?.[0], email: params?.[1] }] };
    }

    // 6. Insert into credentials
    if (text.includes('INSERT INTO credentials')) {
      return { rows: [{ id: 'mock-credential-id' }] };
    }

    // 7. Check if credential already exists
    if (text.includes('SELECT id FROM credentials') && text.includes('user_id = $1')) {
      const hasClaimed = Object.values(mockDbPendingStore).some(
        c => c.status === 'claimed'
      );
      if (hasClaimed) {
        return { rows: [{ id: 'mock-credential-id' }] };
      }
      return { rows: [] };
    }

    return { rows: [] };
  }),
  default: {
    query: jest.fn(),
  },
}));

// Mock JWT
jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock_jwt_token_12345'),
  verifyToken: jest.fn().mockReturnValue({
    userId: 'mock-user-id',
    stellarAddress: 'GBTEST123',
  }),
}));

describe('Email-Based Credential Claim API Tests', () => {
  const token = '11111111-2222-4333-8444-555555555555';

  describe('POST /api/v1/credentials/issue-with-email', () => {
    test('1. Succeeds and creates a pending invitation', async () => {
      const res = await request(app)
        .post('/api/v1/credentials/issue-with-email')
        .set('Authorization', 'Bearer mock_jwt_token_12345')
        .send({
          issuerId: 'test-issuer-id',
          recipientEmail: 'test-recipient@example.com',
          credentialType: 'GitHub Contribution',
          credentialData: { commits: 45, repo: 'stellar-id' },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.claimToken).toBe(token);
      expect(res.body.emailSent).toBe(true);
    });

    test('2. Fails for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/credentials/issue-with-email')
        .set('Authorization', 'Bearer mock_jwt_token_12345')
        .send({
          issuerId: 'test-issuer-id',
          recipientEmail: 'not-an-email',
          credentialType: 'GitHub Contribution',
          credentialData: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    test('3. Fails for past expiration date', async () => {
      const res = await request(app)
        .post('/api/v1/credentials/issue-with-email')
        .set('Authorization', 'Bearer mock_jwt_token_12345')
        .send({
          issuerId: 'test-issuer-id',
          recipientEmail: 'test@example.com',
          credentialType: 'GitHub Contribution',
          credentialData: {},
          expiresAt: new Date(Date.now() - 60000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('expiration');
    });
  });

  describe('GET /api/v1/credentials/claim/:token', () => {
    test('4. Fetch invitation details successfully', async () => {
      const res = await request(app).get(`/api/v1/credentials/claim/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.recipientEmail).toBe('test-recipient@example.com');
      expect(res.body.status).toBe('pending');
      expect(res.body.issuer.name).toBe('Test Issuer');
    });

    test('5. Fails for malformed token format', async () => {
      const res = await request(app).get('/api/v1/credentials/claim/bad-token-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('token');
    });
  });

  describe('POST /api/v1/credentials/claim/:token', () => {
    test('6. Succeeds to claim credential on-chain', async () => {
      const res = await request(app)
        .post(`/api/v1/credentials/claim/${token}`)
        .send({
          walletAddress: 'GD277777777777777777777777777777777777777777777777777777',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.nftTokenId).toBeDefined();
      expect(res.body.txHash).toBeDefined();

      // Verify DB state updated
      expect(mockDbPendingStore[token].status).toBe('claimed');
    });

    test('7. Fails to claim an already claimed credential', async () => {
      const res = await request(app)
        .post(`/api/v1/credentials/claim/${token}`)
        .send({
          walletAddress: 'GD277777777777777777777777777777777777777777777777777777',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already');
    });
  });

  afterAll((done) => {
    done();
  });
});
