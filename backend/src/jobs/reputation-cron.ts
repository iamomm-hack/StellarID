import { query } from '../db';
import { calculateAndSaveUserReputation } from '../utils/reputation';

export function startReputationCron(): void {
  // Run immediately on startup
  runReputationUpdate().catch(() => {});

  // Then run daily
  setInterval(async () => {
    try {
      await runReputationUpdate();
    } catch (err: any) {
      console.error('Reputation background update failed:', err.message);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours

  console.log('Reputation cron job started (runs daily)');
}

async function runReputationUpdate(): Promise<void> {
  console.log('Running daily user reputation update and snapshot...');
  try {
    // Get all users who have claimed credentials
    const usersRes = await query(
      `SELECT DISTINCT u.stellar_address 
       FROM users u
       JOIN credentials c ON u.id = c.user_id`,
      []
    );

    const wallets = usersRes.rows.map((row: any) => row.stellar_address);
    console.log(`Found ${wallets.length} active wallets for reputation recalculation`);

    for (const wallet of wallets) {
      try {
        const result = await calculateAndSaveUserReputation(wallet);
        
        // Save daily snapshot
        await query(
          `INSERT INTO user_reputation_history (wallet_address, score, recorded_at)
           VALUES ($1, $2, NOW())`,
          [wallet, result.total_score]
        );
      } catch (err: any) {
        console.error(`Failed to update reputation for wallet ${wallet}:`, err.message);
      }
    }

    console.log('Reputation recalculation and snapshot creation complete.');
  } catch (err: any) {
    console.error('Error in runReputationUpdate:', err.message);
  }
}
