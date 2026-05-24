import { query } from '../db';

export interface CredentialScoreItem {
  credential_id: string;
  credential_name: string;
  issuer_name: string;
  base_points: number;
  recency_bonus: number;
  issuer_multiplier: number;
  final_points: number;
}

export interface ReputationBonusItem {
  type: string;
  points: number;
  description: string;
}

export interface ReputationResult {
  total_score: number;
  tier: 'Verified' | 'Proven' | 'Elite Builder';
  credential_count: number;
  breakdown: CredentialScoreItem[];
  bonuses: ReputationBonusItem[];
  next_tier_points_needed: number;
}

/**
 * Calculates the trust score of an issuer.
 * Clamps result between 0.10 and 1.00.
 */
export function calculateIssuerTrustScore(
  baseScore: number,
  officialVerified: boolean,
  communityEndorsements: number,
  credentialsIssued: number,
  revocationRate: number
): number {
  const base = baseScore || 0.10;
  const verificationBonus = officialVerified ? 0.40 : (communityEndorsements > 5 ? 0.20 : 0.0);
  const historyBonus = Math.min(0.30, (credentialsIssued / 1000) * 0.30);
  const penalty = revocationRate > 0.10 ? revocationRate * 0.50 : 0.0;

  const score = base + verificationBonus + historyBonus - penalty;
  return Math.min(1.00, Math.max(0.10, parseFloat(score.toFixed(2))));
}

/**
 * Recalculates and updates the trust score for all issuers in the database.
 */
export async function syncAllIssuerTrustScores(): Promise<void> {
  try {
    // 1. Get all issuers
    const issuersRes = await query('SELECT id, verified FROM issuers');
    
    for (const issuer of issuersRes.rows) {
      // Get counts from credentials
      const countRes = await query(
        `SELECT 
          COUNT(*)::int as issued,
          COUNT(*) FILTER (WHERE revoked = true)::int as revoked
         FROM credentials 
         WHERE issuer_id = $1`,
        [issuer.id]
      );
      
      const issued = countRes.rows[0]?.issued || 0;
      const revoked = countRes.rows[0]?.revoked || 0;
      const revocationRate = issued > 0 ? revoked / issued : 0.0;

      // Check endorsements (mock or from future community table - use 0 default)
      const trustScore = calculateIssuerTrustScore(
        0.10,
        issuer.verified,
        0, // community endorsements
        issued,
        revocationRate
      );

      // Upsert into issuer_trust_scores
      await query(
        `INSERT INTO issuer_trust_scores (
          issuer_id, official_verified, credentials_issued, credentials_revoked, revocation_rate, trust_score, last_calculated
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (issuer_id) DO UPDATE SET
          official_verified = EXCLUDED.official_verified,
          credentials_issued = EXCLUDED.credentials_issued,
          credentials_revoked = EXCLUDED.credentials_revoked,
          revocation_rate = EXCLUDED.revocation_rate,
          trust_score = EXCLUDED.trust_score,
          last_calculated = NOW()`,
        [issuer.id, issuer.verified, issued, revoked, revocationRate, trustScore]
      );
    }
  } catch (err) {
    console.error('Error syncing issuer trust scores:', err);
  }
}

/**
 * Calculates user reputation based on wallet address credentials and metadata
 */
