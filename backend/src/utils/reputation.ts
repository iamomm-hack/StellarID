import { query } from '../db';
import { zAddLeaderboard } from '../services/redis';
import { BADGE_DEFINITIONS } from '../config/badges';

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

  // Update Redis sorted set leaderboard
  await zAddLeaderboard(walletAddress, result.total_score);

  // Automatically calculate and save new badges unlocked by this reputation update
  try {
    await evaluateAndSaveUserBadges(walletAddress);
  } catch (err) {
    console.error('Failed to auto-evaluate badges for', walletAddress, err);
  }

  return result;
}

/**
 * Record builder activity for streak tracking
 */
export async function recordActivity(walletAddress: string, activityType: string): Promise<void> {
  try {
    const normalizedWallet = walletAddress.trim();
    await query(
      `INSERT INTO user_activity (wallet_address, activity_date, activity_type)
       VALUES ($1, CURRENT_DATE, $2)
       ON CONFLICT (wallet_address, activity_date) DO NOTHING`,
      [normalizedWallet, activityType]
    );
  } catch (err) {
    console.error('Error recording activity:', err);
  }
}

/**
 * Calculate user current and longest streak of consecutive days with activity
 */
export async function getUserStreak(walletAddress: string): Promise<{ currentStreak: number; longestStreak: number }> {
  try {
    const normalizedWallet = walletAddress.trim();
    const result = await query(
      `SELECT DISTINCT activity_date
       FROM user_activity
       WHERE wallet_address = $1
       ORDER BY activity_date DESC`,
      [normalizedWallet]
    );

    const dates = result.rows.map((row) => new Date(row.activity_date));
    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    // Calculate current streak
    let currentStreak = 0;
    let expectedDate = new Date(today);

    // If the latest activity is older than yesterday, current streak is reset to 0
    const latestActivityDate = new Date(dates[0]);
    latestActivityDate.setUTCHours(0, 0, 0, 0);

    if (latestActivityDate.getTime() < yesterday.getTime()) {
      currentStreak = 0;
    } else {
      // Start checking from the most recent activity date in our logs
      expectedDate = new Date(latestActivityDate);
      let dateIndex = 0;

      while (dateIndex < dates.length) {
        const checkDate = new Date(dates[dateIndex]);
        checkDate.setUTCHours(0, 0, 0, 0);

        if (checkDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setUTCDate(expectedDate.getUTCDate() - 1);
          dateIndex++;
        } else if (checkDate.getTime() > expectedDate.getTime()) {
          // Skip duplicate/newer dates that don't match expected sequence
          dateIndex++;
        } else {
          // Gap detected, current streak is broken
          break;
        }
      }
    }

    // Calculate longest streak historically
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Traverse dates chronologically (oldest to newest) to count streaks
    const chronologicalDates = [...dates].reverse();

    for (const currentDate of chronologicalDates) {
      currentDate.setUTCHours(0, 0, 0, 0);
      
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffMs = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
      lastDate = currentDate;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  } catch (err) {
    console.error('Error calculating streak:', err);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

/**
 * Evaluate all badges for a user and save newly unlocked ones to the database
 */
export async function evaluateAndSaveUserBadges(walletAddress: string): Promise<string[]> {
  const normalizedWallet = walletAddress.trim();

  // 1. Fetch user general stats
  const userRes = await query(
    `SELECT id, github_username, created_at FROM users WHERE stellar_address = $1`,
    [normalizedWallet]
  );
  if (userRes.rows.length === 0) {
    return [];
  }

  const user = userRes.rows[0];
  const github_verified = !!user.github_username;

  // 2. Fetch join order (users created at or before this user)
  const joinOrderRes = await query(
    `SELECT COUNT(*)::int as count FROM users WHERE created_at <= $1`,
    [user.created_at]
  );
  const joinOrder = joinOrderRes.rows[0]?.count || 9999;

  // 3. Fetch reputation and credential stats
  const repRes = await query(
    `SELECT total_score, tier, credential_count FROM user_reputation WHERE wallet_address = $1`,
    [normalizedWallet]
  );
  const reputation = repRes.rows[0] || { total_score: 0, tier: 'Verified', credential_count: 0 };

  // 4. Fetch credentials to check for Stellar ecosystem or win certifications
  const credsRes = await query(
    `SELECT c.credential_type, i.name as issuer_name
     FROM credentials c
     JOIN users u ON c.user_id = u.id
     JOIN issuers i ON c.issuer_id = i.id
     WHERE u.stellar_address = $1 AND c.revoked = false AND c.expired = false`,
    [normalizedWallet]
  );

  const has_stellar_credential = credsRes.rows.some((cred: any) => {
    const typeStr = (cred.credential_type || '').toLowerCase();
    const issuerStr = (cred.issuer_name || '').toLowerCase();
    return typeStr.includes('stellar') || issuerStr.includes('stellar');
  });

  const has_win_credential = credsRes.rows.some((cred: any) => {
    const typeStr = (cred.credential_type || '').toLowerCase();
    return (
      typeStr.includes('winner') ||
      typeStr.includes('win') ||
      typeStr.includes('grand prize') ||
      typeStr.includes('first prize') ||
      typeStr.includes('hackathon_winner')
    );
  });

  // 5. Get activity streak
  const streak = await getUserStreak(normalizedWallet);

  // 6. Build stats object
  const stats = {
    total_credentials: reputation.credential_count,
    tier: reputation.tier,
    has_stellar_credential,
    has_win_credential,
    streak_days: streak.longestStreak,
    github_verified,
    join_order: joinOrder,
  };

  // 7. Evaluate each badge definition
  const unlockedBadges: string[] = [];
  for (const badge of BADGE_DEFINITIONS) {
    if (badge.check(stats)) {
      unlockedBadges.push(badge.id);
      // Save to database
      await query(
        `INSERT INTO user_badges (wallet_address, badge_id, earned_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (wallet_address, badge_id) DO NOTHING`,
        [normalizedWallet, badge.id]
      );
    }
  }

  return unlockedBadges;
}
