/**
 * StellarID — JWT Authentication Middleware
 * ============================================
 * Validates Bearer tokens from the Authorization header, resolves the
 * associated user record from PostgreSQL, and attaches it to `req.user`.
 *
 * Security considerations:
 * - Tokens are verified using HS256 with the JWT_SECRET env var
 * - Expired or malformed tokens return 401 Unauthorized
 * - User lookup prevents use of valid tokens for deleted accounts
 * - Token expiry warnings are logged for observability
 *
 * @version 2.0.0
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { query } from '../db';

/**
 * Extended Express Request with authenticated user context.
 * Populated after successful JWT verification.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    stellar_address: string;
    email?: string;
  };
  file?: any;
  files?: any;
}

/**
 * Express middleware that verifies JWT Bearer tokens and resolves user context.
 *
 * @param req - Express request (extended with `user` on success)
 * @param res - Express response (401 on failure)
 * @param next - Next middleware in chain
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as {
      userId: string;
      stellarAddress: string;
      exp?: number;
    };

    // Warn if token is expiring within 1 hour (for observability)
    if (decoded.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn < 60 * 60 * 1000 && expiresIn > 0) {
        console.log(`[Auth] Token for user ${decoded.userId} expires in ${Math.floor(expiresIn / 60000)}m`);
      }
    }

    // Resolve user from database to ensure account still exists
    const result = await query(
      'SELECT id, stellar_address, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
