/**
 * StellarID — API Key Authentication Middleware
 * ================================================
 * Validates platform API keys passed via the `X-API-Key` header.
 * Resolves the associated platform record from PostgreSQL and attaches
 * it to `req.platform` for downstream route handlers.
 *
 * Used by third-party platforms integrating StellarID verification
 * into their own applications via the Public API.
 *
 * @version 2.0.0
 * @module middleware/apiKey
 */

import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

/**
 * Extended Express Request with platform context from API key lookup.
 */
export interface ApiKeyRequest extends Request {
  platform?: {
    id: string;
    name: string;
    allowed_credential_types: string[];
    rate_limit_per_minute: number;
  };
}

/**
 * Validates the X-API-Key header and resolves the platform from the database.
 *
 * @param req - Express request (extended with `platform` on success)
 * @param res - Express response (401 on invalid/missing key)
 * @param next - Next middleware in chain
 */
export async function apiKeyMiddleware(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const result = await query(
      'SELECT id, name, allowed_credential_types, rate_limit_per_minute FROM platforms WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      console.warn(`[ApiKey] Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.platform = result.rows[0];
    next();
  } catch (err: any) {
    console.error(`[ApiKey] Validation error: ${err.message}`);
    res.status(500).json({ error: 'API key validation failed' });
  }
}
