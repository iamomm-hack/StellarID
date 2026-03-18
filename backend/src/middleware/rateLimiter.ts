import rateLimit from 'express-rate-limit';

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
