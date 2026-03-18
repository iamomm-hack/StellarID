import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

export interface ApiKeyRequest extends Request {
  platform?: {
    id: string;
    name: string;
    allowed_credential_types: string[];
    rate_limit_per_minute: number;
  };
}

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
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.platform = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: 'API key validation failed' });
  }
}
