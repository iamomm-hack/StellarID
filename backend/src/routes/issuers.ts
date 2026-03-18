import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadToIPFS } from '../services/ipfs';
import { mintCredentialNFT, revokeCredential } from '../services/stellar';

const router = Router();

// GET / — List all verified issuers (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, stellar_address, credential_types,
              verified, logo_url, issuer_type, created_at
       FROM issuers
       WHERE verified = true
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch issuers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
});

// POST /:id/mint — Issuer mints a credential NFT for a user
router.post('/:id/mint', authMiddleware, async (req: AuthRequest, res: Response) => {
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
