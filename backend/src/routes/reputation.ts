import { Router, Request, Response } from 'express';
import { query } from '../db';
import { getCache, setCache, invalidateProfileCache, zGetLeaderboard, zGetRank } from '../services/redis';
import { calculateAndSaveUserReputation, getUserStreak, evaluateAndSaveUserBadges, recordActivity } from '../utils/reputation';
import { BADGE_DEFINITIONS } from '../config/badges';

const router = Router();
const CACHE_TTL = 300; // 5 minutes
const LEADERBOARD_CACHE_TTL = 900; // 15 minutes


/**
 * GET /api/v1/reputation/leaderboard/my-rank
 * Returns user rank, score, and percentile
 */
router.get('/leaderboard/my-rank', async (req: Request, res: Response): Promise<void> => {
  try {
    const wallet = req.query.wallet as string;
    if (!wallet || !/^G[A-Z2-7]{55}$/.test(wallet)) {
      res.status(400).json({ error: 'Invalid or missing wallet address' });
      return;
    }

    const totalRes = await query('SELECT COUNT(*)::int as total FROM user_reputation');
    const totalUsers = totalRes.rows[0]?.total || 1;

    // 1. Try Redis sorted set first
    const redisRankRes = await zGetRank(wallet);
    if (redisRankRes !== null) {
      const rank = redisRankRes.rank + 1; // Redis rank is 0-indexed
      const score = redisRankRes.score;
      const percentile = parseFloat(((1 - (redisRankRes.rank / totalUsers)) * 100).toFixed(2));
      res.json({
        wallet_address: wallet,
        rank,
        score,
        percentile: Math.max(0, Math.min(100, percentile)),
        total_users: totalUsers,
      });
      return;
    }

    // 2. Fallback to SQL database query
    const scoreRes = await query('SELECT total_score FROM user_reputation WHERE wallet_address = $1', [wallet]);
    if (scoreRes.rows.length === 0) {
      res.status(404).json({ error: 'Reputation profile not found for this wallet' });
      return;
    }

    const score = scoreRes.rows[0].total_score;
    const rankRes = await query(
      'SELECT COUNT(*)::int + 1 as rank FROM user_reputation WHERE total_score > $1',
      [score]
    );
    const rank = rankRes.rows[0].rank;
    const percentile = parseFloat(((1 - ((rank - 1) / totalUsers)) * 100).toFixed(2));

    res.json({
      wallet_address: wallet,
      rank,
      score,
      percentile: Math.max(0, Math.min(100, percentile)),
      total_users: totalUsers,
    });
  } catch (err: any) {
    console.error('Error fetching my rank:', err);
    res.status(500).json({ error: 'Failed to fetch rank details' });
  }
});

/**
 * GET /api/v1/reputation/leaderboard
 * Returns top builders (public data only)
 */
