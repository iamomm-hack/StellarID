import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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

    res.json({ success: true, message: 'Credential deleted' });
  } catch (err: any) {
    console.error('Delete credential error:', err.message);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

export default router;