export async function calculateUserReputation(walletAddress: string): Promise<ReputationResult> {
  const normalizedWallet = walletAddress.trim();

  // 1. Fetch user data (e.g. to check GitHub status)
  const userRes = await query(
    'SELECT id, github_username FROM users WHERE stellar_address = $1',
    [normalizedWallet]
  );
  const githubConnected = userRes.rows.length > 0 && !!userRes.rows[0].github_username;

  // 2. Fetch all credentials claimed by this user's wallet
  // (Filter for not revoked and not expired)
  const credsRes = await query(
    `SELECT 
      c.id, c.credential_type, c.issued_at, c.issuer_id,
      i.name as issuer_name, i.verified as issuer_verified,
      its.trust_score as issuer_trust_score
     FROM credentials c
     JOIN users u ON c.user_id = u.id
     JOIN issuers i ON c.issuer_id = i.id
     LEFT JOIN issuer_trust_scores its ON i.id = its.issuer_id
     WHERE u.stellar_address = $1 AND c.revoked = false AND c.expired = false`,
    [normalizedWallet]
  );

  const credentials = credsRes.rows;
  const breakdown: CredentialScoreItem[] = [];
  const uniqueIssuers = new Set<string>();
  let hasRecentCredential = false;
  const now = new Date();

  // 3. Process individual credentials
  for (const cred of credentials) {
    uniqueIssuers.add(cred.issuer_id);
    
    const issuedAt = new Date(cred.issued_at);
    const msDiff = now.getTime() - issuedAt.getTime();
    const daysDiff = msDiff / (1000 * 60 * 60 * 24);
    const monthsDiff = Math.floor(daysDiff / 30);

    // Recency bonus: max(0, 5 - floor(months/3))
    const recencyBonus = Math.max(0, 5 - Math.floor(monthsDiff / 3));

    if (daysDiff <= 30) {
      hasRecentCredential = true;
    }

    // Determine trust multiplier
    // Default: if verified -> 1.0, otherwise 0.5
    let trustMultiplier = 0.50;
    if (cred.issuer_trust_score !== null && cred.issuer_trust_score !== undefined) {
      trustMultiplier = parseFloat(cred.issuer_trust_score);
    } else if (cred.issuer_verified) {
      trustMultiplier = 1.00;
    }

    const basePoints = 10;
    // score = (base + recency) * multiplier * 100
    const finalPoints = Math.round((basePoints + recencyBonus) * trustMultiplier * 100);

    breakdown.push({
      credential_id: cred.id,
      credential_name: cred.credential_type,
      issuer_name: cred.issuer_name,
      base_points: basePoints,
      recency_bonus: recencyBonus,
      issuer_multiplier: trustMultiplier,
      final_points: finalPoints,
    });
  }

  // 4. Calculate bonuses
  const bonuses: ReputationBonusItem[] = [];
  
  if (githubConnected) {
    bonuses.push({
      type: 'GITHUB_OAUTH',
      points: 50,
      description: 'GitHub Identity Link Verified',
    });
  }

  // Check diversity bonus (5+ unique issuers)
  if (uniqueIssuers.size >= 5) {
    bonuses.push({
      type: 'ISSUER_DIVERSITY',
      points: 100,
      description: 'Diversity Bonus: Credentials from 5+ unique issuers',
    });
  }

  // Check streak active (activity within 30 days)
  if (hasRecentCredential) {
    bonuses.push({
      type: 'STREAK_ACTIVE',
      points: 25,
      description: 'Active Builder: Earned or updated activity within the last 30 days',
    });
  }

  // Check credentials from official verified issuers (+20 extra per official issuer credential)
  let officialExtraPoints = 0;
  for (const cred of credentials) {
    if (cred.issuer_verified) {
      officialExtraPoints += 20;
    }
  }

  if (officialExtraPoints > 0) {
    bonuses.push({
      type: 'OFFICIAL_ISSUER',
      points: officialExtraPoints,
      description: `Official Endorsement: +20 points per credential from Verified Issuers`,
    });
  }

  // 5. Total calculation
  const credentialsSum = breakdown.reduce((sum, item) => sum + item.final_points, 0);
  const bonusesSum = bonuses.reduce((sum, item) => sum + item.points, 0);
  let totalScore = credentialsSum + bonusesSum;

  // Clamp total reputation score between 0 and 1000
  totalScore = Math.min(1000, Math.max(0, totalScore));

  // Determine Tier
  let tier: 'Verified' | 'Proven' | 'Elite Builder' = 'Verified';
  let nextTierPointsNeeded = 0;

  if (totalScore >= 500) {
    tier = 'Elite Builder';
    nextTierPointsNeeded = 0;
  } else if (totalScore >= 200) {
    tier = 'Proven';
    nextTierPointsNeeded = 500 - totalScore;
  } else {
    tier = 'Verified';
    nextTierPointsNeeded = 200 - totalScore;
  }

  return {
    total_score: totalScore,
    tier,
    credential_count: credentials.length,
    breakdown,
    bonuses,
    next_tier_points_needed: nextTierPointsNeeded,
  };
}

/**
 * Calculates user reputation and saves the result to user_reputation table
 */
export async function calculateAndSaveUserReputation(walletAddress: string): Promise<ReputationResult> {
  const result = await calculateUserReputation(walletAddress);
  
  await query(
    `INSERT INTO user_reputation (
      wallet_address, total_score, tier, credential_count, score_breakdown, last_calculated
     ) VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (wallet_address) DO UPDATE SET
      total_score = EXCLUDED.total_score,
      tier = EXCLUDED.tier,
      credential_count = EXCLUDED.credential_count,
      score_breakdown = EXCLUDED.score_breakdown,
      last_calculated = NOW()`,
    [
      walletAddress,
      result.total_score,
      result.tier,
      result.credential_count,
      JSON.stringify(result.breakdown),
    ]
  );

  return result;
}
