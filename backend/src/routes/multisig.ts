import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { query } from '../db';
import {
  createMultiSigCredentialRequest,
  addSignatureToRequest,
  getMultiSigRequestStatus,
} from '../services/stellar';

const router = Router();

/**
 * POST /api/v1/multisig/request
 * Create a new multi-sig credential approval request
 */
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { credentialType, claimData, requiredSigners, threshold } = req.body;
    
    if (!credentialType || !requiredSigners || !threshold) {
      res.status(400).json({ 
        error: 'credentialType, requiredSigners, and threshold are required' 
      });
      return;
    }

    if (!Array.isArray(requiredSigners) || requiredSigners.length < 2) {
      res.status(400).json({ 
        error: 'At least 2 signers required for multi-sig' 
      });
      return;
    }

    if (threshold < 1 || threshold > requiredSigners.length) {
      res.status(400).json({ 
        error: `Threshold must be between 1 and ${requiredSigners.length}` 
      });
      return;
    }

    // Create the multi-sig request
    const msigRequest = await createMultiSigCredentialRequest(
      {
        ownerAddress: req.user!.stellar_address,
        credentialType,
        claimHash: claimData?.hash || '',
        expiresAt: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year
      },
      requiredSigners,
      threshold
    );

    // Store in database
    await query(
      `INSERT INTO multisig_requests 
       (request_id, owner_id, credential_type, required_signers, threshold, transaction_xdr, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [
        msigRequest.requestId,
        req.user!.id,
        credentialType,
        JSON.stringify(requiredSigners),
        threshold,
        msigRequest.transaction,
      ]
    );

    res.status(201).json({
      success: true,
      request: {
        requestId: msigRequest.requestId,
        requiredSignatures: msigRequest.requiredSignatures,
        signers: msigRequest.signers,
        status: 'pending',
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      message: 'Multi-sig credential request created. Awaiting signatures.',
    });
  } catch (err: any) {
    console.error('MultiSig request error:', err);
    res.status(500).json({ error: 'Failed to create multi-sig request' });
  }
});

/**
 * POST /api/v1/multisig/sign/:requestId
 * Add a signature to a multi-sig request
 */
router.post('/sign/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { signature } = req.body;
    
    if (!signature) {
      res.status(400).json({ error: 'Signature required' });
      return;
    }

    // Verify request exists and user is authorized signer
    const requestResult = await query(
      'SELECT * FROM multisig_requests WHERE request_id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const request = requestResult.rows[0];
    const requiredSigners = JSON.parse(request.required_signers);
    
    if (!requiredSigners.includes(req.user!.stellar_address)) {
      res.status(403).json({ error: 'You are not an authorized signer for this request' });
      return;
    }

    // Add signature
    const result = await addSignatureToRequest(
      requestId,
      req.user!.stellar_address,
      signature
    );

    // Update database
    await query(
      `INSERT INTO multisig_signatures (request_id, signer_address, signature, signed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (request_id, signer_address) DO NOTHING`,
      [requestId, req.user!.stellar_address, signature]
    );

    // Check if threshold met
    const signaturesResult = await query(
      'SELECT COUNT(*) as count FROM multisig_signatures WHERE request_id = $1',
      [requestId]
    );
    const sigCount = parseInt(signaturesResult.rows[0].count);

    if (sigCount >= request.threshold) {
      // Mark as approved and issue credential
      await query(
        "UPDATE multisig_requests SET status = 'approved', approved_at = NOW() WHERE request_id = $1",
        [requestId]
      );

      res.json({
        success: true,
        status: 'approved',
        message: 'Threshold met! Credential will be issued.',
        signaturesCollected: sigCount,
        signaturesRequired: request.threshold,
      });
      return;
    }

    res.json({
      success: true,
      status: 'pending',
      message: 'Signature added successfully',
      signaturesCollected: sigCount,
      signaturesRequired: request.threshold,
      remainingSignatures: request.threshold - sigCount,
    });
  } catch (err: any) {
    console.error('MultiSig sign error:', err);
    res.status(500).json({ error: 'Failed to add signature' });
  }
});

/**
 * GET /api/v1/multisig/request/:requestId
 * Get status of a multi-sig request
 */
router.get('/request/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;

    const requestResult = await query(
      'SELECT * FROM multisig_requests WHERE request_id = $1',
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    const request = requestResult.rows[0];
    
    // Get signatures
    const signaturesResult = await query(
      'SELECT signer_address, signed_at FROM multisig_signatures WHERE request_id = $1',
      [requestId]
    );

    const requiredSigners = JSON.parse(request.required_signers);
    const signedAddresses = signaturesResult.rows.map((r: any) => r.signer_address);

    res.json({
      requestId: request.request_id,
      credentialType: request.credential_type,
      status: request.status,
      threshold: request.threshold,
      signaturesCollected: signaturesResult.rows.length,
      signers: requiredSigners.map((addr: string) => ({
        address: addr,
        signed: signedAddresses.includes(addr),
        signedAt: signaturesResult.rows.find((r: any) => r.signer_address === addr)?.signed_at,
      })),
      createdAt: request.created_at,
      approvedAt: request.approved_at,
    });
  } catch (err: any) {
    console.error('MultiSig status error:', err);
    res.status(500).json({ error: 'Failed to get request status' });
  }
});

/**
 * GET /api/v1/multisig/pending
 * Get all pending multi-sig requests for the current user
 */
router.get('/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get requests where user is owner or required signer
    const result = await query(
      `SELECT mr.*, 
              (SELECT COUNT(*) FROM multisig_signatures ms WHERE ms.request_id = mr.request_id) as signatures_count
       FROM multisig_requests mr
       WHERE mr.status = 'pending'
         AND (mr.owner_id = $1 OR mr.required_signers::text LIKE $2)
       ORDER BY mr.created_at DESC`,
      [req.user!.id, `%${req.user!.stellar_address}%`]
    );

    res.json({
      pendingRequests: result.rows.map((r: any) => ({
        requestId: r.request_id,
        credentialType: r.credential_type,
        threshold: r.threshold,
        signaturesCollected: parseInt(r.signatures_count),
        requiredSigners: JSON.parse(r.required_signers),
        createdAt: r.created_at,
      })),
      total: result.rows.length,
    });
  } catch (err: any) {
    console.error('MultiSig pending error:', err);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
});

/**
 * GET /api/v1/multisig/info
 * Public info about multi-sig feature
 */
router.get('/info', (_req, res: Response) => {
  res.json({
    feature: 'Multi-Signature Credential Approval',
    description: 'High-value credentials require multiple party approval before issuance',
    benefits: [
      'Enhanced security for sensitive credentials',
      'Distributed trust - no single point of failure',
      'Audit trail of all approvals',
      'Configurable threshold (2-of-3, 3-of-5, etc.)',
    ],
    useCases: [
      'Corporate identity verification (HR + Manager approval)',
      'Academic credentials (University + Department)',
      'Professional licenses (Board + Examiner)',
      'High-value financial credentials',
    ],
    howItWorks: [
      '1. Initiator creates credential request with list of required signers',
      '2. Each signer reviews and signs the request',
      '3. When threshold is met, credential is automatically issued',
      '4. All signatures are recorded on Stellar blockchain',
    ],
  });
});

export default router;
