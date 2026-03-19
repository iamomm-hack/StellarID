import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateProofPDF } from '../services/pdf';

const router = Router();

// POST / — create a proof record
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { credentialId, circuitType, claimType, proofTimeMs } = req.body;

    if (!circuitType) {
      res.status(400).json({ error: 'circuitType is required' });
      return;
    }

    const publicToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const result = await query(
      `INSERT INTO proof_records (user_id, credential_id, circuit_type, claim_type, status, proof_time_ms, public_token, expires_at)
       VALUES ($1, $2, $3, $4, 'verified', $5, $6, $7)
       RETURNING id, circuit_type, claim_type, status, public_token, created_at, proof_time_ms, expires_at`,
      [req.user!.id, credentialId || null, circuitType, claimType || circuitType, proofTimeMs || null, publicToken, expiresAt]
    );

    const proof = result.rows[0];

    res.status(201).json({
      id: proof.id,
      circuitType: proof.circuit_type,
      claimType: proof.claim_type,
      status: proof.status,
      publicToken: proof.public_token,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${proof.public_token}`,
      createdAt: proof.created_at,
      expiresAt: proof.expires_at,
    });
  } catch (err) {
    console.error('Create proof error:', err);
    res.status(500).json({ error: 'Failed to create proof record' });
  }
});

// GET /:token — fetch proof by public token (public endpoint)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || token.length !== 64) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const result = await query(
      `SELECT id, circuit_type, claim_type, status, created_at, proof_time_ms, public_token, expires_at
       FROM proof_records WHERE public_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Proof not found' });
      return;
    }

    const proof = result.rows[0];

    // Check expiry
    if (proof.expires_at && new Date(proof.expires_at) < new Date()) {
      res.json({
        id: proof.id,
        circuitType: proof.circuit_type,
        claimType: proof.claim_type,
        status: 'expired',
        createdAt: proof.created_at,
        proofTimeMs: proof.proof_time_ms,
        expiresAt: proof.expires_at,
      });
      return;
    }

    res.json({
      id: proof.id,
      circuitType: proof.circuit_type,
      claimType: proof.claim_type,
      status: proof.status,
      createdAt: proof.created_at,
      proofTimeMs: proof.proof_time_ms,
      expiresAt: proof.expires_at,
    });
  } catch (err) {
    console.error('Fetch proof error:', err);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
});

// GET /:token/pdf — download PDF
router.get('/:token/pdf', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT id, circuit_type, claim_type, status, created_at, proof_time_ms, public_token
       FROM proof_records WHERE public_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Proof not found' });
      return;
    }

    const proof = result.rows[0];
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=StellarID-Proof-${token.substring(0, 8)}.pdf`);

    const pdfStream = generateProofPDF(proof, baseUrl);
    pdfStream.pipe(res);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
