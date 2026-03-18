import Bull from 'bull';
import { query } from '../db';

let expiryQueue: Bull.Queue | null = null;

export function startExpiryJob(): void {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('REDIS_URL not set — credential expiry cron job disabled');
    // Fallback: use setInterval
    setInterval(async () => {
      try {
        await checkExpiredCredentials();
      } catch (err: any) {
        console.error('Expiry check failed:', err.message);
      }
    }, 24 * 60 * 60 * 1000); // Daily

    console.log('Credential expiry check started (interval-based, daily)');
    return;
  }

  try {
    expiryQueue = new Bull('credential-expiry', redisUrl);

    expiryQueue.process(async (_job) => {
      return await checkExpiredCredentials();
    });

    expiryQueue.add(
      {},
      {
        repeat: { cron: '0 0 * * *' }, // Daily at midnight
        removeOnComplete: 10,
      }
    );

    expiryQueue.on('completed', (job, result) => {
      console.log(`Expiry job completed: ${result} credentials marked expired`);
    });

    expiryQueue.on('failed', (job, err) => {
      console.error('Expiry job failed:', err.message);
    });

    console.log('Credential expiry cron job started (runs daily at midnight)');
  } catch (err: any) {
    console.warn('Failed to start Bull queue, using interval fallback:', err.message);
    setInterval(async () => {
      try {
        await checkExpiredCredentials();
      } catch (checkErr: any) {
        console.error('Expiry check failed:', checkErr.message);
      }
    }, 24 * 60 * 60 * 1000);
  }
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
