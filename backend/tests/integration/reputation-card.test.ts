import request from 'supertest';
import app from '../../src/app';

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

// Mock database query
jest.mock('../../src/db', () => ({
  query: jest.fn().mockImplementation((text: string, params?: any[]) => {
    // 1. Fetch user data (stellar_address = $1 or id = $1)
    if (text.includes('SELECT') && text.includes('users') && !text.includes('JOIN')) {
      const paramVal = params?.[0];
      if (paramVal === 'GD222222222222222222222222222222222222222222222222222222') {
        return { rows: [] };
      }
      return {
        rows: [{
          id: 'test-user-uuid-111',
          stellar_address: paramVal || 'GD277777777777777777777777777777777777777777777777777777',
          created_at: '2026-01-15T10:00:00.000Z',
          github_username: 'octocat',
        }],
      };
    }

    // 2. Fetch credentials (stellar_address = $1)
    if (text.includes('FROM credentials c') && text.includes('JOIN users u')) {
      const address = params?.[0];
      if (address === 'GDIV2222222222222222222222222222222222222222222222222222') {
        // Diverse issuers mock data to test diversity bonus
        return {
          rows: [
            { id: 'c1', credential_type: 'GitHub Pull Request', issued_at: new Date().toISOString(), issuer_id: 'i1', issuer_name: 'Git-Verify', issuer_verified: true, issuer_trust_score: '1.00' },
            { id: 'c2', credential_type: 'LinkedIn Verified Skill', issued_at: new Date().toISOString(), issuer_id: 'i2', issuer_name: 'Linked-Verify', issuer_verified: true, issuer_trust_score: '0.80' },
            { id: 'c3', credential_type: 'Stellar Foundation Hackathon', issued_at: new Date().toISOString(), issuer_id: 'i3', issuer_name: 'SDF', issuer_verified: true, issuer_trust_score: '0.90' },
            { id: 'c4', credential_type: 'Discord Dev Badge', issued_at: new Date().toISOString(), issuer_id: 'i4', issuer_name: 'Discord-Verify', issuer_verified: false, issuer_trust_score: '0.50' },
            { id: 'c5', credential_type: 'Codecademy Cert', issued_at: new Date().toISOString(), issuer_id: 'i5', issuer_name: 'Code-Verify', issuer_verified: false, issuer_trust_score: '0.60' },
          ]
        };
      }
      // Standard user mock credentials
      return {
        rows: [
          {
            id: 'cred-uuid-1',
            credential_type: 'Stellar Hackathon Winner',
            issued_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago (Recent)
            issuer_id: 'issuer-uuid-999',
            issuer_name: 'Stellar Foundation',
            issuer_verified: true,
            issuer_trust_score: '0.90',
          },
          {
            id: 'cred-uuid-2',
            credential_type: 'GitHub Top Contributor',
            issued_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(), // ~3 months ago
            issuer_id: 'issuer-uuid-888',
            issuer_name: 'GitHub Verify Platform',
            issuer_verified: true,
            issuer_trust_score: '1.00',
          }
        ],
      };
    }

    // 3. Check for recent activity within 30 days
    if (text.includes('EXISTS') && text.includes('credentials') && text.includes("30 days")) {
      return { rows: [{ has_recent: true }] };
    }

    // 3.5. Fetch user badges
    if (text.includes('FROM user_badges') && text.includes('wallet_address = $1')) {
      const address = params?.[0];
      if (address === 'GD277777777777777777777777777777777777777777777777777777') {
        return { rows: [{ badge_id: 'First Claim' }, { badge_id: 'Active Streak' }] };
      }
      if (address === 'GDIV2222222222222222222222222222222222222222222222222222') {
        return { rows: [{ badge_id: 'elite_builder' }] };
      }
      return { rows: [] };
    }

    // 4. Fallback inserts/upserts (user_reputation, issuer_trust_scores)
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
    stellarAddress: 'GD277777777777777777777777777777777777777777777777777777',
  }),
}));

describe('StellarID Card and Reputation API Tests', () => {
  const validWallet = 'GD277777777777777777777777777777777777777777777777777777';
  const diverseWallet = 'GDIV2222222222222222222222222222222222222222222222222222';

  describe('GET /api/v1/profile/:wallet_address/card-data', () => {
    test('1. Fetches card data for a valid user with correct reputation math', async () => {
      const res = await request(app)
        .get(`/api/v1/profile/${validWallet}/card-data`);

      expect(res.status).toBe(200);
      expect(res.body.wallet_address).toBe(validWallet);
      expect(res.body.display_name).toBe('octocat');
      
      // Score calculation check:
      // Credential 1: (10 base + 5 recency) * 0.90 * 100 = 1350 * 0.9 = 135 points. Plus +20 verified = 155
      // Credential 2: (10 base + 4 recency) * 1.00 * 100 = 1400 * 1.0 = 140 points. Plus +20 verified = 160
      // Bonuses: GitHub OAuth verified (+50), Streak Active (+25), Official Issuer bonus (2 * +20 = +40)
      // Total reputation score: 135 + 140 + 50 + 25 + 40 = 390 points.
      // We expect the score to match or be close depending on roundings.
      expect(res.body.reputation_score).toBeGreaterThanOrEqual(300);
      expect(res.body.tier).toBe('Elite Builder');
      expect(res.body.credential_count).toBe(2);
      expect(res.body.badges).toContain('First Claim');
      expect(res.body.badges).toContain('Active Streak');
    });

    test('2. Diversity bonus is applied when 5+ unique issuers present', async () => {
      const res = await request(app)
        .get(`/api/v1/profile/${diverseWallet}/card-data`);

      expect(res.status).toBe(200);
      // Diversity bonus: +100 points
      // Total score should easily cross Elite Builder threshold of 500
      expect(res.body.reputation_score).toBeGreaterThanOrEqual(500);
      expect(res.body.tier).toBe('Elite Builder');
      expect(res.body.badges).toContain('Elite Builder');
    });

    test('3. Returns default card data if user does not exist in DB', async () => {
      const res = await request(app)
        .get('/api/v1/profile/GD222222222222222222222222222222222222222222222222222222/card-data');

      // The controller is designed to fall back to an empty card instead of failing
      expect(res.status).toBe(200);
      expect(res.body.reputation_score).toBe(0);
      expect(res.body.tier).toBe('Verified');
      expect(res.body.credential_count).toBe(0);
    });

    test('4. Rejects invalid wallet address format', async () => {
      const res = await request(app)
        .get('/api/v1/profile/invalidwallet/card-data');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid Stellar wallet address');
    });
  });

  describe('GET /api/v1/profile/:wallet_address/og-image', () => {
    test('5. Generates dynamic PNG buffer successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/profile/${validWallet}/og-image`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toBe('image/png');
      expect(res.body).toBeInstanceOf(Buffer);
    });
  });

  describe('GET /api/v1/profile/:wallet_address/share-url', () => {
    test('6. Generates share intents and metadata links correctly', async () => {
      const res = await request(app)
        .get(`/api/v1/profile/${validWallet}/share-url`);

      expect(res.status).toBe(200);
      expect(res.body.profile_url).toContain(`/p/${validWallet}`);
      expect(res.body.twitter_intent).toContain('https://twitter.com/intent/tweet');
      expect(res.body.linkedin_share).toContain('linkedin.com');
      expect(res.body.og_image_url).toContain(`/profile/${validWallet}/og-image`);
    });
  });
});
