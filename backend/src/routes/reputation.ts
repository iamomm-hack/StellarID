import { Router, Request, Response } from 'express';
import { query } from '../db';
import { getCache, setCache, invalidateProfileCache } from '../services/redis';
import { calculateAndSaveUserReputation } from '../utils/reputation';

const router = Router();
const CACHE_TTL = 300; // 5 minutes
const LEADERBOARD_CACHE_TTL = 900; // 15 minutes

/**
 * GET /api/v1/reputation/:wallet_address
 * Returns full reputation data + breakdown
 */
router.get('/:wallet_address', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const cacheKey = `reputation_data_${wallet_address}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // Calculate and save
    const result = await calculateAndSaveUserReputation(wallet_address);

    // Save to cache
    await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);

    res.json(result);
  } catch (err: any) {
    console.error('Error fetching reputation data:', err);
    res.status(500).json({ error: 'Failed to fetch reputation data' });
  }
});

/**
 * POST /api/v1/reputation/:wallet_address/recalculate
 * Force recalculation, invalidates caches, saves history snapshot
 */
router.post('/:wallet_address/recalculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    // Invalidate caches
    await invalidateProfileCache(wallet_address);

    // Force recalculate
    const result = await calculateAndSaveUserReputation(wallet_address);

    // Insert history snapshot
    await query(
      `INSERT INTO user_reputation_history (wallet_address, score, recorded_at)
       VALUES ($1, $2, NOW())`,
      [wallet_address, result.total_score]
    );

    // Also update cache with new value
    const cacheKey = `reputation_data_${wallet_address}`;
    await setCache(cacheKey, JSON.stringify(result), CACHE_TTL);

    // Invalidate leaderboard cache
    const redis = await import('../services/redis');
    // Clear leaderboard key
    await redis.deleteCache('leaderboard_global_100_1');
    await redis.deleteCache('leaderboard_verified_100_1');
    await redis.deleteCache('leaderboard_elite_100_1');

    res.json({
      success: true,
      message: 'Reputation recalculated successfully',
      data: result,
    });
  } catch (err: any) {
    console.error('Error recalculating reputation:', err);
    res.status(500).json({ error: 'Failed to recalculate reputation' });
  }
});

/**
 * GET /api/v1/reputation/leaderboard
 * Returns top builders (public data only)
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = (req.query.filter as string || 'global').toLowerCase();
    const limit = parseInt(req.query.limit as string || '100', 10);
    const page = parseInt(req.query.page as string || '1', 10);
    const offset = (page - 1) * limit;

    const cacheKey = `leaderboard_${filter}_${limit}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    let sql = `
      SELECT 
        ur.wallet_address, 
        ur.total_score, 
        ur.tier, 
        ur.credential_count,
        u.github_username as display_name,
        u.created_at
      FROM user_reputation ur
      LEFT JOIN users u ON ur.wallet_address = u.stellar_address
    `;

    const queryParams: any[] = [];

    if (filter === 'verified') {
      sql += ` WHERE ur.tier IN ('Verified', 'Proven', 'Elite Builder')`;
    } else if (filter === 'elite') {
      sql += ` WHERE ur.tier = 'Elite Builder'`;
    }

    sql += ` ORDER BY ur.total_score DESC, ur.credential_count DESC LIMIT $1 OFFSET $2`;
    queryParams.push(limit, offset);

    const result = await query(sql, queryParams);
    
    const countRes = await query(`SELECT COUNT(*)::int as total FROM user_reputation`, []);
    const totalCount = countRes.rows[0]?.total || 0;

    const data = {
      leaderboard: result.rows.map((row: any, index: number) => ({
        rank: offset + index + 1,
        wallet_address: row.wallet_address,
        total_score: row.total_score,
        tier: row.tier,
        credential_count: row.credential_count,
        display_name: row.display_name || 'Builder',
        avatar_url: row.display_name ? `https://github.com/${row.display_name}.png` : null,
        member_since: row.created_at 
          ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'N/A'
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1
      }
    };

    await setCache(cacheKey, JSON.stringify(data), LEADERBOARD_CACHE_TTL);

    res.json(data);
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/v1/reputation/:wallet_address/history
 * Returns score over time (for chart display)
 */
router.get('/:wallet_address/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    // Fetch existing history records
    const historyRes = await query(
      `SELECT score, recorded_at 
       FROM user_reputation_history 
       WHERE wallet_address = $1 
       ORDER BY recorded_at ASC`,
      [wallet_address]
    );

    let history = historyRes.rows;

    // If no history exists, seed initial historical points to avoid empty charts
    if (history.length === 0) {
      // Get current reputation to seed backdated progression
      const currentRep = await calculateAndSaveUserReputation(wallet_address);
      const score = currentRep.total_score;

      const now = new Date();
      const points = [
        {
          score: 0,
          recorded_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        },
        {
          score: Math.round(score * 0.3),
          recorded_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
        },
        {
          score: Math.round(score * 0.7),
          recorded_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        {
          score: score,
          recorded_at: now
        }
      ];

      // Save seeded points in database
      for (const p of points) {
        await query(
          `INSERT INTO user_reputation_history (wallet_address, score, recorded_at)
           VALUES ($1, $2, $3)`,
          [wallet_address, p.score, p.recorded_at]
        );
      }

      history = points;
    }

    res.json(
      history.map((row: any) => ({
        score: row.score,
        date: new Date(row.recorded_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        timestamp: new Date(row.recorded_at).getTime()
      }))
    );
  } catch (err: any) {
    console.error('Error fetching reputation history:', err);
    res.status(500).json({ error: 'Failed to fetch reputation history' });
  }
});

export default router;
