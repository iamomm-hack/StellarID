/**
 * StellarID — Credential Expiry Cron Job
 * =========================================
 * Background job that runs on a daily interval to automatically mark
 * expired credentials in the PostgreSQL database.
 *
 * Lifecycle:
 * 1. Runs immediately on server startup
 * 2. Repeats every 24 hours
 * 3. Queries for credentials past their expiry date
 * 4. Marks them as `expired = true` in a single atomic UPDATE
 *
 * This job does NOT modify on-chain state — it only updates the
 * off-chain database to keep the UI in sync with credential validity.
 * On-chain validity is always the source of truth (checked via
 * the `is_valid()` Soroban contract call).
 *
 * @version 2.0.0
 * @module jobs/expiry-cron
 */

import { query } from '../db';

// Job configuration
const JOB_NAME = 'CredentialExpiry';
const RUN_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Initialize and start the credential expiry background job.
 * Runs once immediately, then repeats on the configured interval.
 */
export function startExpiryJob(): void {
  // Run immediately on startup
  checkExpiredCredentials().catch((err) => {
    console.warn(`[${JOB_NAME}] Initial check failed (non-critical): ${err.message}`);
  });
  
  // Schedule recurring runs
  setInterval(async () => {
    try {
      await checkExpiredCredentials();
    } catch (err: any) {
      console.error(`[${JOB_NAME}] Scheduled check failed: ${err.message}`);
    }
  }, RUN_INTERVAL_MS);

  console.log(`[${JOB_NAME}] Cron job started (interval: ${RUN_INTERVAL_MS / 3600000}h)`);
}

/**
 * Query the database for credentials that have passed their expiry date
 * and mark them as expired. Returns the number of credentials affected.
 *
 * @returns Number of credentials marked as expired
 */
async function checkExpiredCredentials(): Promise<number> {
  const startTime = Date.now();
  console.log(`[${JOB_NAME}] Running expiry check...`);

  try {
    const result = await query(
      `UPDATE credentials
       SET expired = true
       WHERE expires_at < NOW()
         AND expired = false
         AND revoked = false
       RETURNING id`,
      []
    );

    const count = result.rows.length;
    const duration = Date.now() - startTime;
    console.log(`[${JOB_NAME}] Marked ${count} credential(s) as expired (${duration}ms)`);
    return count;
  } catch (err: any) {
    console.error(`[${JOB_NAME}] Expiry query failed: ${err.message}`);
    return 0;
  }
}
