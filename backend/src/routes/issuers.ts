import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { checkSubscriptionLimits } from '../middleware/subscription';
import { uploadToIPFS } from '../services/ipfs';
import { mintCredentialNFT, revokeCredential } from '../services/stellar';
import { verifyDomainDNS } from '../utils/dns';
import { sendDomainVerificationEmail, sendEndorsementReceivedEmail } from '../services/email';
import crypto from 'crypto';

const router = Router();

// GET / — List all issuers (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, stellar_address, credential_types,
              verified, logo_url, issuer_type, created_at,
              verification_status, domain, domain_verified, endorsement_count
       FROM issuers
       ORDER BY 
         CASE 
           WHEN verification_status = 'official_verified' THEN 1
           WHEN verification_status = 'community_verified' THEN 2
           ELSE 3
         END ASC, 
         name ASC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch issuers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
});

// GET /me — Get current user's issuer profile (private)
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, stellar_address, credential_types,
              verified, logo_url, issuer_type, created_at,
              verification_status, domain, domain_verified, endorsement_count,
              domain_verification_token
       FROM issuers
       WHERE stellar_address = $1`,
      [req.user!.stellar_address]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No issuer profile found for this wallet address' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Fetch own issuer error:', err.message);
    res.status(500).json({ error: 'Failed to fetch own issuer profile' });
  }
});

// GET /me/analytics — Get issuer stats & metrics (private)
router.get('/me/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Fetch issuer profile using stellar_address
    const issuerRes = await query(
      'SELECT id, subscription_tier FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'No issuer profile found for this wallet' });
      return;
    }

    const issuerId = issuerRes.rows[0].id;
    const tier = issuerRes.rows[0].subscription_tier || 'free';

    // 2. Fetch credential status counts
    const credStatsRes = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN revoked = true THEN 1 END) as revoked,
        COUNT(CASE WHEN expires_at < NOW() AND expired = true THEN 1 END) as expired,
        COUNT(CASE WHEN revoked = false AND (expires_at IS NULL OR expires_at >= NOW()) THEN 1 END) as active
       FROM credentials 
       WHERE issuer_id = $1`,
      [issuerId]
    );
    const credStats = credStatsRes.rows[0] || { total: 0, revoked: 0, expired: 0, active: 0 };

    // 3. Fetch pending vs claimed email credentials
    const pendingStatsRes = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed
       FROM pending_credentials 
       WHERE issuer_id = $1`,
      [issuerId]
    );
    const pendingStats = pendingStatsRes.rows[0] || { total: 0, pending: 0, claimed: 0 };

    // 4. Fetch daily issuance for the last 30 days
    const dailyIssuanceRes = await query(
      `SELECT 
        TO_CHAR(issued_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
       FROM credentials
       WHERE issuer_id = $1 AND issued_at >= NOW() - INTERVAL '30 days'
       GROUP BY TO_CHAR(issued_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [issuerId]
    );

    // 5. Fetch bulk job summaries
    const bulkJobsRes = await query(
      `SELECT 
        COUNT(*) as total_jobs,
        COALESCE(SUM(total_recipients), 0) as total_recipients,
        COALESCE(SUM(success_count), 0) as total_success,
        COALESCE(SUM(failed_count), 0) as total_failed
       FROM bulk_issuance_jobs
       WHERE issuer_id = $1`,
      [issuerId]
    );
    const bulkStats = bulkJobsRes.rows[0] || { total_jobs: 0, total_recipients: 0, total_success: 0, total_failed: 0 };

    // 6. Fetch developer API usage logs over the last 7 days
    const apiUsageRes = await query(
      `SELECT 
        TO_CHAR(l.created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count,
        ROUND(AVG(l.response_time_ms)) as avg_response_time
       FROM api_usage_logs l
       JOIN api_keys k ON l.api_key_id = k.id
       WHERE k.issuer_id = $1 AND l.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(l.created_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [issuerId]
    );

    // 7. Active developer keys count
    const apiKeysCountRes = await query(
      `SELECT COUNT(*) as count FROM api_keys WHERE issuer_id = $1 AND revoked_at IS NULL`,
      [issuerId]
    );
    const apiKeysCount = apiKeysCountRes.rows[0]?.count || 0;

    res.json({
      tier,
      credentials: {
        total: parseInt(credStats.total || '0'),
        revoked: parseInt(credStats.revoked || '0'),
        expired: parseInt(credStats.expired || '0'),
        active: parseInt(credStats.active || '0'),
      },
      claiming: {
        total: parseInt(pendingStats.total || '0'),
        pending: parseInt(pendingStats.pending || '0'),
        claimed: parseInt(pendingStats.claimed || '0'),
      },
      dailyIssuance: dailyIssuanceRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count || '0')
      })),
      bulkJobs: {
        totalJobs: parseInt(bulkStats.total_jobs || '0'),
        totalRecipients: parseInt(bulkStats.total_recipients || '0'),
        totalSuccess: parseInt(bulkStats.total_success || '0'),
        totalFailed: parseInt(bulkStats.total_failed || '0'),
      },
      apiKeys: {
        activeCount: parseInt(apiKeysCount || '0'),
      },
      apiUsage: apiUsageRes.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count || '0'),
        avgResponseTimeMs: parseInt(r.avg_response_time || '0')
      }))
    });

  } catch (err: any) {
    console.error('Fetch issuer analytics error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issuer analytics' });
  }
});

// POST /register — Register a new issuer profile (private)
router.post('/register', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, logo_url, credential_types, domain } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Issuer name is required' });
      return;
    }

    // Check if issuer profile already exists
    const existing = await query(
      'SELECT id FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ error: 'An issuer profile already exists for this wallet address' });
      return;
    }

    // Insert new issuer profile
    const result = await query(
      `INSERT INTO issuers (name, description, stellar_address, credential_types, logo_url, domain, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'unverified')
       RETURNING *`,
      [
        name,
        description || '',
        req.user!.stellar_address,
        JSON.stringify(credential_types || []),
        logo_url || '',
        domain || null
      ]
    );

    // Seed default trust score
    await query(
      `INSERT INTO issuer_trust_scores (issuer_id, base_score, trust_score)
       VALUES ($1, 0.10, 0.10)
       ON CONFLICT (issuer_id) DO NOTHING`,
      [result.rows[0].id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Register issuer error:', err.message);
    res.status(500).json({ error: 'Failed to register issuer profile' });
  }
});

// POST /:id/request-domain-verification — Claim domain & get verification token (private)
router.post('/:id/request-domain-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { domain } = req.body;

    if (!domain) {
      res.status(400).json({ error: 'Domain is required' });
      return;
    }

    // Verify ownership
    const issuerResult = await query(
      'SELECT * FROM issuers WHERE id = $1 AND stellar_address = $2',
      [id, req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found or access denied' });
      return;
    }

    const token = `stellarid-verify-${crypto.randomUUID()}`;

    await query(
      `UPDATE issuers 
       SET domain = $1, domain_verification_token = $2, domain_verified = false, verification_status = 'unverified'
       WHERE id = $3`,
      [domain.trim().toLowerCase(), token, id]
    );

    res.json({
      domain,
      verificationToken: token,
      instructions: `Create a DNS TXT record for ${domain} with the value: ${token}`
    });
  } catch (err: any) {
    console.error('Request domain verification error:', err.message);
    res.status(500).json({ error: 'Failed to request domain verification' });
  }
});

// POST /:id/confirm-domain-verification — Check DNS TXT record (private)
router.post('/:id/confirm-domain-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const issuerResult = await query(
      'SELECT * FROM issuers WHERE id = $1 AND stellar_address = $2',
      [id, req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found or access denied' });
      return;
    }

    const issuer = issuerResult.rows[0];
    if (!issuer.domain || !issuer.domain_verification_token) {
      res.status(400).json({ error: 'No verification request active for this issuer' });
      return;
    }

    const isValid = await verifyDomainDNS(issuer.domain, issuer.domain_verification_token);
    if (!isValid) {
      res.status(400).json({ error: `Verification token not found in DNS TXT records for ${issuer.domain}` });
      return;
    }

    await query(
      `UPDATE issuers
       SET domain_verified = true, verification_status = 'official_verified', verified = true, 
           domain_verified_at = NOW(), verification_date = NOW()
       WHERE id = $1`,
      [id]
    );

    // Also update trust score record
    await query(
      `UPDATE issuer_trust_scores
       SET official_verified = true, trust_score = GREATEST(trust_score, 0.80)
       WHERE issuer_id = $1`,
      [id]
    );

    res.json({ success: true, message: `Domain ${issuer.domain} verified successfully. Tier updated to Official Verified.` });
  } catch (err: any) {
    console.error('Confirm domain verification error:', err.message);
    res.status(500).json({ error: 'Failed to verify domain' });
  }
});

// POST /:id/request-email-verification — Request email fallback verification (private)
router.post('/:id/request-email-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email address is required' });
      return;
    }

    const issuerResult = await query(
      'SELECT * FROM issuers WHERE id = $1 AND stellar_address = $2',
      [id, req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found or access denied' });
      return;
    }

    const issuer = issuerResult.rows[0];
    if (!issuer.domain) {
      res.status(400).json({ error: 'Claim a domain first before requesting email verification' });
      return;
    }

    // Validate email domain matches claimed domain
    const emailDomain = email.split('@')[1];
    if (!emailDomain || emailDomain.toLowerCase() !== issuer.domain.toLowerCase()) {
      res.status(400).json({ error: `Email address must end with @${issuer.domain}` });
      return;
    }

    const token = crypto.randomUUID();

    // Store token in verification token column
    await query(
      'UPDATE issuers SET domain_verification_token = $1 WHERE id = $2',
      [token, id]
    );

    // Send email
    const sent = await sendDomainVerificationEmail(email, issuer.domain, token);
    if (!sent) {
      res.status(500).json({ error: 'Failed to send verification email' });
      return;
    }

    res.json({ success: true, message: `Verification email sent to ${email}.` });
  } catch (err: any) {
    console.error('Request email verification error:', err.message);
    res.status(500).json({ error: 'Failed to request email verification' });
  }
});

// POST /:id/confirm-email-verification — Confirm email token (private)
router.post('/:id/confirm-email-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const issuerResult = await query(
      'SELECT * FROM issuers WHERE id = $1 AND stellar_address = $2',
      [id, req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found or access denied' });
      return;
    }

    const issuer = issuerResult.rows[0];
    if (issuer.domain_verification_token !== token) {
      res.status(400).json({ error: 'Invalid verification token' });
      return;
    }

    await query(
      `UPDATE issuers
       SET domain_verified = true, verification_status = 'official_verified', verified = true, 
           domain_verified_at = NOW(), verification_date = NOW()
       WHERE id = $1`,
      [id]
    );

    // Also update trust score record
    await query(
      `UPDATE issuer_trust_scores
       SET official_verified = true, trust_score = GREATEST(trust_score, 0.80)
       WHERE issuer_id = $1`,
      [id]
    );

    res.json({ success: true, message: `Domain ${issuer.domain} verified via email. Tier updated to Official Verified.` });
  } catch (err: any) {
    console.error('Confirm email verification error:', err.message);
    res.status(500).json({ error: 'Failed to confirm email verification' });
  }
});

// POST /:id/endorse — Endorse another issuer (private)
router.post('/:id/endorse', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id: targetIssuerId } = req.params;

    // 1. Verify caller has a verified issuer account
    const callerResult = await query(
      'SELECT id, name, verification_status, verified FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (callerResult.rows.length === 0) {
      res.status(403).json({ error: 'You must register as an issuer to endorse others' });
      return;
    }

    const callerIssuer = callerResult.rows[0];
    const isCallerVerified = 
      callerIssuer.verification_status === 'official_verified' || 
      callerIssuer.verification_status === 'community_verified' ||
      callerIssuer.verified === true;

    if (!isCallerVerified) {
      res.status(403).json({ error: 'Only verified issuers can endorse peer issuers' });
      return;
    }

    // 2. Prevent self-endorsement
    if (callerIssuer.id === targetIssuerId) {
      res.status(400).json({ error: 'You cannot endorse your own issuer profile' });
      return;
    }

    // 3. Verify target exists
    const targetResult = await query(
      'SELECT * FROM issuers WHERE id = $1',
      [targetIssuerId]
    );

    if (targetResult.rows.length === 0) {
      res.status(404).json({ error: 'Target issuer not found' });
      return;
    }

    const targetIssuer = targetResult.rows[0];

    // 4. Create endorsement (unique key prevents duplicates)
    try {
      await query(
        'INSERT INTO issuer_endorsements (endorser_issuer_id, endorsed_issuer_id) VALUES ($1, $2)',
        [callerIssuer.id, targetIssuerId]
      );
    } catch (dbErr: any) {
      if (dbErr.code === '23505') { // Unique violation
        res.status(400).json({ error: 'You have already endorsed this issuer' });
        return;
      }
      throw dbErr;
    }

    // 5. Update target endorsement count
    const updateResult = await query(
      `UPDATE issuers
       SET endorsement_count = endorsement_count + 1
       WHERE id = $1
       RETURNING endorsement_count, verification_status`,
      [targetIssuerId]
    );

    const newCount = updateResult.rows[0].endorsement_count;
    let newStatus = updateResult.rows[0].verification_status;

    // 6. Check automatic tier upgrade (5+ endorsements)
    if (newCount >= 5 && targetIssuer.verification_status === 'unverified') {
      await query(
        `UPDATE issuers
         SET verification_status = 'community_verified', verified = true, verification_date = NOW()
         WHERE id = $1`,
        [targetIssuerId]
      );
      newStatus = 'community_verified';
      
      // Update trust score record
      await query(
        `UPDATE issuer_trust_scores
         SET community_endorsements = $1, trust_score = GREATEST(trust_score, 0.50)
         WHERE issuer_id = $2`,
        [newCount, targetIssuerId]
      );
    } else {
      // Just update endorsements count in trust scores
      await query(
        `UPDATE issuer_trust_scores
         SET community_endorsements = $1
         WHERE issuer_id = $2`,
        [newCount, targetIssuerId]
      );
    }

    // 7. Try sending email notification to target issuer
    try {
      const targetUser = await query(
        'SELECT email FROM users WHERE stellar_address = $1',
        [targetIssuer.stellar_address]
      );
      if (targetUser.rows.length > 0 && targetUser.rows[0].email) {
        await sendEndorsementReceivedEmail(
          targetUser.rows[0].email,
          callerIssuer.name,
          targetIssuer.name
        );
      }
    } catch (emailErr) {
      console.warn('Failed to send endorsement email notification:', emailErr);
    }

    res.json({
      success: true,
      endorsementCount: newCount,
      verificationStatus: newStatus
    });
  } catch (err: any) {
    console.error('Endorse issuer error:', err.message);
    res.status(500).json({ error: 'Failed to endorse issuer' });
  }
});

// GET /:id/endorsements — Get list of endorsers for an issuer (public)
router.get('/:id/endorsements', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT i.id, i.name, i.logo_url, i.domain, i.verification_status
       FROM issuer_endorsements ie
       JOIN issuers i ON ie.endorser_issuer_id = i.id
       WHERE ie.endorsed_issuer_id = $1
       ORDER BY i.name ASC`,
      [id]
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch endorsements error:', err.message);
    res.status(500).json({ error: 'Failed to fetch endorsements' });
  }
});

