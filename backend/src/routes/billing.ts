import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import * as StellarSdk from 'stellar-sdk';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getIssuerSubscriptionStatus } from '../middleware/subscription';
import { server } from '../services/stellar';

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-00' as any, // standard API version
}) : null;

// Pricing configurations
const TIER_PRICES = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_mock_pro',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_mock_enterprise',
};

// Stellar pricing configurations (in XLM)
const STELLAR_PRICES = {
  pro: '50.0000000', // 50 XLM
  enterprise: '250.0000000', // 250 XLM
};

const FEE_SPONSOR_SECRET = process.env.FEE_SPONSOR_SECRET || '';
const BILLING_DESTINATION_ADDRESS = process.env.BILLING_DESTINATION_ADDRESS ||
  (FEE_SPONSOR_SECRET ? StellarSdk.Keypair.fromSecret(FEE_SPONSOR_SECRET).publicKey() : '');

const IS_MOCK_MODE = !stripe;

if (IS_MOCK_MODE) {
  console.log('⚠️ Stripe Secret Key missing. StellarID Billing is running in Developer Mock Mode.');
}

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
      billingDestinationAddress: BILLING_DESTINATION_ADDRESS,
    });
  } catch (err: any) {
    console.error('Error fetching billing status:', err.message);
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

/**
 * POST /checkout-session
 * Create a Stripe checkout session or simulate a mock upgrade
 */
router.post('/checkout-session', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tier } = req.body;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid subscription tier selected' });
      return;
    }

    const issuerRes = await query(
      'SELECT id, name FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    const issuer = issuerRes.rows[0];

    if (IS_MOCK_MODE) {
      // In Mock Mode, return a simulated mock URL redirecting to a success indicator
      res.json({
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?mock_checkout_success=true&tier=${tier}`,
        mock: true,
      });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const priceId = tier === 'pro' ? TIER_PRICES.pro : TIER_PRICES.enterprise;

    if (priceId.startsWith('price_mock_')) {
      res.status(500).json({
        error: 'Stripe Config Error',
        message: 'Stripe is enabled, but Price IDs are not configured. Check STRIPE_PRO_PRICE_ID and STRIPE_ENTERPRISE_PRICE_ID.',
      });
      return;
    }

    // Check if issuer already has a Stripe customer ID
    const customerRes = await query('SELECT stripe_customer_id FROM issuers WHERE id = $1', [issuer.id]);
    let customerId = customerRes.rows[0]?.stripe_customer_id;

    if (!customerId && stripe) {
      const customer = await stripe.customers.create({
        email: req.user!.email || undefined,
        name: issuer.name,
        metadata: {
          issuerId: issuer.id,
          stellarAddress: req.user!.stellar_address,
        },
      });
      customerId = customer.id;
      await query('UPDATE issuers SET stripe_customer_id = $1 WHERE id = $2', [customerId, issuer.id]);
    }

    if (!stripe) {
      res.status(500).json({ error: 'Stripe initialization failed' });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${frontendUrl}/dashboard/billing?checkout_success=true`,
      cancel_url: `${frontendUrl}/dashboard/billing?checkout_cancel=true`,
      client_reference_id: issuer.id,
      metadata: {
        issuerId: issuer.id,
        targetTier: tier,
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /portal-session
 * Launch the Stripe Customer Portal for subscription management
 */
router.post('/portal-session', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const issuerRes = await query(
      'SELECT stripe_customer_id FROM issuers WHERE stellar_address = $1',
      [req.user!.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(404).json({ error: 'Issuer profile not found' });
      return;
    }

    const customerId = issuerRes.rows[0].stripe_customer_id;

    if (IS_MOCK_MODE || !customerId) {
      res.status(400).json({
        error: 'Portal Unavailable',
        message: 'No Stripe Customer associated with this issuer. Subscription management portal is unavailable in Mock Mode.',
      });
      return;
    }

    if (!stripe) {
      res.status(500).json({ error: 'Stripe initialization failed' });
      return;
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`,
    });

    res.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Error creating billing portal session:', err.message);
    res.status(500).json({ error: 'Failed to open subscription management portal' });
  }
});

/**
 * POST /mock-upgrade
 * Bypass Stripe and directly upgrade the issuer plan (for sandbox/testing)
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
 * Handle Stripe webhook events to keep database tiers in sync
 */
router.post(
  '/webhook',
  // Note: Standard raw body parsing middleware should be applied in index.ts for this path
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    if (!stripe) {
      res.status(400).send('Stripe not configured on backend.');
      return;
    }

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // Fallback for local dev testing without webhook secrets
        event = req.body;
      }
    } catch (err: any) {
      console.error(`❌ Webhook Signature verification failed:`, err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      console.log(`[Stripe Webhook] Received event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const issuerId = session.client_reference_id || session.metadata?.issuerId;
          const stripeSubscriptionId = session.subscription as string;
          const stripeCustomerId = session.customer as string;
          const targetTier = session.metadata?.targetTier || 'pro';

          if (issuerId) {
            // Update issuer
            await query(
              `UPDATE issuers 
               SET subscription_tier = $1, 
                   subscription_status = 'active', 
                   stripe_customer_id = $2, 
                   stripe_subscription_id = $3,
                   subscription_expires_at = NOW() + INTERVAL '35 days'
               WHERE id = $4`,
              [targetTier, stripeCustomerId, stripeSubscriptionId, issuerId]
            );
            console.log(`[Stripe Webhook] Active Pro subscription saved for Issuer: ${issuerId}`);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const stripeCustomerId = subscription.customer as string;
          const stripeSubscriptionId = subscription.id;
          const status = subscription.status;

          // Determine tier based on subscription items price ID (optional check, default to active tier)
          let tier = 'pro';
          const priceId = subscription.items.data[0]?.price.id;
          if (priceId === TIER_PRICES.enterprise) {
            tier = 'enterprise';
          }

          const expiresAt = new Date(subscription.current_period_end * 1000);

          await query(
            `UPDATE issuers 
             SET subscription_status = $1,
                 subscription_tier = $2,
                 subscription_expires_at = $3
             WHERE stripe_customer_id = $4 OR stripe_subscription_id = $5`,
            [status, status === 'active' ? tier : 'free', expiresAt, stripeCustomerId, stripeSubscriptionId]
          );
          console.log(`[Stripe Webhook] Subscription updated. Customer: ${stripeCustomerId}. Status: ${status}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const stripeCustomerId = subscription.customer as string;

          await query(
            `UPDATE issuers 
             SET subscription_tier = 'free', 
                 subscription_status = 'canceled',
                 subscription_expires_at = NOW()
             WHERE stripe_customer_id = $1`,
            [stripeCustomerId]
          );
          console.log(`[Stripe Webhook] Subscription deleted for customer: ${stripeCustomerId}. Plan downgraded to Free.`);
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`[Stripe Webhook] Error processing event:`, err.message);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

/**
 * POST /prepare-stellar-payment
 * Build an unsigned Stellar payment transaction for a subscription tier
 */
router.post('/prepare-stellar-payment', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tier, senderAddress } = req.body;

    if (!tier || !['pro', 'enterprise'].includes(tier)) {
      res.status(400).json({ error: 'Invalid subscription tier selected' });
      return;
    }

    if (!senderAddress || !StellarSdk.StrKey.isValidEd25519PublicKey(senderAddress)) {
      res.status(400).json({ error: 'Invalid Stellar sender address' });
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

    const price = STELLAR_PRICES[tier as 'pro' | 'enterprise'];

    // Build the transaction
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: process.env.STELLAR_PASSPHRASE || StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: BILLING_DESTINATION_ADDRESS,
          asset: StellarSdk.Asset.native(),
          amount: price,
        })
      )
      .addMemo(StellarSdk.Memo.text(`stellarid_sub_${tier}`))
      .setTimeout(300)
      .build();

    res.json({
      xdr: tx.toXDR(),
      amount: price,
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
