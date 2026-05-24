import request from 'supertest';
import app from '../../src/app';

// Mock Redis service
jest.mock('../../src/services/redis', () => ({
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  deleteCache: jest.fn().mockResolvedValue(undefined),
  invalidateProfileCache: jest.fn().mockResolvedValue(undefined),
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

    // 4. Leaderboard queries
    if (text.includes('user_reputation ur') && text.includes('total_score')) {
      return {
        rows: [
          {
            wallet_address: 'GD277777777777777777777777777777777777777777777777777777',
            total_score: 390,
            tier: 'Elite Builder',
            credential_count: 2,
            display_name: 'octocat',
            created_at: '2026-01-15T10:00:00.000Z',
          },
          {
            wallet_address: 'GD111111111111111111111111111111111111111111111111111111',
            total_score: 250,
            tier: 'Proven',
            credential_count: 1,
            display_name: 'coder',
            created_at: '2026-02-15T10:00:00.000Z',
          }
        ]
      };
    }

    // 5. History queries
    if (text.includes('FROM user_reputation_history')) {
      return {
        rows: [
          { score: 100, recorded_at: '2026-05-01T10:00:00.000Z' },
          { score: 220, recorded_at: '2026-05-10T10:00:00.000Z' },
          { score: 390, recorded_at: '2026-05-24T10:00:00.000Z' }
        ]
      };
    }

    // 6. Count query
    if (text.includes('COUNT(*)') && text.includes('user_reputation')) {
      return { rows: [{ total: 2 }] };
    }

    // Fallback inserts/upserts
    return { rows: [] };
  }),
  default: {
    query: jest.fn(),
  },
}));

describe('Reputation API Integration Tests', () => {
  const validWallet = 'GD277777777777777777777777777777777777777777777777777777';

  describe('GET /api/v1/reputation/:wallet_address', () => {
    test('1. Fetches current reputation scoring details', async () => {
      const res = await request(app)
        .get(`/api/v1/reputation/${validWallet}`);

      expect(res.status).toBe(200);
      expect(res.body.total_score).toBeGreaterThanOrEqual(300);
      expect(res.body.tier).toBe('Elite Builder');
      expect(res.body.credential_count).toBe(2);
      expect(res.body.breakdown).toBeInstanceOf(Array);
      expect(res.body.bonuses).toBeInstanceOf(Array);
    });

    test('2. Rejects invalid wallet address formats', async () => {
      const res = await request(app)
        .get('/api/v1/reputation/invalidaddress');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid Stellar wallet address');
    });
  });

  describe('POST /api/v1/reputation/:wallet_address/recalculate', () => {
    test('3. Recalculates and registers history snapshot', async () => {
      const res = await request(app)
        .post(`/api/v1/reputation/${validWallet}/recalculate`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_score).toBeGreaterThanOrEqual(300);
    });
  });

  describe('GET /api/v1/reputation/leaderboard', () => {
    test('4. Fetches leaderboard and checks rankings pagination', async () => {
      const res = await request(app)
        .get('/api/v1/reputation/leaderboard?filter=global&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.leaderboard).toHaveLength(2);
      expect(res.body.leaderboard[0].rank).toBe(1);
      expect(res.body.leaderboard[0].display_name).toBe('octocat');
      expect(res.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/v1/reputation/:wallet_address/history', () => {
    test('5. Fetches score history logs successfully', async () => {
      const res = await request(app)
        .get(`/api/v1/reputation/${validWallet}/history`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0]).toHaveProperty('score');
      expect(res.body[0]).toHaveProperty('date');
    });
  });
});
