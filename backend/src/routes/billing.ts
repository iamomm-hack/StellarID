import { Router, Request, Response } from 'express';
import * as StellarSdk from 'stellar-sdk';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIssuerSubscriptionStatus } from '../middleware/subscription';
import { server } from '../services/stellar';

const router = Router();

// Stellar pricing configurations (in XLM)
const STELLAR_PRICES = {
  pro: '50.0000000', // 50 XLM
  enterprise: '250.0000000', // 250 XLM
};

// USDC pricing configurations (in USDC)
const USDC_PRICES = {
  pro: '10.0000000', // 10 USDC
  enterprise: '50.0000000', // 50 USDC
};

const isPublicNetwork = process.env.STELLAR_PASSPHRASE === 'Public Global Stellar Network ; October 2015';
const USDC_ASSET_CODE = 'USDC';
const USDC_ASSET_ISSUER = isPublicNetwork
  ? 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
  : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const USDC_ASSET = new StellarSdk.Asset(USDC_ASSET_CODE, USDC_ASSET_ISSUER);

const BILLING_DESTINATION_ADDRESS = process.env.BILLING_DESTINATION_ADDRESS || 'GBMQJ3G5LDWODZKUUQWGGT6NIKMM7KL5NLHVIG53WLNLWB27Z4AKH3F4';

const IS_MOCK_MODE = true;

