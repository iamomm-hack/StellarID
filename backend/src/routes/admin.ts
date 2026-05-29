import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendVerificationRevokedEmail } from '../services/email';

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

// POST /issuers/:id/verify-official — Admin overrides status to Official Verified
router.post('/issuers/:id/verify-official', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE issuers
       SET verification_status = 'official_verified', verified = true, verification_date = NOW(), verified_by = $1,
           domain_verified = true, domain_verified_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.user!.id, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found' });
      return;
    }

    // Update trust scores
    await query(
      `UPDATE issuer_trust_scores
       SET official_verified = true, trust_score = GREATEST(trust_score, 0.85)
       WHERE issuer_id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Issuer verified officially by admin', issuer: result.rows[0] });
  } catch (err: any) {
    console.error('Admin verify official error:', err.message);
    res.status(500).json({ error: 'Failed to verify issuer officially' });
  }
});

// POST /issuers/:id/revoke-verification — Admin revokes status back to unverified with reason
router.post('/issuers/:id/revoke-verification', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: 'Reason for revocation is required' });
      return;
    }

    const result = await query(
      `UPDATE issuers
       SET verification_status = 'unverified', verified = false, verification_date = NULL, verified_by = NULL,
           domain_verified = false, domain_verified_at = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found' });
      return;
    }

    const issuer = result.rows[0];

    // Reset trust scores
    await query(
      `UPDATE issuer_trust_scores
       SET official_verified = false, trust_score = 0.10
       WHERE issuer_id = $1`,
      [id]
    );

    // Try notifying the issuer
    try {
      const userResult = await query(
        'SELECT email FROM users WHERE stellar_address = $1',
        [issuer.stellar_address]
      );
      if (userResult.rows.length > 0 && userResult.rows[0].email) {
        await sendVerificationRevokedEmail(userResult.rows[0].email, issuer.name, reason);
      }
    } catch (emailErr) {
      console.warn('Failed to send revocation email:', emailErr);
    }

    res.json({ success: true, message: 'Issuer verification status revoked', issuer });
  } catch (err: any) {
    console.error('Admin revoke verification error:', err.message);
    res.status(500).json({ error: 'Failed to revoke verification status' });
  }
});

// GET /issuers — List all registered issuers with subscription tier details
router.get('/issuers', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, stellar_address, logo_url,
              verified, verification_status, domain, domain_verified, endorsement_count,
              subscription_tier, subscription_status, subscription_expires_at, created_at
       FROM issuers
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error('Admin fetch issuers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
});

// POST /issuers/:id/mock-upgrade — Directly upgrade an issuer's subscription tier
router.post('/issuers/:id/mock-upgrade', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;

    if (!tier || !['free', 'pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier specified' });
      return;
    }

    const result = await query(
      `UPDATE issuers 
       SET subscription_tier = $1, 
           subscription_status = 'active',
           subscription_expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $2
       RETURNING *`,
      [tier, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    console.log(`[Admin Billing] Upgraded Issuer ID ${id} directly to tier: ${tier} by Admin ID ${req.user!.id}`);

    res.json({
      success: true,
      message: `Successfully upgraded issuer to ${tier} tier`,
      tier,
      issuer: result.rows[0],
    });
  } catch (err: any) {
    console.error('Admin mock upgrade error:', err.message);
    res.status(500).json({ error: 'Failed to process mock upgrade' });
  }
});

export default router;
