import request from 'supertest';
import app from '../../src/app';

// Mock stellar service
jest.mock('../../src/services/stellar', () => ({
  mintCredentialNFT: jest.fn().mockResolvedValue({
    txHash: 'test_tx_hash_abc123',
    tokenId: 1,
  }),
  checkCredentialValidity: jest.fn().mockResolvedValue(true),
  revokeCredential: jest.fn().mockResolvedValue('revoke_tx_hash'),
}));

// Mock IPFS service
jest.mock('../../src/services/ipfs', () => ({
  uploadToIPFS: jest.fn().mockResolvedValue('QmTestIPFSHash123'),
}));

// Mock database
jest.mock('../../src/db', () => ({
  query: jest.fn().mockImplementation((text: string, params?: any[]) => {
    // Mock different queries based on the SQL
    if (text.includes('SELECT') && text.includes('users')) {
      return { rows: [{ id: 'test-user-id', stellar_address: 'GBTEST123', email: null }] };
    }
    if (text.includes('INSERT') && text.includes('users')) {
      return { rows: [{ id: 'test-user-id', stellar_address: params?.[0], email: null, github_username: null }] };
    }
    if (text.includes('SELECT') && text.includes('credentials')) {
      return { rows: [] };
    }
    if (text.includes('SELECT') && text.includes('platforms')) {
      return {
        rows: [{
          id: 'test-platform-id',
          name: 'Test DeFi',
          allowed_credential_types: ['age_verification'],
          rate_limit_per_minute: 100,
        }],
      };
    }
    if (text.includes('INSERT') && text.includes('verification_requests')) {
      return { rows: [{ id: 'test-verification-id' }] };
    }
    if (text.includes('SELECT') && text.includes('issuers')) {
      return { rows: [{ id: 'test-issuer-id', name: 'Test Issuer', verified: true }] };
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
    userId: 'test-user-id',
    stellarAddress: 'GBTEST123',
  }),
}));

describe('StellarID Integration Tests', () => {
  describe('Authentication', () => {
    test('1. User connects wallet and gets JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/connect-wallet')
        .send({
          stellarAddress: 'GBTEST123ADDRESS456STELLAR789WALLET01234567890ABCDEFGHIJ',
          signature: 'mock_signature',
          message: 'StellarID authentication: 1234567890',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('stellarAddress');
    });

    test('2. Missing fields returns 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/connect-wallet')
        .send({ stellarAddress: 'GBTEST123' });
      expect(res.status).toBe(400);
    });
  });

  describe('Credentials', () => {
    test('3. Unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/v1/credentials');
      expect(res.status).toBe(401);
    });

    test('4. Authenticated user can list credentials', async () => {
      const res = await request(app)
        .get('/api/v1/credentials')
        .set('Authorization', 'Bearer mock_jwt_token_12345');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Verification', () => {
    test('5. Missing API key returns 401', async () => {
      const res = await request(app)
        .post('/api/v1/verify')
        .send({ credentialId: 'test', proofType: 'age_check' });
      expect(res.status).toBe(401);
    });

    test('6. Valid API key with proof returns verification result', async () => {
      const mockProof = {
        pi_a: ['1', '2', '1'],
        pi_b: [['1', '2'], ['3', '4'], ['1', '0']],
        pi_c: ['1', '2', '1'],
        protocol: 'groth16',
        curve: 'bn128',
      };

      const res = await request(app)
        .post('/api/v1/verify')
        .set('X-API-Key', 'test_api_key_xyz')
        .send({
          credentialId: 'test_cred_id',
          proofType: 'age_check',
          proof: mockProof,
          publicSignals: ['1', '12345678'],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('verified');
      // NEVER returns personal data
      expect(res.body).not.toHaveProperty('birthdate');
      expect(res.body).not.toHaveProperty('personalData');
    });

    test('7. Multiple rapid requests do not crash server', async () => {
      const requests = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/v1/verify')
          .set('X-API-Key', 'invalid_key')
          .send({})
      );
      const results = await Promise.all(requests);
      const statuses = results.map((r) => r.status);
      // Should get 4xx (invalid key/data), not 5xx
      expect(statuses.every((s) => s < 500)).toBe(true);
    });
  });

  describe('Health Check', () => {
    test('8. Health endpoint returns OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Issuers', () => {
    test('9. List issuers is public', async () => {
      const res = await request(app).get('/api/v1/issuers');
      expect(res.status).toBe(200);
    });
  });
});
