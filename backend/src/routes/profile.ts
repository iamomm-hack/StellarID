import { Router, Request, Response } from 'express';
import { query } from '../db';
import { getCache, setCache } from '../services/redis';
import { calculateAndSaveUserReputation } from '../utils/reputation';
import { generateCardSvg } from '../utils/cardTemplate';
import sharp from 'sharp';
import axios from 'axios';

const router = Router();

const CARD_CACHE_TTL = parseInt(process.env.CARD_CACHE_TTL || '300', 10);
const OG_IMAGE_CACHE_TTL = parseInt(process.env.OG_IMAGE_CACHE_TTL || '3600', 10);

/**
 * Helper to compute badges based on user data
 */
function getBadges(credentialCount: number, reputationScore: number, hasRecent: boolean): string[] {
  const badges: string[] = [];
  if (credentialCount >= 1) {
    badges.push('First Claim');
  }
  if (credentialCount >= 10) {
    badges.push('10+ Claims');
  }
  if (reputationScore >= 500) {
    badges.push('Elite Builder');
  }
  if (hasRecent) {
    badges.push('Active Streak');
  }
  return badges;
}

/**
 * GET /api/v1/profile/:wallet_address/card-data
 */
router.get('/:wallet_address/card-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    // Try cache first
    const cacheKey = `card_data_${wallet_address}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    // Check if user exists in database
    const userRes = await query(
      'SELECT id, created_at, github_username FROM users WHERE stellar_address = $1',
      [wallet_address]
    );

    if (userRes.rows.length === 0) {
      // User doesn't exist, return default/empty card
      const defaultCard = {
        wallet_address,
        display_name: 'Builder',
        avatar_url: null,
        reputation_score: 0,
        tier: 'Verified',
        credential_count: 0,
        top_credentials: [],
        badges: [],
        member_since: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        stellar_network: process.env.STELLAR_NETWORK || 'testnet',
      };
      await setCache(cacheKey, JSON.stringify(defaultCard), CARD_CACHE_TTL);
      res.json(defaultCard);
      return;
    }

    const user = userRes.rows[0];

    // Compute reputation and save
    const rep = await calculateAndSaveUserReputation(wallet_address);

    // Fetch top 3 credentials
    const topCredsRes = await query(
      `SELECT c.id, c.credential_type, i.name as issuer_name, c.issued_at
       FROM credentials c
       JOIN issuers i ON c.issuer_id = i.id
       WHERE c.user_id = $1 AND c.revoked = false AND c.expired = false
       ORDER BY c.issued_at DESC LIMIT 3`,
      [user.id]
    );

    const topCredentials = topCredsRes.rows.map((row: any) => ({
      name: row.credential_type,
      issuer: row.issuer_name,
      date: new Date(row.issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }));

    // Check for recent activity within 30 days
    const recentRes = await query(
      `SELECT EXISTS(
        SELECT 1 FROM credentials 
        WHERE user_id = $1 AND issued_at > NOW() - INTERVAL '30 days' AND revoked = false
      ) as has_recent`,
      [user.id]
    );
    const hasRecent = recentRes.rows[0]?.has_recent || false;

    // Badges list
    const badges = getBadges(rep.credential_count, rep.total_score, hasRecent);

    // Member since date
    const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const cardData = {
      wallet_address,
      display_name: user.github_username || 'Builder',
      avatar_url: user.github_username ? `https://github.com/${user.github_username}.png` : null,
      reputation_score: rep.total_score,
      tier: rep.tier,
      credential_count: rep.credential_count,
      top_credentials: topCredentials,
      badges,
      member_since: memberSince,
      stellar_network: process.env.STELLAR_NETWORK || 'testnet',
    };

    await setCache(cacheKey, JSON.stringify(cardData), CARD_CACHE_TTL);
    res.json(cardData);
  } catch (err: any) {
    console.error('Error fetching card data:', err);
    res.status(500).json({ error: 'Failed to fetch card data' });
  }
});

/**
 * GET /api/v1/profile/:wallet_address/credentials
 */
router.get('/:wallet_address/credentials', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const userRes = await query(
      'SELECT id FROM users WHERE stellar_address = $1',
      [wallet_address]
    );

    if (userRes.rows.length === 0) {
      res.json([]);
      return;
    }

    const user = userRes.rows[0];

    const result = await query(
      `SELECT c.*, i.name as issuer_name, i.logo_url as issuer_logo_url, i.verified as issuer_verified
       FROM credentials c
       JOIN issuers i ON c.issuer_id = i.id
       WHERE c.user_id = $1
       ORDER BY c.issued_at DESC`,
      [user.id]
    );

    const credentials = result.rows.map((cred) => ({
      ...cred,
      issuer: {
        name: cred.issuer_name,
        logo_url: cred.issuer_logo_url,
        verified: cred.issuer_verified,
      },
      valid: !cred.revoked && !cred.expired &&
        (cred.expires_at ? new Date(cred.expires_at) > new Date() : true),
    }));

    res.json(credentials);
  } catch (err: any) {
    console.error('Error fetching profile credentials:', err);
    res.status(500).json({ error: 'Failed to fetch credentials' });
  }
});

/**
 * GET /api/v1/profile/:wallet_address/og-image
 */
