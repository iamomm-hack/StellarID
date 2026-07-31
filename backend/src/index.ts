/**
 * StellarID Backend — Entry Point
 * ================================
 * Sovereign identity and reputation protocol on Stellar.
 *
 * @version 2.0.0
 * @license MIT
 * @see https://github.com/iamomm-hack/StellarID
 */

import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startExpiryJob } from './jobs/expiry-cron';
import { startReputationCron } from './jobs/reputation-cron';
import './services/bulkWorker';

// Application metadata
const APP_VERSION = '2.0.0';
const APP_NAME = 'StellarID';
process.env.APP_VERSION = APP_VERSION;

const PORT = process.env.PORT || 5555;
const NETWORK = process.env.STELLAR_NETWORK || 'testnet';
const ENV = process.env.NODE_ENV || 'development';

// Prevent unhandled errors from crashing the server
process.on('unhandledRejection', (reason: any) => {
  console.error(`[${APP_NAME}] Unhandled Rejection:`, reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error(`[${APP_NAME}] Uncaught Exception:`, err.message);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`\n[${APP_NAME}] Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

app.listen(PORT as number, '0.0.0.0', () => {
  const startedAt = new Date().toISOString();
  console.log(`
  ┌─────────────────────────────────────────────────┐
  │                                                 │
  │   ⚡ ${APP_NAME} Backend API v${APP_VERSION}              │
  │                                                 │
  │   Port:         ${String(PORT).padEnd(30)}│
  │   Network:      ${NETWORK.padEnd(30)}│
  │   Environment:  ${ENV.padEnd(30)}│
  │   Started:      ${startedAt.padEnd(30)}│
  │   Node:         ${process.version.padEnd(30)}│
  │                                                 │
  │   Status:       ✅ OPERATIONAL                   │
  │                                                 │
  └─────────────────────────────────────────────────┘
  `);

  // Startup health diagnostics
  console.log(`[${APP_NAME}] Running startup diagnostics...`);

  const diagnostics: { component: string; status: string }[] = [];

  // Check database URL configuration
  diagnostics.push({
    component: 'PostgreSQL',
    status: process.env.DATABASE_URL ? '✅ Configured' : '⚠️ Not configured',
  });

  // Check Redis configuration
  diagnostics.push({
    component: 'Redis',
    status: process.env.REDIS_URL ? '✅ Configured' : '⚠️ Not configured (using in-memory fallback)',
  });

  // Check Stellar configuration
  diagnostics.push({
    component: 'Stellar RPC',
    status: process.env.STELLAR_RPC_URL ? '✅ Configured' : '⚠️ Using default endpoint',
  });

  // Check contract IDs
  diagnostics.push({
    component: 'Credential NFT Contract',
    status: process.env.CREDENTIAL_NFT_CONTRACT_ID ? '✅ Deployed' : '⚠️ Not set',
  });

  diagnostics.push({
    component: 'Fee Sponsor',
    status: process.env.FEE_SPONSOR_SECRET ? '✅ Active' : '⚠️ Disabled (users pay own fees)',
  });

  diagnostics.forEach(({ component, status }) => {
    console.log(`  ├─ ${component}: ${status}`);
  });
  console.log(`  └─ All diagnostics complete.\n`);

  // Start background jobs (non-critical — don't crash server if this fails)
  try {
    startExpiryJob();
    startReputationCron();
    console.log(`[${APP_NAME}] Background jobs started successfully.`);
  } catch (err: any) {
    console.warn(`[${APP_NAME}] Failed to start background jobs:`, err.message);
  }
});
