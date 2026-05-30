import { Router, Response } from 'express';
import { query } from '../db';
import { apiKeyAuth, ApiKeyRequest, logApiUsage } from '../middleware/apiKeyAuth';
import { apiKeyRateLimiter } from '../middleware/rateLimiter';
import { getCache, setCache } from '../services/redis';
import { calculateAndSaveUserReputation } from '../utils/reputation';
import { getIssuerSubscriptionStatus } from '../middleware/subscription';

const router = Router();

// Apply API key auth + rate limiter to all routes
router.use(apiKeyAuth() as any);
router.use(apiKeyRateLimiter() as any);

/**
 * GET /api/v1/public/verify/:wallet_address
 * Returns full reputation + credentials for a wallet.
 * Requires 'verify' permission.
 */
router.get('/verify/:wallet_address', async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    const { wallet_address } = req.params;

    // Permission check
    if (!req.apiKey?.permissions.includes('verify')) {
      res.status(403).json({ error: 'API key does not have "verify" permission' });
      logApiUsage(req.apiKey!.id, '/verify', 'GET', 403, Date.now() - start);
      return;
    }

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      logApiUsage(req.apiKey!.id, '/verify', 'GET', 400, Date.now() - start);
      return;
    }

    // Check cache
    const cacheKey = `public_api_verify_${wallet_address}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      logApiUsage(req.apiKey!.id, '/verify', 'GET', 200, Date.now() - start);
      return;
    }

    // Calculate reputation
    const reputation = await calculateAndSaveUserReputation(wallet_address);

    // Fetch credentials
    const credRes = await query(
      `SELECT c.id, c.credential_type as name, c.claim_data, c.issued_at, c.expires_at,
              c.revoked, c.expired, c.stellar_tx_hash,
              i.name as issuer_name, i.verified as issuer_verified,
              i.verification_status as issuer_verification_status
       FROM credentials c
       LEFT JOIN issuers i ON c.issuer_id = i.id
       JOIN users u ON c.user_id = u.id
       WHERE u.stellar_address = $1
       ORDER BY c.issued_at DESC`,
      [wallet_address]
    );

    const data = {
      wallet_address,
      reputation_score: reputation.total_score,
      tier: reputation.tier,
      credential_count: reputation.credential_count,
      verified: reputation.total_score > 0,
      credentials: credRes.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        issuer_name: row.issuer_name || 'Unknown',
        issuer_verified: row.issuer_verified || false,
        issuer_verification_status: row.issuer_verification_status || 'unverified',
        issued_at: row.issued_at,
        expires_at: row.expires_at,
        status: row.revoked ? 'revoked' : row.expired ? 'expired' : 'active',
        tx_hash: row.stellar_tx_hash,
      })),
      last_updated: new Date().toISOString(),
    };

    // Cache for 5 minutes
    await setCache(cacheKey, JSON.stringify(data), 300);

    res.json(data);
    logApiUsage(req.apiKey!.id, '/verify', 'GET', 200, Date.now() - start);
  } catch (err: any) {
    console.error('Public API verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
    logApiUsage(req.apiKey?.id || '', '/verify', 'GET', 500, Date.now() - start);
  }
});

/**
 * POST /api/v1/public/credentials/issue
 * Issue a credential via email. Creates a pending credential + sends claim email.
 * Requires 'issue' permission.
 */
router.post('/credentials/issue', async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    if (!req.apiKey?.permissions.includes('issue')) {
      res.status(403).json({ error: 'API key does not have "issue" permission' });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 403, Date.now() - start);
      return;
    }

    const { recipient_email, recipient_wallet, credential } = req.body;

    if (!recipient_email || typeof recipient_email !== 'string') {
      res.status(400).json({ error: 'recipient_email is required' });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 400, Date.now() - start);
      return;
    }

    if (!credential || !credential.name) {
      res.status(400).json({ error: 'credential.name is required' });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 400, Date.now() - start);
      return;
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient_email)) {
      res.status(400).json({ error: 'Invalid email format' });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 400, Date.now() - start);
      return;
    }

    // Validate wallet address if provided
    if (recipient_wallet && !/^G[A-Z2-7]{55}$/.test(recipient_wallet)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 400, Date.now() - start);
      return;
    }

    const issuerId = req.apiKey!.issuer_id;

    // Check subscription limits
    const subStatus = await getIssuerSubscriptionStatus(issuerId);
    if (subStatus.totalUsed + 1 > subStatus.limits.maxCredentialsPerMonth) {
      res.status(402).json({
        error: 'Subscription limit exceeded',
        message: `Your current subscription plan (${subStatus.limits.name}) allows up to ${subStatus.limits.maxCredentialsPerMonth} credentials per month. You have already used ${subStatus.totalUsed}. Please upgrade your plan via StellarID dashboard.`,
      });
      logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 402, Date.now() - start);
      return;
    }

    // Calculate expiry (default 30 days)
    const expiresAt = credential.expires_at
      ? new Date(credential.expires_at)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create pending credential
    const credData = {
      name: credential.name,
      description: credential.description || '',
      issuer_name: req.apiKeyIssuer?.name || 'Unknown Issuer',
      metadata: credential.metadata || {},
    };

    const result = await query(
      `INSERT INTO pending_credentials 
       (issuer_id, recipient_email, recipient_wallet, credential_type, credential_data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, claim_token, created_at`,
      [issuerId, recipient_email, recipient_wallet || null, credential.name, JSON.stringify(credData), expiresAt]
    );

    const pending = result.rows[0];
    const claimBaseUrl = process.env.CLAIM_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const claimUrl = `${claimBaseUrl}/claim/${pending.claim_token}`;

    // Send claim email (fire-and-forget)
    try {
      const { sendClaimInvitationEmail } = await import('../services/email');
      sendClaimInvitationEmail(
        recipient_email,
        credData.issuer_name,
        credData.name,
        claimUrl,
        expiresAt
      ).catch((emailErr: any) => {
        console.error('[Public API] Email send error:', emailErr.message);
      });
    } catch (emailImportErr: any) {
      console.error('[Public API] Email service import error:', emailImportErr.message);
    }

    res.status(201).json({
      success: true,
      pending_credential_id: pending.id,
      claim_token: pending.claim_token,
      claim_url: claimUrl,
      expires_at: expiresAt.toISOString(),
      created_at: pending.created_at,
    });

    logApiUsage(req.apiKey!.id, '/credentials/issue', 'POST', 201, Date.now() - start);
  } catch (err: any) {
    console.error('Public API issue error:', err.message);
    res.status(500).json({ error: 'Failed to issue credential' });
    logApiUsage(req.apiKey?.id || '', '/credentials/issue', 'POST', 500, Date.now() - start);
  }
});

/**
 * GET /api/v1/public/credentials/:credential_id
 * Get credential details + status.
 * Requires 'read_profile' permission.
 */
router.get('/credentials/:credential_id', async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    if (!req.apiKey?.permissions.includes('read_profile')) {
      res.status(403).json({ error: 'API key does not have "read_profile" permission' });
      logApiUsage(req.apiKey!.id, '/credentials/:id', 'GET', 403, Date.now() - start);
      return;
    }

    const { credential_id } = req.params;

    const result = await query(
      `SELECT c.id, c.credential_type as name, c.claim_data, c.issued_at, c.expires_at,
              c.revoked, c.revoked_at, c.expired, c.stellar_tx_hash, c.ipfs_hash, c.nft_token_id,
              i.name as issuer_name, i.verified as issuer_verified,
              i.verification_status as issuer_verification_status,
              u.stellar_address as wallet_address
       FROM credentials c
       LEFT JOIN issuers i ON c.issuer_id = i.id
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [credential_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Credential not found' });
      logApiUsage(req.apiKey!.id, '/credentials/:id', 'GET', 404, Date.now() - start);
      return;
    }

    const cred = result.rows[0];

    // Check if a ZK proof exists for this credential
    const proofRes = await query(
      `SELECT id, circuit_type, status, public_token, created_at, expires_at
       FROM proof_records
       WHERE credential_id = $1 AND status = 'verified'
       ORDER BY created_at DESC LIMIT 1`,
      [credential_id]
    );

    const data = {
      id: cred.id,
      name: cred.name,
      claim_data: cred.claim_data,
      wallet_address: cred.wallet_address,
      issuer: {
        name: cred.issuer_name || 'Unknown',
        verified: cred.issuer_verified || false,
        verification_status: cred.issuer_verification_status || 'unverified',
      },
      status: cred.revoked ? 'revoked' : cred.expired ? 'expired' : 'active',
      issued_at: cred.issued_at,
      expires_at: cred.expires_at,
      revoked_at: cred.revoked_at,
      on_chain: {
        tx_hash: cred.stellar_tx_hash,
        ipfs_hash: cred.ipfs_hash,
        nft_token_id: cred.nft_token_id,
      },
      zk_proof_available: proofRes.rows.length > 0,
      zk_proof: proofRes.rows.length > 0 ? {
        proof_id: proofRes.rows[0].id,
        circuit_type: proofRes.rows[0].circuit_type,
        public_token: proofRes.rows[0].public_token,
        verified_at: proofRes.rows[0].created_at,
      } : null,
    };

    res.json(data);
    logApiUsage(req.apiKey!.id, '/credentials/:id', 'GET', 200, Date.now() - start);
  } catch (err: any) {
    console.error('Public API credential error:', err.message);
    res.status(500).json({ error: 'Failed to fetch credential' });
    logApiUsage(req.apiKey?.id || '', '/credentials/:id', 'GET', 500, Date.now() - start);
  }
});

