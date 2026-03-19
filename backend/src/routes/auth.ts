import { Router, Request, Response } from 'express';
import { query } from '../db';
import { generateToken } from '../utils/jwt';
import { authRateLimit } from '../middleware/rateLimiter';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

function formatAuthError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null) {
    const value = err as { code?: string; errors?: unknown[] };
    if (value.code) return `code=${value.code}`;
    if (Array.isArray(value.errors) && value.errors.length > 0) {
      const first = value.errors[0];
      if (first instanceof Error && first.message) return first.message;
    }
  }
  return String(err);
}

// POST /connect-wallet
router.post('/connect-wallet', authRateLimit, async (req: Request, res: Response) => {
  try {
    const { stellarAddress, signature, message } = req.body;

    if (!stellarAddress || !signature || !message) {
      res.status(400).json({ error: 'Missing stellarAddress, signature, or message' });
      return;
    }

    // Validate Stellar address format (56 chars starting with G)
    if (!/^G[A-Z2-7]{55}$/.test(stellarAddress)) {
      // For development, allow any address format
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({ error: 'Invalid Stellar address format' });
        return;
      }
    }

    // In production, verify signature with Stellar SDK
    // For development/testing, we accept the connection
    // TODO: Full signature verification with stellar-sdk

    // Find or create user
    let result = await query(
      'SELECT id, stellar_address, email, github_username FROM users WHERE stellar_address = $1',
      [stellarAddress]
    );

    if (result.rows.length === 0) {
      result = await query(
        `INSERT INTO users (stellar_address) VALUES ($1)
         RETURNING id, stellar_address, email, github_username`,
        [stellarAddress]
      );
    }

    const user = result.rows[0];
    const token = generateToken({
      userId: user.id,
      stellarAddress: user.stellar_address,
    });

    res.json({
      token,
      user: {
        id: user.id,
        stellarAddress: user.stellar_address,
        email: user.email,
        githubUsername: user.github_username,
      },
    });
  } catch (err: unknown) {
    const errorMessage = formatAuthError(err);
    console.error('Wallet connection error:', errorMessage);
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ error: `Failed to connect wallet: ${errorMessage}` });
      return;
    }
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
});

// GET /me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      'SELECT id, stellar_address, email, github_username, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
