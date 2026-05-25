import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { checkSubscriptionLimits } from '../middleware/subscription';
import { claimRateLimit } from '../middleware/rateLimiter';
import { uploadToIPFS } from '../services/ipfs';
import { mintCredentialNFT } from '../services/stellar';
import { sendClaimInvitationEmail, sendClaimConfirmationEmail } from '../services/email';
import { invalidateProfileCache } from '../services/redis';
import { calculateAndSaveUserReputation, recordActivity } from '../utils/reputation';

const router = Router();

// GET / — Get all credentials for authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT c.*, i.name as issuer_name, i.logo_url as issuer_logo_url,
              i.verified as issuer_verified
       FROM credentials c
       LEFT JOIN issuers i ON c.issuer_id = i.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [req.user!.id]
    );

    const credentials = result.rows.map((cred) => ({
      ...cred,
      issuer: {
        name: cred.issuer_name,
        logo_url: cred.issuer_logo_url,
        verified: cred.issuer_verified,
      },
      valid: !cred.revoked && !cred.expired &&
        (cred.expires_at ? new Date(cred.expires_at) > new Date() : true),
    }));

    res.json(credentials);
  } catch (err: any) {
    console.error('Fetch credentials error:', err.message);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

// POST /request — Request a new credential
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { issuerId, credentialType, claimData } = req.body;

    if (!issuerId || !credentialType || !claimData) {
      res.status(400).json({ error: 'Missing issuerId, credentialType, or claimData' });
      return;
    }

    // Verify issuer exists
    const issuerResult = await query(
      'SELECT id FROM issuers WHERE id = $1 AND verified = true',
      [issuerId]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found or not verified' });
      return;
    }

    const result = await query(
      `INSERT INTO verification_requests (platform_id, user_id, credential_type, claim_required)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [issuerId, req.user!.id, credentialType, JSON.stringify(claimData)]
    );

    res.status(201).json({
      requestId: result.rows[0].id,
      status: 'pending',
    });
  } catch (err: any) {
    console.error('Request credential error:', err.message);
    res.status(500).json({ error: 'Failed to request credential' });
  }
});

// POST /:id/generate-proof — Prepare for client-side proof generation
router.post('/:id/generate-proof', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { claimType, publicInputs } = req.body;

    // Verify credential belongs to user
    const result = await query(
      'SELECT * FROM credentials WHERE id = $1 AND user_id = $2',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Credential not found or not owned by user' });
      return;
    }

    const credential = result.rows[0];

    if (credential.revoked || credential.expired) {
      res.status(400).json({ error: 'Credential is revoked or expired' });
      return;
    }

    res.json({
      credentialId: id,
      credentialType: credential.credential_type,
      claimType,
      publicInputs,
      nftTokenId: credential.nft_token_id,
      message: 'Generate proof client-side using the ZK circuit',
    });
  } catch (err: any) {
    console.error('Generate proof error:', err.message);
    res.status(500).json({ error: 'Failed to prepare proof generation' });
  }
});

// DELETE /:id — Delete/unlink a credential
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify credential belongs to user
    const result = await query(
      'SELECT id FROM credentials WHERE id = $1 AND user_id = $2',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Credential not found' });
      return;
    }

    // Delete credential
    await query(
      'DELETE FROM credentials WHERE id = $1',
      [id]
    );

    // Invalidate profile cache
    if (req.user?.stellar_address) {
      await invalidateProfileCache(req.user.stellar_address);
    }

    res.json({ success: true, message: 'Credential deleted' });
  } catch (err: any) {
    console.error('Delete credential error:', err.message);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// POST /issue-with-email — Issue credential invitation via email
router.post('/issue-with-email', authMiddleware, checkSubscriptionLimits, async (req: AuthRequest, res: Response) => {
  try {
    const { issuerId, recipientEmail, recipientWallet, credentialData, credentialType, expiresAt } = req.body;

    if (!issuerId || !recipientEmail || !credentialData || !credentialType) {
      res.status(400).json({ error: 'Missing required fields: issuerId, recipientEmail, credentialData, or credentialType' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      res.status(400).json({ error: 'Invalid recipient email format' });
      return;
    }

    const issuerResult = await query(
      'SELECT id, name FROM issuers WHERE id = $1',
      [issuerId]
    );

    if (issuerResult.rows.length === 0) {
      res.status(404).json({ error: 'Issuer not found' });
      return;
    }

    const issuer = issuerResult.rows[0];

    let expirationDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
      res.status(400).json({ error: 'Invalid or past expiration date' });
      return;
    }

    const insertResult = await query(
      `INSERT INTO pending_credentials (issuer_id, recipient_email, recipient_wallet, credential_type, credential_data, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, claim_token, expires_at`,
      [
        issuerId,
        recipientEmail.toLowerCase(),
        recipientWallet || null,
        credentialType,
        JSON.stringify(credentialData),
        expirationDate
      ]
    );

    const pending = insertResult.rows[0];
    const claimUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim/${pending.claim_token}`;

    const emailSent = await sendClaimInvitationEmail(
      recipientEmail,
      issuer.name,
      credentialType,
      claimUrl,
      new Date(pending.expires_at)
    );

    res.status(201).json({
      success: true,
      pendingCredentialId: pending.id,
      claimToken: pending.claim_token,
      expiresAt: pending.expires_at,
      emailSent,
    });
  } catch (err: any) {
    console.error('Issue with email error:', err.message);
    res.status(500).json({ error: 'Failed to issue credential via email' });
  }
});

