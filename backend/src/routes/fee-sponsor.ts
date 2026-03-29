import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getSponsorStatus } from '../services/stellar';

const router = Router();

/**
 * GET /api/v1/fee-sponsor/status
 * Get fee sponsor account status and remaining capacity
 */
router.get('/status', async (_req, res: Response) => {
  try {
    const status = await getSponsorStatus();
    
    res.json({
      success: true,
      sponsor: {
        address: status.address,
        balance: status.balance,
        canSponsor: status.canSponsor,
        transactionsRemaining: status.transactionsRemaining,
        feePerTransaction: '0.01 XLM',
      },
      message: status.canSponsor 
        ? 'Fee sponsorship is available' 
        : 'Fee sponsorship is currently unavailable',
    });
  } catch (err: any) {
    console.error('Fee sponsor status error:', err);
    res.status(500).json({ error: 'Failed to get sponsor status' });
  }
});

/**
 * GET /api/v1/fee-sponsor/info
 * Public info about fee sponsorship feature
 */
router.get('/info', (_req, res: Response) => {
  res.json({
    feature: 'Fee Sponsorship (Gasless Transactions)',
    description: 'StellarID sponsors transaction fees so users never pay gas',
    benefits: [
      'Zero transaction costs for users',
      'Seamless credential minting experience',
      'No XLM required in user wallet for operations',
    ],
    howItWorks: [
      '1. User initiates credential mint or proof generation',
      '2. StellarID builds the transaction',
      '3. Fee sponsor account covers all network fees',
      '4. User receives credential without paying anything',
    ],
    technicalDetails: {
      method: 'Stellar Fee Bump Transactions',
      maxFeePerTx: '100000 stroops (0.01 XLM)',
      sponsorAccount: process.env.FEE_SPONSOR_PUBLIC || 'Not configured',
    },
  });
});

/**
 * POST /api/v1/fee-sponsor/request
 * Request fee sponsorship for a transaction (authenticated)
 */
router.post('/request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { transactionType } = req.body;
    
    if (!transactionType) {
      res.status(400).json({ error: 'Transaction type required' });
      return;
    }

    const status = await getSponsorStatus();
    
    if (!status.canSponsor) {
      res.status(503).json({ 
        error: 'Fee sponsorship temporarily unavailable',
        retryAfter: 3600,
      });
      return;
    }

    // In production, this would create a sponsorship ticket
    res.json({
      success: true,
      sponsorshipToken: `sponsor_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      validFor: 300, // 5 minutes
      transactionType,
      message: 'Your transaction fees will be sponsored',
    });
  } catch (err: any) {
    console.error('Fee sponsorship request error:', err);
    res.status(500).json({ error: 'Failed to process sponsorship request' });
  }
});

export default router;