/**
 * GET /api/v1/public/proof/:credential_id
 * Get ZK proof data for selective disclosure verification.
 * Requires 'verify' permission.
 */
router.get('/proof/:credential_id', async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    if (!req.apiKey?.permissions.includes('verify')) {
      res.status(403).json({ error: 'API key does not have "verify" permission' });
      logApiUsage(req.apiKey!.id, '/proof/:id', 'GET', 403, Date.now() - start);
      return;
    }

    const { credential_id } = req.params;

    const result = await query(
      `SELECT pr.id, pr.circuit_type, pr.claim_type, pr.status, pr.public_token,
              pr.proof_time_ms, pr.created_at, pr.expires_at,
              c.credential_type as credential_name,
              i.name as issuer_name
       FROM proof_records pr
       JOIN credentials c ON pr.credential_id = c.id
       LEFT JOIN issuers i ON c.issuer_id = i.id
       WHERE pr.credential_id = $1 AND pr.status = 'verified'
       ORDER BY pr.created_at DESC
       LIMIT 1`,
      [credential_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        error: 'No verified ZK proof found for this credential',
        hint: 'The credential owner must generate a proof first via their StellarID dashboard.',
      });
      logApiUsage(req.apiKey!.id, '/proof/:id', 'GET', 404, Date.now() - start);
      return;
    }

    const proof = result.rows[0];

    // Build verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/verify/${proof.public_token}`;

    res.json({
      proof_id: proof.id,
      credential_name: proof.credential_name,
      issuer_name: proof.issuer_name,
      circuit_type: proof.circuit_type,
      claim_type: proof.claim_type,
      status: proof.status,
      public_token: proof.public_token,
      verification_url: verifyUrl,
      proof_time_ms: proof.proof_time_ms,
      created_at: proof.created_at,
      expires_at: proof.expires_at,
      valid: proof.status === 'verified' && (!proof.expires_at || new Date(proof.expires_at) > new Date()),
    });

    logApiUsage(req.apiKey!.id, '/proof/:id', 'GET', 200, Date.now() - start);
  } catch (err: any) {
    console.error('Public API proof error:', err.message);
    res.status(500).json({ error: 'Failed to fetch proof' });
    logApiUsage(req.apiKey?.id || '', '/proof/:id', 'GET', 500, Date.now() - start);
  }
});