// GET /:id/public — Get public metadata profile (public)
router.get('/:id/public', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT i.id, i.name, i.description, i.stellar_address, i.logo_url, i.domain,
              i.verification_status, i.domain_verified, i.endorsement_count, i.created_at,
              COALESCE(t.trust_score, 0.10) as trust_score,
              COALESCE(t.credentials_issued, 0) as credentials_issued
       FROM issuers i
       LEFT JOIN issuer_trust_scores t ON i.id = t.issuer_id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Fetch public issuer metadata error:', err.message);
    res.status(500).json({ error: 'Failed to fetch public issuer metadata' });
  }
});

// POST /:id/mint — Issuer mints a credential NFT for a user
router.post('/:id/mint', authMiddleware, checkSubscriptionLimits, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, credentialType, claimData, expiresAt } = req.body;

    if (!userId || !credentialType || !claimData) {
      res.status(400).json({ error: 'Missing userId, credentialType, or claimData' });
      return;
    }

    // Verify issuer exists
    const issuerResult = await query(
      'SELECT * FROM issuers WHERE id = $1',
      [id]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found' });
      return;
    }

    const issuer = issuerResult.rows[0];

    // Upload encrypted claim data to IPFS
    let ipfsHash = '';
    try {
      ipfsHash = await uploadToIPFS(JSON.stringify(claimData));
    } catch (ipfsErr) {
      console.warn('IPFS upload failed, continuing without IPFS hash');
    }

    // Mint credential NFT on Stellar
    let txResult = { txHash: '', tokenId: 0 };
    try {
      // Use issuer's secret key from env or DB (simplified for demo)
      const issuerSecret = process.env[`ISSUER_${id}_SECRET`] || '';
      if (issuerSecret) {
        const expiresTimestamp = expiresAt
          ? Math.floor(new Date(expiresAt).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

        txResult = await mintCredentialNFT(
          issuerSecret,
          req.user!.stellar_address,
          credentialType,
          ipfsHash || 'no_ipfs',
          expiresTimestamp
        );
      }
    } catch (stellarErr: any) {
      console.warn('Stellar mint failed:', stellarErr.message);
    }

    // Store in database
    const credResult = await query(
      `INSERT INTO credentials (user_id, issuer_id, credential_type, claim_data,
                                nft_token_id, stellar_tx_hash, ipfs_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        id,
        credentialType,
        JSON.stringify(claimData),
        txResult.tokenId.toString(),
        txResult.txHash,
        ipfsHash,
        expiresAt || null,
      ]
    );

    // Update reputation stats
    await query(
      `UPDATE issuer_trust_scores
       SET credentials_issued = credentials_issued + 1
       WHERE issuer_id = $1`,
      [id]
    );

    res.status(201).json({
      credentialId: credResult.rows[0].id,
      nftTokenId: txResult.tokenId,
      txHash: txResult.txHash,
      ipfsHash,
    });
  } catch (err: any) {
    console.error('Mint credential error:', err.message);
    res.status(500).json({ error: 'Failed to mint credential' });
  }
});

// POST /:id/revoke/:credentialId — Issuer revokes a credential
router.post('/:id/revoke/:credentialId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id, credentialId } = req.params;

    // Verify issuer owns this credential
    const credResult = await query(
      'SELECT * FROM credentials WHERE id = $1 AND issuer_id = $2',
      [credentialId, id]
    );

    if (credResult.rows.length === 0) {
      res.status(404).json({ error: 'Credential not found for this issuer' });
      return;
    }

    // Revoke on Stellar
    let txHash = '';
    try {
      const issuerSecret = process.env[`ISSUER_${id}_SECRET`] || '';
      if (issuerSecret && credResult.rows[0].nft_token_id) {
        txHash = await revokeCredential(
          issuerSecret,
          parseInt(credResult.rows[0].nft_token_id)
        );
      }
    } catch (stellarErr: any) {
      console.warn('Stellar revoke failed:', stellarErr.message);
    }

    // Update database
    await query(
      `UPDATE credentials SET revoked = true, revoked_at = NOW()
       WHERE id = $1`,
      [credentialId]
    );

    // Update reputation stats
    await query(
      `UPDATE issuer_trust_scores
       SET credentials_revoked = credentials_revoked + 1
       WHERE issuer_id = $1`,
      [id]
    );

    res.json({
      revoked: true,
      credentialId,
      txHash,
    });
  } catch (err: any) {
    console.error('Revoke credential error:', err.message);
    res.status(500).json({ error: 'Failed to revoke credential' });
  }
});

export default router;
