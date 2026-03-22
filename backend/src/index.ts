import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startExpiryJob } from './jobs/expiry-cron';

const PORT = process.env.PORT || 5555;

// Prevent unhandled errors from crashing the server
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     StellarID Backend API v1.0.0         ║
  ║     Port: ${String(PORT).padEnd(30)} ║
  ║     Network: ${(process.env.STELLAR_NETWORK || 'testnet').padEnd(27)} ║
  ║     Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)}  ║
  ╚══════════════════════════════════════════╝
  `);

  // Start background jobs (non-critical — don't crash server if this fails)
  try {
    startExpiryJob();
  } catch (err: any) {
    console.warn('Failed to start expiry job:', err.message);
  }
});