async function fetchAvatarBase64(githubUsername: string | null): Promise<string | null> {
  if (!githubUsername) return null;
  try {
    const url = `https://github.com/${githubUsername}.png`;
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    const buffer = Buffer.from(response.data, 'binary');
    const contentType = response.headers['content-type'] || 'image/png';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Error fetching avatar base64 for ${githubUsername}:`, err);
    return null;
  }
}

/**
 * GET /api/v1/profile/:wallet_address/og-image
 */
router.get('/:wallet_address/og-image', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    // Try cache first
    const cacheKey = `og_image_${wallet_address}`;
    const bypassCache = req.query.bypassCache === 'true';
    if (!bypassCache) {
      const cachedHex = await getCache(cacheKey);
      if (cachedHex) {
        const buffer = Buffer.from(cachedHex, 'hex');
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': `public, max-age=${OG_IMAGE_CACHE_TTL}`,
        });
        res.send(buffer);
        return;
      }
    }

    // Fetch card data (internal function fetch or API redirect simulation)
    // We can call the same logic as the endpoint above
    const userRes = await query(
      'SELECT id, created_at, github_username FROM users WHERE stellar_address = $1',
      [wallet_address]
    );

    let cardData;
    let avatarBase64: string | null = null;

    if (userRes.rows.length === 0) {
      cardData = {
        walletAddress: wallet_address,
        displayName: 'Builder',
        reputationScore: 0,
        tier: 'Verified' as const,
        credentialCount: 0,
        topCredentials: [],
        badges: [],
        memberSince: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        network: process.env.STELLAR_NETWORK || 'testnet',
        avatarBase64: null,
      };
    } else {
      const user = userRes.rows[0];
      const rep = await calculateAndSaveUserReputation(wallet_address);

      if (user.github_username) {
        avatarBase64 = await fetchAvatarBase64(user.github_username);
      }

      const topCredsRes = await query(
        `SELECT c.id, c.credential_type, i.name as issuer_name, c.issued_at
         FROM credentials c
         JOIN issuers i ON c.issuer_id = i.id
         WHERE c.user_id = $1 AND c.revoked = false AND c.expired = false
         ORDER BY c.issued_at DESC LIMIT 3`,
         [user.id]
      );

      const topCredentials = topCredsRes.rows.map((row: any) => ({
        name: row.credential_type,
        issuer: row.issuer_name,
        date: new Date(row.issued_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      }));

      const recentRes = await query(
        `SELECT EXISTS(
          SELECT 1 FROM credentials 
          WHERE user_id = $1 AND issued_at > NOW() - INTERVAL '30 days' AND revoked = false
        ) as has_recent`,
        [user.id]
      );
      const hasRecent = recentRes.rows[0]?.has_recent || false;

      const badges = getBadges(rep.credential_count, rep.total_score, hasRecent);
      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      cardData = {
        walletAddress: wallet_address,
        displayName: user.github_username || 'Builder',
        reputationScore: rep.total_score,
        tier: rep.tier,
        credentialCount: rep.credential_count,
        topCredentials,
        badges,
        memberSince,
        network: process.env.STELLAR_NETWORK || 'testnet',
        avatarBase64,
      };
    }

    // Generate SVG string
    const svgString = generateCardSvg(cardData);

    // Convert SVG to PNG using sharp
    const pngBuffer = await sharp(Buffer.from(svgString)).png().toBuffer();

    // Cache the PNG buffer as a hex string in Redis
    await setCache(cacheKey, pngBuffer.toString('hex'), OG_IMAGE_CACHE_TTL);

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': `public, max-age=${OG_IMAGE_CACHE_TTL}`,
    });
    res.send(pngBuffer);
  } catch (err: any) {
    console.error('Error generating card image:', err);
    res.status(500).json({ error: 'Failed to generate card image' });
  }
});

/**
 * GET /api/v1/profile/:wallet_address/share-url
 */
router.get('/:wallet_address/share-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet_address } = req.params;

    if (!/^G[A-Z2-7]{55}$/.test(wallet_address)) {
      res.status(400).json({ error: 'Invalid Stellar wallet address format' });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const backendUrl = process.env.OG_IMAGE_BASE_URL || `http://localhost:${process.env.PORT || 5555}`;

    // Get score and tier for prefilled tweet text
    const rep = await calculateAndSaveUserReputation(wallet_address);

    const profileUrl = `${frontendUrl}/p/${wallet_address}`;
    const ogImageUrl = `${backendUrl}/api/v1/profile/${wallet_address}/og-image`;

    const tweetText = `Just leveled up my builder identity on @StellarID ✨\nReputation Score: ${rep.total_score} | ${rep.tier} Builder\n${rep.credential_count} verified credentials on @Stellar 🚀\nVerify yours → `;
    
    const twitterIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(profileUrl)}&hashtags=StellarID,Web3,Builder`;
    const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

    res.json({
      profile_url: profileUrl,
      twitter_intent: twitterIntent,
      linkedin_share: linkedinShare,
      og_image_url: ogImageUrl,
    });
  } catch (err: any) {
    console.error('Error generating share urls:', err);
    res.status(500).json({ error: 'Failed to generate share links' });
  }
});

export default router;