router.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const scope = (req.query.scope as string || 'global').toLowerCase();
    const city = req.query.city as string;
    const college = req.query.college as string;
    const limit = parseInt(req.query.limit as string || '100', 10);
    const page = parseInt(req.query.page as string || '1', 10);
    const offset = (page - 1) * limit;

    const cacheKey = `leaderboard_${scope}_${city || ''}_${college || ''}_${limit}_${page}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    let leaderboard: any[] = [];
    let totalCount = 0;

    // Try Redis sorted set if scope is global and no custom filters are applied
    if (scope === 'global' && !city && !college) {
      const redisList = await zGetLeaderboard(limit, offset);
      if (redisList !== null && redisList.length > 0) {
        // Fetch detailed profile info from SQL for these wallets in a single query
        const wallets = redisList.map(item => item.wallet);
        const usersInfoRes = await query(
          `SELECT stellar_address, github_username, created_at, city, college, tier
           FROM users u
           LEFT JOIN user_reputation ur ON u.stellar_address = ur.wallet_address
           WHERE stellar_address = ANY($1)`,
          [wallets]
        );

        const infoMap = new Map(usersInfoRes.rows.map((row: any) => [row.stellar_address, row]));

        leaderboard = redisList.map((item, index) => {
          const uInfo = infoMap.get(item.wallet) || {};
          return {
            rank: offset + index + 1,
            wallet_address: item.wallet,
            total_score: item.score,
            tier: uInfo.tier || 'Verified',
            credential_count: 0, // Not stored in sorted set, can default or fetch
            display_name: uInfo.github_username || 'Builder',
            avatar_url: uInfo.github_username ? `https://github.com/${uInfo.github_username}.png` : null,
            member_since: uInfo.created_at
              ? new Date(uInfo.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'N/A',
          };
        });

        const countRes = await query(`SELECT COUNT(*)::int as total FROM user_reputation`);
        totalCount = countRes.rows[0]?.total || 0;
      }
    }

    // Fallback to SQL database query if Redis list is empty or local scope requested
    if (leaderboard.length === 0) {
      let sql = `
        SELECT 
          ur.wallet_address, 
          ur.total_score, 
          ur.tier, 
          ur.credential_count,
          u.github_username as display_name,
          u.created_at,
          u.city,
          u.college
        FROM user_reputation ur
        LEFT JOIN users u ON ur.wallet_address = u.stellar_address
      `;

      const conditions: string[] = [];
      const queryParams: any[] = [];

      if (scope === 'verified') {
        conditions.push(`ur.tier IN ('Verified', 'Proven', 'Elite Builder')`);
      } else if (scope === 'elite') {
        conditions.push(`ur.tier = 'Elite Builder'`);
      }

      if (city) {
        queryParams.push(city);
        conditions.push(`u.city = $${queryParams.length}`);
      }

      if (college) {
        queryParams.push(college);
        conditions.push(`u.college = $${queryParams.length}`);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` ORDER BY ur.total_score DESC, ur.credential_count DESC`;

      // Get total count for pagination
      let countSql = `SELECT COUNT(*)::int as total FROM user_reputation ur LEFT JOIN users u ON ur.wallet_address = u.stellar_address`;
      if (conditions.length > 0) {
        countSql += ` WHERE ` + conditions.join(' AND ');
      }
      const countRes = await query(countSql, queryParams);
      totalCount = countRes.rows[0]?.total || 0;

      // Add pagination to main query
      queryParams.push(limit, offset);
      sql += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

      const result = await query(sql, queryParams);

      leaderboard = result.rows.map((row: any, index: number) => ({
        rank: offset + index + 1,
        wallet_address: row.wallet_address,
        total_score: row.total_score,
        tier: row.tier,
        credential_count: row.credential_count,
        display_name: row.display_name || 'Builder',
        avatar_url: row.display_name ? `https://github.com/${row.display_name}.png` : null,
        member_since: row.created_at
          ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'N/A',
      }));
    }

    const data = {
      leaderboard,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
      },
    };

    await setCache(cacheKey, JSON.stringify(data), LEADERBOARD_CACHE_TTL);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

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

/**
 * GET /api/v1/reputation/:wallet_address/streak
 * Returns current and longest builder activity streak
 */
router.get('/:wallet_address/streak', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;
    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const streak = await getUserStreak(wallet_address);
    res.json({
      wallet_address,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
    });
  } catch (err: any) {
    console.error('Error fetching user streak:', err);
    res.status(500).json({ error: 'Failed to fetch user streak details' });
  }
});

/**
 * GET /api/v1/reputation/:wallet_address/badges
 * Returns list of badges unlocked by a builder
 */
router.get('/:wallet_address/badges', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;
    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const badgesRes = await query(
      `SELECT badge_id, earned_at 
       FROM user_badges 
       WHERE wallet_address = $1 
       ORDER BY earned_at DESC`,
      [wallet_address]
    );

    // Map database badge rows to full badge definitions/metadata
    const unlockedList = badgesRes.rows.map((row: any) => {
      const def = BADGE_DEFINITIONS.find((b) => b.id === row.badge_id);
      return {
        id: row.badge_id,
        name: def?.name || 'Unknown Badge',
        description: def?.description || '',
        icon: def?.icon || '🏅',
        category: def?.category || 'achievement',
        earned_at: row.earned_at,
      };
    });

    res.json({
      wallet_address,
      badges: unlockedList,
    });
  } catch (err: any) {
    console.error('Error fetching user badges:', err);
    res.status(500).json({ error: 'Failed to fetch badges list' });
  }
});

/**
 * POST /api/v1/reputation/:wallet_address/badges/calculate
 * Force recalculation of builder badges and returns newly unlocked ones
 */
router.post('/:wallet_address/badges/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;
    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    // record this manual calculation request as activity for streak tracking
    await recordActivity(wallet_address, 'badge_recalc');

    // Run evaluator
    const unlockedIds = await evaluateAndSaveUserBadges(wallet_address);

    const fullBadges = unlockedIds.map((id) => {
      const def = BADGE_DEFINITIONS.find((b) => b.id === id);
      return {
        id,
        name: def?.name || 'Unknown Badge',
        description: def?.description || '',
        icon: def?.icon || '🏅',
        category: def?.category || 'achievement',
      };
    });

    res.json({
      success: true,
      unlocked_count: fullBadges.length,
      badges: fullBadges,
    });
  } catch (err: any) {
    console.error('Error calculating badges:', err);
    res.status(500).json({ error: 'Failed to calculate builder badges' });
  }
});

export default router;
