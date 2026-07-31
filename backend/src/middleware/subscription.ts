/**
 * StellarID — Subscription Tier Middleware
 * ==========================================
 * Enforces credential issuance limits based on the issuer's subscription plan.
 * Supports three tiers: Free, Pro, and Enterprise, each with different monthly
 * credential quotas, bulk upload access, and API key limits.
 *
 * Admin accounts (matching ADMIN_STELLAR_ADDRESS env var) receive automatic
 * Enterprise-tier access regardless of their stored subscription status.
 *
 * @version 2.0.0
 * @module middleware/subscription
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../db';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export const TIER_LIMITS = {
  free: {
    name: 'Free',
    maxCredentialsPerMonth: 5,
    allowBulkUpload: false,
    maxApiKeys: 1,
  },
  pro: {
    name: 'Pro',
    maxCredentialsPerMonth: 1000,
    allowBulkUpload: true,
    maxApiKeys: 5,
  },
  enterprise: {
    name: 'Enterprise',
    maxCredentialsPerMonth: Infinity,
    allowBulkUpload: true,
    maxApiKeys: Infinity,
  },
};

/**
 * Helper to fetch issuer's subscription details and monthly usage
 */
export async function getIssuerSubscriptionStatus(issuerId: string) {
  // Fetch issuer details
  const issuerRes = await query(
    'SELECT subscription_tier, subscription_status, name, stellar_address FROM issuers WHERE id = $1',
    [issuerId]
  );

  if (issuerRes.rows.length === 0) {
    throw new Error('Issuer profile not found');
  }

  let { subscription_tier, subscription_status, name, stellar_address } = issuerRes.rows[0];

  // Admin / Owner bypass: If the wallet address matches process.env.ADMIN_STELLAR_ADDRESS, grant free Enterprise access
  const adminAddress = process.env.ADMIN_STELLAR_ADDRESS;
  if (adminAddress && stellar_address && stellar_address.trim().toLowerCase() === adminAddress.trim().toLowerCase()) {
    subscription_tier = 'enterprise';
    subscription_status = 'active';
  }

  const tier: SubscriptionTier = (subscription_tier || 'free') as SubscriptionTier;

  // Active status check: if expired or canceled, treat as free
  const isActive = subscription_status === 'active';
  const activeTier = isActive ? tier : 'free';
  const limits = TIER_LIMITS[activeTier] || TIER_LIMITS.free;

  // Count credentials issued directly in the last 30 days
  const directCountRes = await query(
    `SELECT COUNT(*)::int as count 
     FROM credentials 
     WHERE issuer_id = $1 AND issued_at >= NOW() - INTERVAL '30 days'`,
    [issuerId]
  );

  // Count pending/invited credentials created in the last 30 days
  const pendingCountRes = await query(
    `SELECT COUNT(*)::int as count 
     FROM pending_credentials 
     WHERE issuer_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
    [issuerId]
  );

  const totalUsed = directCountRes.rows[0].count + pendingCountRes.rows[0].count;

  return {
    issuerName: name,
    tier: activeTier,
    status: subscription_status || 'active',
    limits,
    totalUsed,
    remaining: limits.maxCredentialsPerMonth === Infinity ? Infinity : Math.max(0, limits.maxCredentialsPerMonth - totalUsed),
  };
}

/**
 * Middleware to check and enforce credential issuance limits
 */
export async function checkSubscriptionLimits(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Resolve issuer ID associated with caller
    const issuerRes = await query(
      'SELECT id FROM issuers WHERE stellar_address = $1',
      [req.user.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(403).json({ error: 'Issuer profile required to perform this action' });
      return;
    }

    const issuerId = issuerRes.rows[0].id;
    const subStatus = await getIssuerSubscriptionStatus(issuerId);

    // Attach subscription status to request so child routes can use it without re-querying
    (req as any).subscription = subStatus;

    // Check if monthly limit is exceeded
    const requestedCount = req.body.recipients ? req.body.recipients.length : 1;
    if (subStatus.totalUsed + requestedCount > subStatus.limits.maxCredentialsPerMonth) {
      res.status(402).json({
        error: 'Subscription limit exceeded',
        message: `Your current tier (${subStatus.limits.name}) allows up to ${subStatus.limits.maxCredentialsPerMonth} credentials per month. You have already issued ${subStatus.totalUsed}. Please upgrade your plan to issue more.`,
        limits: subStatus.limits,
        usage: {
          issued: subStatus.totalUsed,
          max: subStatus.limits.maxCredentialsPerMonth,
        },
      });
      return;
    }

    next();
  } catch (err: any) {
    console.error('Subscription limit middleware error:', err.message);
    res.status(500).json({ error: 'Failed to verify subscription limits' });
  }
}

/**
 * Middleware specifically for bulk CSV uploads
 */
export async function checkBulkUploadAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const issuerRes = await query(
      'SELECT id FROM issuers WHERE stellar_address = $1',
      [req.user.stellar_address]
    );

    if (issuerRes.rows.length === 0) {
      res.status(403).json({ error: 'Issuer profile required to upload CSV' });
      return;
    }

    const issuerId = issuerRes.rows[0].id;
    const subStatus = await getIssuerSubscriptionStatus(issuerId);

    if (!subStatus.limits.allowBulkUpload) {
      res.status(403).json({
        error: 'Bulk upload not allowed',
        message: `Your current plan (${subStatus.limits.name}) does not support bulk CSV credential uploads. Please upgrade to Pro or Enterprise.`,
      });
      return;
    }

    next();
  } catch (err: any) {
    console.error('Bulk upload access middleware error:', err.message);
    res.status(500).json({ error: 'Failed to verify bulk upload permissions' });
  }
}
