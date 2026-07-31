/**
 * StellarID — Global Error Handler
 * ==================================
 * Catches all unhandled errors from Express route handlers and middleware.
 * Returns structured JSON error responses with request correlation IDs.
 *
 * Error categories:
 * - VALIDATION: Input validation failures (400)
 * - AUTH: Authentication/authorization failures (401/403)
 * - NOT_FOUND: Resource not found (404)
 * - RATE_LIMIT: Rate limit exceeded (429)
 * - BLOCKCHAIN: Stellar/Soroban transaction failures (502)
 * - INTERNAL: Unexpected server errors (500)
 *
 * @version 2.0.0
 * @module middleware/errorHandler
 */

import { Request, Response, NextFunction } from 'express';

// Error category classification for structured responses
type ErrorCategory = 'VALIDATION' | 'AUTH' | 'NOT_FOUND' | 'RATE_LIMIT' | 'BLOCKCHAIN' | 'INTERNAL';

/**
 * Classifies an error into a category based on status code and message content.
 */
function classifyError(statusCode: number, message: string): ErrorCategory {
  if (statusCode === 400) return 'VALIDATION';
  if (statusCode === 401 || statusCode === 403) return 'AUTH';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 429) return 'RATE_LIMIT';
  if (message.toLowerCase().includes('stellar') || message.toLowerCase().includes('soroban')) {
    return 'BLOCKCHAIN';
  }
  return 'INTERNAL';
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as any).statusCode || 500;
  const category = classifyError(statusCode, err.message);
  const requestId = (req as any).requestId || 'unknown';

  // Log with structured format
  console.error(`[Error] [${category}] [${requestId.substring(0, 8)}] ${err.message}`);
  if (statusCode >= 500) {
    console.error(err.stack);
  }

  // Build response — hide internal details in production
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && statusCode >= 500
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    category,
    requestId,
    ...(! isProduction && statusCode >= 500 && { stack: err.stack }),
  });
}
