import { Router, Response } from 'express';
import { query } from '../db';
import { apiKeyMiddleware, ApiKeyRequest } from '../middleware/apiKey';
import { verifyRateLimit } from '../middleware/rateLimiter';
import { verifyProof } from '../services/zkVerifier';
import { checkCredentialValidity } from '../services/stellar';

const router = Router();

// POST / — Verify a ZK proof
router.post('/', verifyRateLimit, apiKeyMiddleware, async (req: ApiKeyRequest, res: Response) => {
  try {
    const { credentialId, proofType, proof, publicSignals } = req.body;

    if (!credentialId || !proofType || !proof || !publicSignals) {
      res.status(400).json({
        error: 'Missing credentialId, proofType, proof, or publicSignals',
      });
      return;
    }

    // Verify ZK proof
    let proofValid = false;
    try {
      proofValid = await verifyProof(proof, publicSignals, proofType);
    } catch (zkErr: any) {
      console.error('ZK verification error:', zkErr.message);
      res.status(400).json({ error: 'Invalid proof format' });
      return;
    }

    // Check credential validity on-chain
    let credentialValid = true;
    try {
      credentialValid = await checkCredentialValidity(
        typeof credentialId === 'number' ? credentialId : parseInt(credentialId)
      );
    } catch (stellarErr: any) {
      console.warn('On-chain check failed, using DB fallback');
      const dbResult = await query(
        'SELECT revoked, expired, expires_at FROM credentials WHERE id = $1',
        [credentialId]
      );
      if (dbResult.rows.length > 0) {
        const cred = dbResult.rows[0];
        credentialValid = !cred.revoked && !cred.expired &&
          (cred.expires_at ? new Date(cred.expires_at) > new Date() : true);
      }
    }

    const verified = proofValid && credentialValid;

    // Log verification request
    await query(
      `INSERT INTO verification_requests (platform_id, credential_type, claim_required, zk_proof, verified, completed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        req.platform!.id,
        proofType,
        proofType,
        JSON.stringify({ proof, publicSignals }),
        verified,
      ]
    );

    // NEVER return personal data — only boolean result
    res.json({
      verified,
      claim: proofType,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Verification error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /credential/:id/status — Check credential validity
router.get('/credential/:id/status', apiKeyMiddleware, async (req: ApiKeyRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check DB first
    const dbResult = await query(
      'SELECT revoked, expired, expires_at FROM credentials WHERE id = $1',
      [id]
    );

    if (dbResult.rows.length === 0) {
      res.status(404).json({ valid: false, reason: 'credential_not_found' });
      return;
    }

    const cred = dbResult.rows[0];

    if (cred.revoked) {
      res.json({ valid: false, reason: 'credential_revoked' });
      return;
    }

    if (cred.expired || (cred.expires_at && new Date(cred.expires_at) <= new Date())) {
      res.json({ valid: false, reason: 'credential_expired' });
      return;
    }

    res.json({ valid: true });
  } catch (err: any) {
    console.error('Credential status error:', err.message);
    res.status(500).json({ error: 'Failed to check credential status' });
  }
});

export default router;
