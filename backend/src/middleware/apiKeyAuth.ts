import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    issuer_id: string;
    key_prefix: string;
    name: string;
    permissions: string[];
    rate_limit_per_hour: number;
  };
  apiKeyIssuer?: {
    id: string;
    name: string;
    stellar_address: string;
  };
}

/**
 * Middleware to authenticate requests using StellarID API keys.
 * Accepts keys from:
 *   - X-StellarID-Key header
 *   - Authorization: Bearer sid_live_...
 * 
 * @param requiredPermission - The permission required for this endpoint
 */
export function apiKeyAuth(requiredPermission?: string) {
  return async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract key from headers
      let rawKey: string | undefined;

      const stellarIdKey = req.headers['x-stellarid-key'] as string;
      const authHeader = req.headers.authorization;

      if (stellarIdKey) {
        rawKey = stellarIdKey;
      } else if (authHeader?.startsWith('Bearer sid_')) {
        rawKey = authHeader.split(' ')[1];
      }

      if (!rawKey) {
        res.status(401).json({
          error: 'API key required',
          hint: 'Provide your key via X-StellarID-Key header or Authorization: Bearer sid_live_...',
        });
        return;
      }

      // Validate key format
      if (!rawKey.startsWith('sid_live_') && !rawKey.startsWith('sid_test_')) {
        res.status(401).json({ error: 'Invalid API key format' });
        return;
      }

      // Extract prefix (first 16 chars) for lookup
      const keyPrefix = rawKey.substring(0, 16);

      // Find all non-revoked keys with this prefix
      const result = await query(
        `SELECT ak.*, i.id as issuer_id_ref, i.name as issuer_name, i.stellar_address 
         FROM api_keys ak
         LEFT JOIN issuers i ON ak.issuer_id = i.id
         WHERE ak.key_prefix = $1 AND ak.revoked_at IS NULL`,
        [keyPrefix]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Invalid or revoked API key' });
        return;
      }

      // Compare hash for each matching prefix (should be unique, but be safe)
      let matchedKey: any = null;
      for (const row of result.rows) {
        const isMatch = await bcrypt.compare(rawKey, row.key_hash);
        if (isMatch) {
          matchedKey = row;
          break;
        }
      }

      if (!matchedKey) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }

      // Check required permission
      if (requiredPermission && !matchedKey.permissions.includes(requiredPermission)) {
        res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermission,
          granted: matchedKey.permissions,
        });
        return;
      }

      // Update last_used_at (fire-and-forget, don't block)
      query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [matchedKey.id]).catch(() => {});

      // Attach key info to request
      req.apiKey = {
        id: matchedKey.id,
        issuer_id: matchedKey.issuer_id,
        key_prefix: matchedKey.key_prefix,
        name: matchedKey.name,
        permissions: matchedKey.permissions,
        rate_limit_per_hour: matchedKey.rate_limit_per_hour,
      };

      req.apiKeyIssuer = {
        id: matchedKey.issuer_id_ref,
        name: matchedKey.issuer_name,
        stellar_address: matchedKey.stellar_address,
      };

      next();
    } catch (err: any) {
      console.error('API key auth error:', err.message);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

/**
 * Fire-and-forget API usage logging
 */
export function logApiUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  responseStatus: number,
  responseTimeMs: number
): void {
  query(
    `INSERT INTO api_usage_logs (api_key_id, endpoint, method, response_status, response_time_ms)
     VALUES ($1, $2, $3, $4, $5)`,
    [apiKeyId, endpoint, method, responseStatus, responseTimeMs]
  ).catch((err) => {
    console.error('Failed to log API usage:', err.message);
  });
}
