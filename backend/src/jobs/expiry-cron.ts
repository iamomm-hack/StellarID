import { query } from '../db';

// Simple interval-based expiry check (no Redis dependency)
export function startExpiryJob(): void {
  // Run immediately on startup
  checkExpiredCredentials().catch(() => {});
  
  // Then run daily
  setInterval(async () => {
    try {
      await checkExpiredCredentials();
    } catch (err: any) {
      console.error('Expiry check failed:', err.message);
    }
  }, 24 * 60 * 60 * 1000); // Daily

  console.log('Credential expiry cron job started (runs daily at midnight)');
}

async function checkExpiredCredentials(): Promise<number> {
  console.log('Running credential expiry check...');

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
    console.log(`Marked ${count} credentials as expired`);
    return count;
  } catch (err: any) {
    console.error('Expiry query failed:', err.message);
    return 0;
  }
}
