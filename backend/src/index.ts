import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startExpiryJob } from './jobs/expiry-cron';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     StellarID Backend API v1.0.0         ║
  ║     Port: ${String(PORT).padEnd(30)}║
  ║     Network: ${(process.env.STELLAR_NETWORK || 'testnet').padEnd(27)}║
  ║     Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)}║
  ╚══════════════════════════════════════════╝
  `);

  // Start background jobs
  startExpiryJob();
});
