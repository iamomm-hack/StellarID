import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './routes/auth';
import credentialsRouter from './routes/credentials';
import issuersRouter from './routes/issuers';
import verifyRouter from './routes/verify';
import platformsRouter from './routes/platforms';
import githubIssuerRouter from './routes/github-issuer';
import adminRouter from './routes/admin';
import proofsRouter from './routes/proofs';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowedOrigins = [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:5555',
    ];
    // Allow Vercel preview URLs
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/credentials', credentialsRouter);
app.use('/api/v1/issuers', issuersRouter);
app.use('/api/v1/verify', verifyRouter);
app.use('/api/v1/platforms', platformsRouter);
app.use('/api/v1/github-issuer', githubIssuerRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/proofs', proofsRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
