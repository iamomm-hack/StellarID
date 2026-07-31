/**
 * StellarID — Express Application
 * =================================
 * Core HTTP application setup with middleware pipeline,
 * security headers, CORS policy, and API route mounting.
 *
 * @version 2.0.0
 * @module app
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

// Route imports
import authRouter from './routes/auth';
import credentialsRouter from './routes/credentials';
import issuersRouter from './routes/issuers';
import verifyRouter from './routes/verify';
import platformsRouter from './routes/platforms';
import githubIssuerRouter from './routes/github-issuer';
import linkedinIssuerRouter from './routes/linkedin-issuer';
import adminRouter from './routes/admin';
import proofsRouter from './routes/proofs';
import feeSponsorRouter from './routes/fee-sponsor';
import multisigRouter from './routes/multisig';
import profileRouter from './routes/profile';
import bulkRouter from './routes/bulk';
import reputationRouter from './routes/reputation';
import developerRouter from './routes/developer';
import publicApiRouter from './routes/publicApi';
import billingRouter from './routes/billing';
import { errorHandler } from './middleware/errorHandler';

// Application constants
const API_VERSION = 'v1';
const APP_VERSION = process.env.APP_VERSION || '2.0.0';
const startTime = Date.now();

const app = express();
app.set('trust proxy', true);

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:5555',
    ];
    // Allow Vercel preview URLs and requests with no origin (server-to-server)
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
}));

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ─── Request Correlation ID ──────────────────────────────────────────────────
// Every request gets a unique ID for distributed tracing and debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Powered-By', `StellarID/${APP_VERSION}`);
  res.setHeader('X-API-Version', API_VERSION);
  (req as any).requestId = requestId;
  next();
});

// ─── Request Logging ─────────────────────────────────────────────────────────
// Structured request/response logging (skip health checks to reduce noise)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/') {
    return next();
  }
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    const logFn = logLevel === 'warn' ? console.warn : console.log;
    logFn(
      `[API] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)` +
      ` [${(req as any).requestId?.substring(0, 8) || '-'}]`
    );
  });
  next();
});

// ─── Health & Status Endpoints ───────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'stellar-id-api',
    version: APP_VERSION,
  });
});

app.get('/health', (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  res.json({
    status: 'ok',
    version: APP_VERSION,
    uptime: uptimeSeconds,
    timestamp: new Date().toISOString(),
    network: process.env.STELLAR_NETWORK || 'testnet',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes (v1) ─────────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}/auth`, authRouter);
app.use(`/api/${API_VERSION}/credentials`, credentialsRouter);
app.use(`/api/${API_VERSION}/issuers`, issuersRouter);
app.use(`/api/${API_VERSION}/verify`, verifyRouter);
app.use(`/api/${API_VERSION}/platforms`, platformsRouter);
app.use(`/api/${API_VERSION}/github-issuer`, githubIssuerRouter);
app.use(`/api/${API_VERSION}/linkedin-issuer`, linkedinIssuerRouter);
app.use(`/api/${API_VERSION}/admin`, adminRouter);
app.use(`/api/${API_VERSION}/proofs`, proofsRouter);
app.use(`/api/${API_VERSION}/fee-sponsor`, feeSponsorRouter);
app.use(`/api/${API_VERSION}/multisig`, multisigRouter);
app.use(`/api/${API_VERSION}/profile`, profileRouter);
app.use(`/api/${API_VERSION}/bulk`, bulkRouter);
app.use(`/api/${API_VERSION}/reputation`, reputationRouter);
app.use(`/api/${API_VERSION}/developer`, developerRouter);
app.use(`/api/${API_VERSION}/public`, publicApiRouter);
app.use(`/api/${API_VERSION}/billing`, billingRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${_req.method} ${_req.path} does not exist`,
    docs: '/api/v1',
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
