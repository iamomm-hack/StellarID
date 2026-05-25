import request from 'supertest';
import app from '../../src/app';
import { generateFallbackBio } from '../../src/services/ai';

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
let mockAiSummary: string | null = null;
jest.mock('../../src/db', () => ({
  query: jest.fn().mockImplementation((text: string, params?: any[]) => {
    // Fetch user details
    if (text.includes('SELECT') && text.includes('users')) {
      return {
        rows: [{
          id: 'test-user-id',
          stellar_address: 'GD277777777777777777777777777777777777777777777777777777',
          created_at: '2026-01-15T10:00:00.000Z',
          github_username: 'octocat',
          ai_summary: mockAiSummary,
        }],
      };
    }

    // Fetch credentials
    if (text.includes('FROM credentials c')) {
      return {
        rows: [
          {
            credential_type: 'GitHub Pull Request',
            issuer_name: 'Git-Verify',
          },
          {
            credential_type: 'Stellar Foundation Hackathon',
            issuer_name: 'SDF',
          }
        ]
      };
    }

    // Fetch user badges
    if (text.includes('FROM user_badges')) {
      return {
        rows: [{ badge_id: 'First Claim' }]
      };
    }

    // Update bio query
    if (text.includes('UPDATE users SET ai_summary')) {
      mockAiSummary = params?.[0] || null;
      return { rows: [] };
    }

    // Insert activity, etc.
    return { rows: [] };
  }),
  default: {
    query: jest.fn(),
  },
}));

// Mock JWT helper
jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock_jwt_token_12345'),
  verifyToken: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    stellarAddress: 'GD277777777777777777777777777777777777777777777777777777',
  }),
}));

describe('AI Developer Bio Feature Tests', () => {
  beforeEach(() => {
    mockAiSummary = null;
    jest.clearAllMocks();
  });

  describe('Heuristic Fallback Bio Generator', () => {
    test('Generates detailed developer bio using heuristics', () => {
      const credentials = [
        { credential_type: 'GitHub Pull Request', issuer_name: 'Git-Verify' },
        { credential_type: 'Stellar Foundation Hackathon', issuer_name: 'SDF' }
      ];
      const badges = ['First Claim'];
      const bio = generateFallbackBio('Elite Builder', credentials, badges, 450);

      expect(bio).toContain('Elite Builder');
      expect(bio).toContain('450 reputation');
      expect(bio).toContain('hackathon-winning Web3 developer');
      expect(bio).toContain('GitHub Pull Request');
    });
  });

  describe('POST /api/v1/profile/generate-bio', () => {
    test('Successfully generates and persists developer bio', async () => {
      const res = await request(app)
        .post('/api/v1/profile/generate-bio')
        .set('Authorization', 'Bearer mock_jwt_token_12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bio).toBeDefined();
      expect(mockAiSummary).toBe(res.body.bio);
    });

    test('Fails when no authorization token is provided', async () => {
      const res = await request(app)
        .post('/api/v1/profile/generate-bio');

      expect(res.status).toBe(401);
    });
  });
});
