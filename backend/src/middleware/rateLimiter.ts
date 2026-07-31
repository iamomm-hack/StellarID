/**
 * StellarID — Rate Limiting Middleware
 * ======================================
 * Implements tiered rate limiting across multiple endpoint categories:
 * - Authentication endpoints (strict, IP-based)
 * - Verification endpoints (moderate, API-key or IP-based)
 * - Proof generation endpoints (moderate, per-wallet)
 * - Claim endpoints (relaxed, per-IP)
 * - Developer API keys (sliding window, per-key with Redis)
 *
 * Rate limiting uses express-rate-limit for fixed windows and a custom
 * Redis-backed sliding window implementation for developer API keys.
 * Falls back to in-memory counters when Redis is unavailable.
 *
 * @version 2.0.0
 * @module middleware/rateLimiter
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../services/redis';
import { ApiKeyRequest } from './apiKeyAuth';

// ─── Pass-Through (Test Environment) ─────────────────────────────────────────
// Bypass all rate limiting during automated test runs
const passThroughMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

// ─── Verification Rate Limit ─────────────────────────────────────────────────
// Applied to proof verification endpoints. Allows 100 requests per minute
// per unique API key or fallback to IP address.
export const verifyRateLimit = process.env.NODE_ENV === 'test' ? passThroughMiddleware : rateLimit({
  windowMs: 60 * 1000, // 1-minute sliding window
  max: 100,
  keyGenerator: (req) => (req.headers['x-api-key'] as string) || req.ip || 'unknown',
  message: { error: 'Rate limit exceeded', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Authentication Rate Limit ───────────────────────────────────────────────
// Strict limit on auth endpoints to prevent brute-force attacks.
// 20 attempts per minute per unique IP address.
export const authRateLimit = process.env.NODE_ENV === 'test' ? passThroughMiddleware : rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 20,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many authentication attempts', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Proof Generation Rate Limit ─────────────────────────────────────────────
// Applied to ZK proof generation submission endpoints.
// 50 proof submissions per minute per IP to prevent abuse.
export const proofRateLimit = process.env.NODE_ENV === 'test' ? passThroughMiddleware : rateLimit({
  windowMs: 60 * 1000, // 1-minute window
  max: 50,
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many proof generation requests. Please slow down.', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Claim Rate Limit ────────────────────────────────────────────────────────
// Relaxed limit for credential claim pages. Allows generous page reloads
// during developer testing while still preventing abuse.
export const claimRateLimit = process.env.NODE_ENV === 'test' ? passThroughMiddleware : rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 100, // 100 attempts to allow smooth developer testing and page reloads
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many claim attempts. Please try again in 15 minutes.', retryAfter: 900 },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Developer API Key Rate Limiter (Sliding Window) ─────────────────────────
/**
 * Redis-backed sliding window rate limiter for Developer API keys.
 *
 * Each developer key has a configurable hourly limit (set at key creation).
 * Counters are stored in Redis with an in-memory fallback. Standard
 * `X-RateLimit-*` headers are injected into every response.
 *
 * Adaptive behavior: If Redis is unreachable, the limiter degrades gracefully
 * to in-memory tracking per process (suitable for single-instance deployments).
 *
 * @returns Express middleware function
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
      const cacheKey = `stellarid:v2:rate_limit:${keyPrefix}:${hourBucket}`;
      const resetAt = (hourBucket + 1) * 60 * 60 * 1000;

      let currentCount = 0;

      // Try Redis first, fall back to in-memory
      const cached = await getCache(cacheKey);
      if (cached !== null) {
        currentCount = parseInt(cached, 10);
      } else {
        const mem = memoryRateLimits[cacheKey];
        if (mem && now < mem.resetAt) {
          currentCount = mem.count;
        }
      }

      // Calculate remaining quota and set standard headers
      const remaining = Math.max(0, limit - currentCount - 1);
      res.setHeader('X-RateLimit-Limit', limit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

      // Reject if limit exceeded
      if (currentCount >= limit) {
        const retryAfter = Math.ceil((resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        console.warn(
          `[RateLimit] Key ${keyPrefix} exceeded limit (${currentCount}/${limit}). ` +
          `Retry after ${retryAfter}s.`
        );
        res.status(429).json({
          error: 'Rate limit exceeded',
          limit,
          reset_at: new Date(resetAt).toISOString(),
          retry_after_seconds: retryAfter,
        });
        return;
      }

      // Increment counter in both Redis and memory
      const newCount = currentCount + 1;
      const ttlSeconds = Math.ceil((resetAt - now) / 1000);

      setCache(cacheKey, newCount.toString(), ttlSeconds).catch(() => {});
      memoryRateLimits[cacheKey] = { count: newCount, resetAt };

      // Periodically clean stale in-memory entries (1% chance per request)
      if (Math.random() < 0.01) {
        const staleKeys = Object.keys(memoryRateLimits).filter(
          (key) => memoryRateLimits[key].resetAt < now
        );
        staleKeys.forEach((key) => delete memoryRateLimits[key]);
        if (staleKeys.length > 0) {
          console.log(`[RateLimit] Cleaned ${staleKeys.length} stale in-memory entries.`);
        }
      }

      next();
    } catch (err: any) {
      // Fail open — allow the request if rate limiting itself fails
      console.error('[RateLimit] Middleware error (failing open):', err.message);
      next();
    }
  };
}