/**
 * GET /status
 * Fetch current subscription details, usage stats, and limits
 */
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issuerRes = await query(
      'SELECT id, subscription_expires_at, stripe_subscription_id FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    const { id, subscription_expires_at, stripe_subscription_id } = issuerRes.rows[0];

    const status = await getIssuerSubscriptionStatus(id);
    res.json({
      ...status,
      expiresAt: subscription_expires_at,
      stripeSubscriptionId: stripe_subscription_id,
      mockMode: IS_MOCK_MODE,
      stellarPrices: STELLAR_PRICES,
      usdcPrices: USDC_PRICES,
      usdcAssetCode: USDC_ASSET_CODE,
      usdcAssetIssuer: USDC_ASSET_ISSUER,
      billingDestinationAddress: BILLING_DESTINATION_ADDRESS,
    });
  } catch (err: any) {
    console.error('Error fetching billing status:', err.message);
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

/**
 * POST /checkout-session
 * Mock checkout session endpoint
 */
router.post('/checkout-session', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tier } = req.body;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid subscription tier selected' });
      return;
    }

    res.json({
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?mock_checkout_success=true&tier=${tier}`,
      mock: true,
    });
  } catch (err: any) {
    console.error('Error creating mock checkout session:', err.message);
    res.status(500).json({ error: 'Failed to create mock checkout session' });
  }
});

/**
 * POST /portal-session
 * Mock portal session endpoint
 */
router.post('/portal-session', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(400).json({
    error: 'Portal Unavailable',
    message: 'Subscription management portal is unavailable as Stripe is disabled.',
  });
});

/**
 * POST /mock-upgrade
 * Bypass payments and directly upgrade the issuer plan (for sandbox/testing)
 */
router.post('/mock-upgrade', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tier } = req.body;

    if (!tier || !['free', 'pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid tier specified' });
      return;
    }

    const issuerRes = await query(
      'SELECT id FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    const issuerId = issuerRes.rows[0].id;

    // Direct DB update
    await query(
      `UPDATE issuers 
       SET subscription_tier = $1, 
           subscription_status = 'active',
           subscription_expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $2`,
      [tier, issuerId]
    );

    console.log(`[Mock Billing] Upgraded Issuer ${issuerId} directly to tier: ${tier}`);

    res.json({
      success: true,
      message: `Successfully upgraded to ${tier} tier in mock mode`,
      tier,
    });
  } catch (err: any) {
    console.error('Mock upgrade error:', err.message);
    res.status(500).json({ error: 'Failed to process mock upgrade' });
  }
});

/**
 * POST /webhook
 * Stripe webhook stub (Stripe disabled)
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  res.status(400).send('Stripe is disabled.');
});

// Webhook stub is defined above, removing duplicate/broken leftovers.

/**
 * POST /prepare-stellar-payment
 * Build an unsigned Stellar payment transaction for a subscription tier
 */
router.post('/prepare-stellar-payment', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tier, senderAddress, paymentToken = 'xlm' } = req.body;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid subscription tier selected' });
      return;
    }

    if (!senderAddress || !StellarSdk.StrKey.isValidEd25519PublicKey(senderAddress)) {
      res.status(400).json({ error: 'Invalid Stellar sender address' });
      return;
    }

    if (!['xlm', 'usdc'].includes(paymentToken)) {
      res.status(400).json({ error: 'Invalid payment token type. Must be "xlm" or "usdc"' });
      return;
    }

    if (!BILLING_DESTINATION_ADDRESS) {
      res.status(500).json({ error: 'Billing destination address is not configured on the server.' });
      return;
    }

    // Load account sequence number
    let account;
    try {
      account = await server.loadAccount(senderAddress);
    } catch (err: any) {
      res.status(404).json({
        error: 'Sender account not active',
        message: 'The Stellar account must be funded and active on the network before upgrading.'
      });
      return;
    }

    const price = paymentToken === 'usdc'
      ? USDC_PRICES[tier as 'pro' | 'enterprise']
      : STELLAR_PRICES[tier as 'pro' | 'enterprise'];

    const asset = paymentToken === 'usdc'
      ? USDC_ASSET
      : StellarSdk.Asset.native();

    // Build the transaction
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_PASSPHRASE || StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: BILLING_DESTINATION_ADDRESS,
          asset: asset,
          amount: price,
        })
      )
      .addMemo(StellarSdk.Memo.text(`stellarid_sub_${tier}`))
      .setTimeout(300)
      .build();

    res.json({
      xdr: tx.toXDR(),
      amount: price,
      paymentToken,
      destination: BILLING_DESTINATION_ADDRESS,
    });
  } catch (err: any) {
    console.error('Error preparing Stellar payment:', err.message);
    res.status(500).json({ error: 'Failed to prepare payment transaction' });
  }
});

/**
 * POST /submit-stellar-payment
 * Submit the signed Stellar transaction and upgrade subscription
 */
router.post('/submit-stellar-payment', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { signedXdr, tier } = req.body;

    if (!signedXdr) {
      res.status(400).json({ error: 'Missing signed transaction XDR' });
      return;
    }

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid subscription tier' });
      return;
    }

    // Parse the transaction
    const tx = new StellarSdk.Transaction(
      signedXdr,
      process.env.STELLAR_PASSPHRASE || StellarSdk.Networks.TESTNET
    );

    // Security Check: Transaction source must match the user's logged-in address
    if (tx.source !== req.user!.stellar_address) {
      res.status(400).json({
        error: 'Invalid signer',
        message: 'The signing wallet address does not match your active session.'
      });
      return;
    }

    // Security Check: Transaction structure and destination verification
    if (tx.operations.length === 0) {
      res.status(400).json({ error: 'Invalid transaction: no operations found' });
      return;
    }

    const op = tx.operations[0];
    if (op.type !== 'payment') {
      res.status(400).json({ error: 'Invalid transaction: first operation must be a payment' });
      return;
    }

    const paymentOp = op as StellarSdk.Operation.Payment;
    if (paymentOp.destination !== BILLING_DESTINATION_ADDRESS) {
      res.status(400).json({ error: 'Invalid transaction: incorrect destination address' });
      return;
    }

    // Verify correct asset and amount matches tier pricing
    let isValidPayment = false;
    const nativePrice = STELLAR_PRICES[tier as 'pro' | 'enterprise'];
    const usdcPrice = USDC_PRICES[tier as 'pro' | 'enterprise'];

    if (paymentOp.asset.isNative()) {
      if (paymentOp.amount === nativePrice) {
        isValidPayment = true;
      }
    } else if (
      paymentOp.asset.code === USDC_ASSET_CODE &&
      paymentOp.asset.issuer === USDC_ASSET_ISSUER
    ) {
      if (paymentOp.amount === usdcPrice) {
        isValidPayment = true;
      }
    }

    if (!isValidPayment) {
      res.status(400).json({
        error: 'Invalid transaction details',
        message: 'The payment amount or asset type does not match the subscription pricing tier.'
      });
      return;
    }

    // Submit transaction
    let submissionResult;
    try {
      submissionResult = await server.submitTransaction(tx);
    } catch (submitErr: any) {
      const resultCodes = submitErr.response?.data?.extras?.result_codes;
      console.error('Horizon submission failed:', submitErr.message, resultCodes);
      res.status(400).json({
        error: 'Transaction failed',
        message: 'Failed to submit transaction to the Stellar network.',
        details: resultCodes || submitErr.message,
      });
      return;
    }

    // Get the issuer
    const issuerRes = await query(
      'SELECT id FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    const issuerId = issuerRes.rows[0].id;

    // Direct DB update to upgrade subscription
    await query(
      `UPDATE issuers 
       SET subscription_tier = $1, 
           subscription_status = 'active',
           stripe_subscription_id = $2,
           stripe_customer_id = $3,
           subscription_expires_at = NOW() + INTERVAL '30 days'
       WHERE id = $4`,
      [tier, `stellar_tx_${submissionResult.hash}`, req.user!.stellar_address, issuerId]
    );

    console.log(`[Stellar Billing] Upgraded Issuer ${issuerId} to ${tier} via Stellar payment: ${submissionResult.hash}`);

    res.json({
      success: true,
      txHash: submissionResult.hash,
      tier,
    });
  } catch (err: any) {
    console.error('Error submitting Stellar payment:', err.message);
    res.status(500).json({ error: 'Failed to complete Stellar payment subscription' });
  }
});

export default router;
