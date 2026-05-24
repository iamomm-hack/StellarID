import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../services/redis';
import { ApiKeyRequest } from './apiKeyAuth';

export const verifyRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  keyGenerator: (req) => (req.headers['x-api-key'] as string) || req.ip || 'unknown',
  message: { error: 'Rate limit exceeded', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many authentication attempts', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

export const claimRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts to allow smooth developer testing and page reloads
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many claim attempts. Please try again in 15 minutes.', retryAfter: 900 },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Sliding window rate limiter for Developer API keys.
 * Uses Redis with in-memory fallback. Adds X-RateLimit-* headers.
 */
const memoryRateLimits: Record<string, { count: number; resetAt: number }> = {};

export function apiKeyRateLimiter() {
  return async (req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.apiKey) {
        next();
        return;
      }

      const keyPrefix = req.apiKey.key_prefix;
      const limit = req.apiKey.rate_limit_per_hour;

      const now = Date.now();
      const hourBucket = Math.floor(now / (60 * 60 * 1000));
      const cacheKey = `rate_limit_${keyPrefix}_${hourBucket}`;
      const resetAt = (hourBucket + 1) * 60 * 60 * 1000;

      let currentCount = 0;

      const cached = await getCache(cacheKey);
      if (cached !== null) {
        currentCount = parseInt(cached, 10);
      } else {
        const mem = memoryRateLimits[cacheKey];
        if (mem && now < mem.resetAt) {
          currentCount = mem.count;
        }
      }

      const remaining = Math.max(0, limit - currentCount - 1);
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

      if (currentCount >= limit) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          reset_at: new Date(resetAt).toISOString(),
          retry_after_seconds: retryAfter,
        });
        return;
      }

      const newCount = currentCount + 1;
      const ttlSeconds = Math.ceil((resetAt - now) / 1000);

      setCache(cacheKey, newCount.toString(), ttlSeconds).catch(() => {});
      memoryRateLimits[cacheKey] = { count: newCount, resetAt };

      // Clean old entries occasionally
      if (Math.random() < 0.01) {
        for (const key of Object.keys(memoryRateLimits)) {
          if (memoryRateLimits[key].resetAt < now) {
            delete memoryRateLimits[key];
          }
        }
      }

      next();
    } catch (err: any) {
      console.error('Rate limiter error:', err.message);
      next(); // Fail open
    }
  };
}

