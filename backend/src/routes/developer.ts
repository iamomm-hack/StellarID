import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/developer/keys
 * Generate a new API key for the authenticated issuer.
 * Returns the full key ONCE — only the hash is stored.
 */
router.post('/keys', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Key name is required' });
      return;
    }

    // Find the issuer associated with this user
    const issuerRes = await query(
      `SELECT i.id FROM issuers i
       JOIN users u ON u.stellar_address = i.stellar_address
       WHERE u.id = $1`,
      [userId]
    );

    if (issuerRes.rows.length === 0) {
      res.status(403).json({
        error: 'You must be a registered issuer to create API keys',
        hint: 'Register as an issuer first at /dashboard/issuer-verification',
      });
      return;
    }

    const issuerId = issuerRes.rows[0].id;

    // Check key limit (max 10 active keys per issuer)
    const keyCountRes = await query(
      'SELECT COUNT(*)::int as total FROM api_keys WHERE issuer_id = $1 AND revoked_at IS NULL',
      [issuerId]
    );
    if (keyCountRes.rows[0].total >= 10) {
      res.status(400).json({ error: 'Maximum 10 active API keys per issuer. Revoke an existing key first.' });
      return;
    }

    // Generate Stripe-style key: sid_live_{32 random hex chars}
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const fullKey = `sid_live_${randomBytes}`;
    const keyPrefix = fullKey.substring(0, 16); // "sid_live_" + first 8 hex chars

    // Hash the key for storage
    const keyHash = await bcrypt.hash(fullKey, 10);

    // Valid permissions
    const validPermissions = ['verify', 'read_profile', 'issue'];
    const keyPermissions = Array.isArray(permissions)
      ? permissions.filter((p: string) => validPermissions.includes(p))
      : ['verify', 'read_profile'];

    if (keyPermissions.length === 0) {
      keyPermissions.push('verify', 'read_profile');
    }

    const result = await query(
      `INSERT INTO api_keys (issuer_id, key_hash, key_prefix, name, permissions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, key_prefix, name, permissions, rate_limit_per_hour, created_at`,
      [issuerId, keyHash, keyPrefix, name.trim(), keyPermissions]
    );

    const created = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'API key created. Save this key — it will not be shown again.',
      key: fullKey, // ONLY returned once
      key_id: created.id,
      key_prefix: created.key_prefix,
      name: created.name,
      permissions: created.permissions,
      rate_limit_per_hour: created.rate_limit_per_hour,
      created_at: created.created_at,
    });
  } catch (err: any) {
    console.error('Error creating API key:', err.message);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * GET /api/v1/developer/keys
 * List all API keys for the authenticated issuer (prefix only, never full key).
 */
router.get('/keys', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const issuerRes = await query(
      `SELECT i.id FROM issuers i
       JOIN users u ON u.stellar_address = i.stellar_address
       WHERE u.id = $1`,
      [userId]
    );

    if (issuerRes.rows.length === 0) {
      res.status(200).json({ keys: [] });
      return;
    }

    const issuerId = issuerRes.rows[0].id;

    const result = await query(
      `SELECT id, key_prefix, name, permissions, rate_limit_per_hour, 
              last_used_at, created_at, revoked_at
       FROM api_keys
       WHERE issuer_id = $1
       ORDER BY created_at DESC`,
      [issuerId]
    );

    res.json({
      keys: result.rows.map((row: any) => ({
        id: row.id,
        key_prefix: row.key_prefix + '...',
        name: row.name,
        permissions: row.permissions,
        rate_limit_per_hour: row.rate_limit_per_hour,
        last_used_at: row.last_used_at,
        created_at: row.created_at,
        revoked: !!row.revoked_at,
        revoked_at: row.revoked_at,
      })),
    });
  } catch (err: any) {
    console.error('Error listing API keys:', err.message);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

/**
 * DELETE /api/v1/developer/keys/:id
 * Revoke an API key.
 */
router.delete('/keys/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const keyId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify ownership
    const result = await query(
      `UPDATE api_keys SET revoked_at = NOW()
       WHERE id = $1 
       AND revoked_at IS NULL
       AND issuer_id IN (
         SELECT i.id FROM issuers i
         JOIN users u ON u.stellar_address = i.stellar_address
         WHERE u.id = $2
       )
       RETURNING id, key_prefix, name`,
      [keyId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'API key not found or already revoked' });
      return;
    }

    res.json({
      success: true,
      message: 'API key revoked successfully',
      key: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error revoking API key:', err.message);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/**
 * GET /api/v1/developer/usage/stats
 * Usage analytics for the authenticated issuer's API keys.
 */
router.get('/usage/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const issuerRes = await query(
      `SELECT i.id FROM issuers i
       JOIN users u ON u.stellar_address = i.stellar_address
       WHERE u.id = $1`,
      [userId]
    );

    if (issuerRes.rows.length === 0) {
      res.json({
        total_calls: 0,
        calls_today: 0,
        calls_this_week: 0,
        by_endpoint: [],
        by_day: [],
        by_status: [],
        active_keys: 0,
      });
      return;
    }

    const issuerId = issuerRes.rows[0].id;

    // Total calls
    const totalRes = await query(
      `SELECT COUNT(*)::int as total
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1`,
      [issuerId]
    );

    // Calls today
    const todayRes = await query(
      `SELECT COUNT(*)::int as total
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE`,
      [issuerId]
    );

    // Calls this week
    const weekRes = await query(
      `SELECT COUNT(*)::int as total
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [issuerId]
    );

    // By endpoint (top 10)
    const endpointRes = await query(
      `SELECT l.endpoint, l.method, COUNT(*)::int as calls
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY l.endpoint, l.method
       ORDER BY calls DESC
       LIMIT 10`,
      [issuerId]
    );

    // Calls per day (last 30 days)
    const dailyRes = await query(
      `SELECT DATE(l.created_at) as day, COUNT(*)::int as calls
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(l.created_at)
       ORDER BY day ASC`,
      [issuerId]
    );

    // By status code
    const statusRes = await query(
      `SELECT l.response_status, COUNT(*)::int as calls
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY l.response_status
       ORDER BY calls DESC`,
      [issuerId]
    );

    // Active keys count
    const keysRes = await query(
      'SELECT COUNT(*)::int as total FROM api_keys WHERE issuer_id = $1 AND revoked_at IS NULL',
      [issuerId]
    );

    // Average response time
    const avgTimeRes = await query(
      `SELECT ROUND(AVG(l.response_time_ms))::int as avg_ms
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= CURRENT_DATE - INTERVAL '7 days'`,
      [issuerId]
    );

    res.json({
      total_calls: totalRes.rows[0]?.total || 0,
      calls_today: todayRes.rows[0]?.total || 0,
      calls_this_week: weekRes.rows[0]?.total || 0,
      avg_response_time_ms: avgTimeRes.rows[0]?.avg_ms || 0,
      active_keys: keysRes.rows[0]?.total || 0,
      by_endpoint: endpointRes.rows,
      by_day: dailyRes.rows.map((r: any) => ({
        date: r.day,
        calls: r.calls,
      })),
      by_status: statusRes.rows.map((r: any) => ({
        status: r.response_status,
        calls: r.calls,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching usage stats:', err.message);
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

export default router;