// GET /claim/:token — Fetch details of pending credential
router.get('/claim/:token', claimRateLimit, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      res.status(400).json({ error: 'Invalid token format' });
      return;
    }

    const result = await query(
      `SELECT pc.*, i.name as issuer_name, i.logo_url as issuer_logo_url, i.verified as issuer_verified
       FROM pending_credentials pc
       JOIN issuers i ON pc.issuer_id = i.id
       WHERE pc.claim_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Claim token not found or invalid' });
      return;
    }

    let pending = result.rows[0];

    if (pending.status === 'pending' && new Date(pending.expires_at) < new Date()) {
      await query("UPDATE pending_credentials SET status = 'expired' WHERE id = $1", [pending.id]);
      pending.status = 'expired';
    }

    if (pending.status === 'claimed' && pending.recipient_wallet) {
      const userRes = await query('SELECT id FROM users WHERE stellar_address = $1', [pending.recipient_wallet]);
      if (userRes.rows.length > 0) {
        const credRes = await query(
          'SELECT id FROM credentials WHERE user_id = $1 AND issuer_id = $2 AND credential_type = $3',
          [userRes.rows[0].id, pending.issuer_id, pending.credential_type]
        );
        if (credRes.rows.length === 0) {
          pending.status = 'pending';
        }
      } else {
        pending.status = 'pending';
      }
    }

    res.json({
      id: pending.id,
      recipientEmail: pending.recipient_email,
      recipientWallet: pending.recipient_wallet,
      credentialType: pending.credential_type,
      credentialData: pending.credential_data,
      expiresAt: pending.expires_at,
      status: pending.status,
      claimedAt: pending.claimed_at,
      issuer: {
        name: pending.issuer_name,
        logo_url: pending.issuer_logo_url,
        verified: pending.issuer_verified,
      }
    });
  } catch (err: any) {
    console.error('Fetch claim token error:', err.message);
    res.status(500).json({ error: 'Failed to fetch claim token details' });
  }
});

// POST /claim/:token — Claim pending credential on-chain
router.post('/claim/:token', claimRateLimit, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({ error: 'Missing walletAddress' });
      return;
    }

    const stellarAddressRegex = /^G[A-D2-7][A-Z2-7]{54}$/;
    if (!stellarAddressRegex.test(walletAddress)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      res.status(400).json({ error: 'Invalid token format' });
      return;
    }

    const result = await query(
      `SELECT pc.*, i.name as issuer_name FROM pending_credentials pc
       JOIN issuers i ON pc.issuer_id = i.id
       WHERE pc.claim_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Claim token not found or invalid' });
      return;
    }

    const pending = result.rows[0];

    if (pending.claim_attempts >= 5) {
      res.status(400).json({ error: 'Too many claim attempts. Please request a new credential.' });
      return;
    }

    await query('UPDATE pending_credentials SET claim_attempts = claim_attempts + 1 WHERE id = $1', [pending.id]);

    if (pending.status === 'claimed') {
      const userRes = await query('SELECT id FROM users WHERE stellar_address = $1', [walletAddress]);
      let hasIt = false;
      if (userRes.rows.length > 0) {
        const credRes = await query(
          'SELECT id FROM credentials WHERE user_id = $1 AND issuer_id = $2 AND credential_type = $3',
          [userRes.rows[0].id, pending.issuer_id, pending.credential_type]
        );
        if (credRes.rows.length > 0) {
          hasIt = true;
        }
      }
      if (hasIt) {
        res.status(400).json({ error: 'Credential has already been claimed' });
        return;
      }
    }

    if (pending.status === 'expired' || new Date(pending.expires_at) < new Date()) {
      if (pending.status !== 'expired') {
        await query("UPDATE pending_credentials SET status = 'expired' WHERE id = $1", [pending.id]);
      }
      res.status(400).json({ error: 'Claim link has expired' });
      return;
    }

    if (pending.recipient_wallet && pending.recipient_wallet.toLowerCase() !== walletAddress.toLowerCase()) {
      res.status(400).json({ error: 'This credential can only be claimed by the designated wallet address' });
      return;
    }

    let userResult = await query('SELECT id FROM users WHERE stellar_address = $1', [walletAddress]);
    let userId: string;
    if (userResult.rows.length === 0) {
      const newUser = await query(
        'INSERT INTO users (stellar_address, email) VALUES ($1, $2) RETURNING id',
        [walletAddress, pending.recipient_email]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
      await query('UPDATE users SET email = COALESCE(email, $1) WHERE id = $2', [pending.recipient_email, userId]);
    }

    let ipfsHash = '';
    try {
      ipfsHash = await uploadToIPFS(JSON.stringify(pending.credential_data));
    } catch (ipfsErr) {
      console.warn('IPFS upload failed, continuing without IPFS hash');
    }

    let txResult = { txHash: '', tokenId: 0 };
    try {
      const issuerSecret = process.env[`ISSUER_${pending.issuer_id}_SECRET`] || '';
      if (issuerSecret) {
        const expiresTimestamp = pending.expires_at
          ? Math.floor(new Date(pending.expires_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

        txResult = await mintCredentialNFT(
          issuerSecret,
          walletAddress,
          pending.credential_type,
          ipfsHash || 'no_ipfs',
          expiresTimestamp
        );
      } else {
        txResult = {
          txHash: 'sim_' + Math.random().toString(36).substring(2, 15),
          tokenId: Math.floor(Math.random() * 100000)
        };
      }
    } catch (stellarErr: any) {
      console.warn('Stellar mint failed, using simulation fallback:', stellarErr.message);
      txResult = {
        txHash: 'sim_' + Math.random().toString(36).substring(2, 15),
        tokenId: Math.floor(Math.random() * 100000)
      };
    }

    const credResult = await query(
      `INSERT INTO credentials (user_id, issuer_id, credential_type, claim_data,
                                nft_token_id, stellar_tx_hash, ipfs_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        pending.issuer_id,
        pending.credential_type,
        JSON.stringify(pending.credential_data),
        txResult.tokenId.toString(),
        txResult.txHash,
        ipfsHash,
        pending.expires_at
      ]
    );

    await query(
      `UPDATE pending_credentials
       SET status = 'claimed', claimed_at = NOW(), recipient_wallet = $1
       WHERE id = $2`,
      [walletAddress, pending.id]
    );

    // Invalidate profile cache
    await invalidateProfileCache(walletAddress);

    // Record activity for claim and update reputation/badges/leaderboard
    try {
      await recordActivity(walletAddress, 'claim_credential');
      await calculateAndSaveUserReputation(walletAddress);
    } catch (repErr) {
      console.error('Failed to update reputation/activity on claim:', repErr);
    }

    await sendClaimConfirmationEmail(
      pending.recipient_email,
      pending.credential_type,
      txResult.txHash
    );

    res.json({
      success: true,
      credentialId: credResult.rows[0].id,
      nftTokenId: txResult.tokenId,
      txHash: txResult.txHash,
    });
  } catch (err: any) {
    console.error('Claim credential error:', err.message);
    res.status(500).json({ error: 'Failed to claim credential' });
  }
});

export default router;
