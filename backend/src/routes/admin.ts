import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Admin middleware — checks role = 'admin', auto-promotes in dev
async function adminMiddleware(req: AuthRequest, res: Response, next: Function): Promise<void> {
  try {
    await authMiddleware(req, res, () => {});
    if (!req.user) return;

    const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // In dev mode, auto-promote to admin
    if (process.env.NODE_ENV !== 'production' && result.rows[0].role !== 'admin') {
      await query("UPDATE users SET role = 'admin' WHERE id = $1", [req.user.id]);
    }

    if (result.rows[0].role !== 'admin' && process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// Helper: try Redis cache first, fallback to DB
async function cachedQuery(key: string, ttl: number, fetcher: () => Promise<any>): Promise<any> {
  try {
    const redis = await import('redis');
    const client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    await client.connect();
    const cached = await client.get(key);
    if (cached) {
      await client.disconnect();
      return JSON.parse(cached);
    }
    const data = await fetcher();
    await client.setEx(key, ttl, JSON.stringify(data));
    await client.disconnect();
    return data;
  } catch {
    // Redis unavailable — just run query
    return fetcher();
  }
}

// GET /stats — core metrics
router.get('/stats', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await cachedQuery('admin:stats', 60, async () => {
      const [creds, proofs, users, successRate] = await Promise.all([
        query('SELECT COUNT(*)::int AS total FROM credentials'),
        query('SELECT COUNT(*)::int AS total FROM proof_records'),
        query('SELECT COUNT(*)::int AS total FROM users'),
        query(`SELECT
          CASE WHEN COUNT(*) = 0 THEN 100
          ELSE ROUND(COUNT(*) FILTER (WHERE status = 'verified')::numeric / COUNT(*)::numeric * 100, 1)
          END AS rate
          FROM proof_records`),
      ]);
      return {
        totalCredentials: creds.rows[0].total,
        totalProofs: proofs.rows[0].total,
        totalUsers: users.rows[0].total,
        successRate: parseFloat(successRate.rows[0].rate),
      };
    });
    res.json(data);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /activity — last 24h events
router.get('/activity', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await cachedQuery('admin:activity', 30, async () => {
      const [recentProofs, recentCreds] = await Promise.all([
        query(`SELECT pr.id, pr.circuit_type, pr.claim_type, pr.status, pr.created_at, pr.proof_time_ms
               FROM proof_records pr
               WHERE pr.created_at > NOW() - INTERVAL '24 hours'
               ORDER BY pr.created_at DESC LIMIT 20`),
        query(`SELECT c.id, c.credential_type, i.name as issuer_name, c.issued_at
               FROM credentials c
               LEFT JOIN issuers i ON c.issuer_id = i.id
               WHERE c.issued_at > NOW() - INTERVAL '24 hours'
               ORDER BY c.issued_at DESC LIMIT 20`),
      ]);
      return {
        recentProofs: recentProofs.rows,
        recentCredentials: recentCreds.rows,
      };
    });
    res.json(data);
  } catch (err) {
    console.error('Admin activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /chart-data — daily counts for last 30 days
router.get('/chart-data', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await cachedQuery('admin:chart', 120, async () => {
      const [proofsByDay, credsByDay] = await Promise.all([
        query(`SELECT DATE(created_at) as date, COUNT(*)::int as count
               FROM proof_records
               WHERE created_at > NOW() - INTERVAL '30 days'
               GROUP BY DATE(created_at)
               ORDER BY date`),
        query(`SELECT DATE(issued_at) as date, COUNT(*)::int as count
               FROM credentials
               WHERE issued_at > NOW() - INTERVAL '30 days'
               GROUP BY DATE(issued_at)
               ORDER BY date`),
      ]);
      return {
        proofs: proofsByDay.rows,
        credentials: credsByDay.rows,
      };
    });
    res.json(data);
  } catch (err) {
    console.error('Admin chart error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /top-issuers — ranked by credential count
router.get('/top-issuers', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await cachedQuery('admin:issuers', 120, async () => {
      const result = await query(`
        SELECT i.id, i.name, i.logo_url, i.verified, COUNT(c.id)::int as credential_count
        FROM issuers i
        LEFT JOIN credentials c ON c.issuer_id = i.id
        GROUP BY i.id, i.name, i.logo_url, i.verified
        ORDER BY credential_count DESC
        LIMIT 10
      `);
      return result.rows;
    });
    res.json(data);
  } catch (err) {
    console.error('Admin issuers error:', err);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
});

export default router;