/**
 * POST /api/v1/public/embed/badge
 * Get embedding HTML code and URL for a wallet's reputation badge.
 * Requires 'verify' or 'read_profile' permission.
 */
router.post('/embed/badge', async (req: ApiKeyRequest, res: Response): Promise<void> => {
  const start = Date.now();
  try {
    const { wallet_address, style = 'dark', size = 'md' } = req.body;

    // Permission check
    const hasPermission = req.apiKey?.permissions.includes('verify') || req.apiKey?.permissions.includes('read_profile');
    if (!hasPermission) {
      res.status(403).json({ error: 'API key does not have "verify" or "read_profile" permission' });
      logApiUsage(req.apiKey!.id, '/embed/badge', 'POST', 403, Date.now() - start);
      return;
    }

    if (!wallet_address || !/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid or missing Stellar wallet address format' });
      logApiUsage(req.apiKey!.id, '/embed/badge', 'POST', 400, Date.now() - start);
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const iframeUrl = `${frontendUrl}/embed/badge/${wallet_address}?style=${style}&size=${size}`;

    let width = 300;
    let height = 80;
    if (size === 'sm') {
      width = 240;
      height = 60;
    } else if (size === 'lg') {
      width = 360;
      height = 100;
    }

    const html = `<iframe src="${iframeUrl}" width="${width}" height="${height}" style="border:none;overflow:hidden;border-radius:12px;" scrolling="no" frameborder="0" allowTransparency="true"></iframe>`;

    res.json({
      html,
      iframe_url: iframeUrl,
    });
    logApiUsage(req.apiKey!.id, '/embed/badge', 'POST', 200, Date.now() - start);
  } catch (err: any) {
    console.error('Public API embed badge error:', err.message);
    res.status(500).json({ error: 'Failed to generate embed code' });
    logApiUsage(req.apiKey?.id || '', '/embed/badge', 'POST', 500, Date.now() - start);
  }
});

export default router;
