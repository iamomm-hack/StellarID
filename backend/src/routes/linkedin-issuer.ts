import { Router, Request, Response } from 'express';
import axios from 'axios';
import { query } from '../db';
import { mintCredentialNFT } from '../services/stellar';
import { uploadToIPFS } from '../services/ipfs';
import { generateToken } from '../utils/jwt';

const router = Router();

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const LINKEDIN_REDIRECT_URI =
  process.env.LINKEDIN_REDIRECT_URI ||
  'http://localhost:5555/api/v1/linkedin-issuer/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function isLinkedInOAuthConfigured(): boolean {
  const invalidValues = new Set([
    '',
    'your_linkedin_client_id',
    'your_linkedin_client_secret',
  ]);
  return (
    !invalidValues.has(LINKEDIN_CLIENT_ID) &&
    !invalidValues.has(LINKEDIN_CLIENT_SECRET)
  );
}

// GET /auth — Redirect to LinkedIn OAuth (OpenID Connect)
router.get('/auth', (req: Request, res: Response) => {
  const stellarAddress = (req.query.stellarAddress as string) || '';

  if (!isLinkedInOAuthConfigured()) {
    console.error(
      'LinkedIn OAuth not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in backend/.env'
    );
    res.redirect(
      `${FRONTEND_URL}/dashboard?error=linkedin_oauth_not_configured`
    );
    return;
  }

  if (!stellarAddress) {
    res.redirect(`${FRONTEND_URL}/dashboard?error=missing_wallet_address`);
    return;
  }

  const state = Buffer.from(JSON.stringify({ stellarAddress })).toString(
    'base64'
  );

  // LinkedIn OpenID Connect scopes
  const scopes = encodeURIComponent('openid profile email');

  const linkedinAuthUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}` +
    `&state=${state}` +
    `&scope=${scopes}`;

  res.redirect(linkedinAuthUrl);
});

// GET /callback — Handle LinkedIn OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    if (!isLinkedInOAuthConfigured()) {
      res.redirect(
        `${FRONTEND_URL}/dashboard?error=linkedin_oauth_not_configured`
      );
      return;
    }

    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      console.error('LinkedIn OAuth error:', oauthError);
      res.redirect(`${FRONTEND_URL}/dashboard?error=linkedin_auth_denied`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    // Decode state to get stellar address
    let stellarAddress = '';
    try {
      const decoded = JSON.parse(
        Buffer.from(state as string, 'base64').toString()
      );
      stellarAddress = decoded.stellarAddress;
    } catch {
      console.warn('Could not decode state parameter');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
        redirect_uri: LINKEDIN_REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      res.status(400).json({ error: 'Failed to obtain access token' });
      return;
    }

    // Get user profile via OpenID Connect userinfo endpoint
    const userInfoResponse = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const linkedinUser = userInfoResponse.data;

    /*
     * linkedinUser contains:
     *   sub         — unique LinkedIn member ID
     *   name        — full name
     *   given_name  — first name
     *   family_name — last name
     *   picture     — profile picture URL
     *   email       — email address
     *   email_verified — boolean
     */

    if (!linkedinUser.email) {
      res.redirect(`${FRONTEND_URL}/dashboard?error=linkedin_no_email`);
      return;
    }

    // Find or create LinkedIn issuer
    let issuerResult = await query(
      "SELECT id FROM issuers WHERE issuer_type = 'oauth' AND name = 'LinkedIn Verified'"
    );

    let issuerId: string;
    if (issuerResult.rows.length === 0) {
      issuerResult = await query(
        `INSERT INTO issuers (name, description, stellar_address, credential_types, verified, issuer_type)
         VALUES ('LinkedIn Verified', 'Verifies LinkedIn professional profiles', 'LINKEDIN_SYSTEM_ISSUER', $1, true, 'oauth')
         RETURNING id`,
        [JSON.stringify(['linkedin_professional'])]
      );
    }
    issuerId = issuerResult.rows[0].id;

    // Find user by stellar address
    let userResult: any;
    if (stellarAddress) {
      userResult = await query(
        'SELECT id FROM users WHERE stellar_address = $1',
        [stellarAddress]
      );
    }

    const userId = userResult?.rows?.[0]?.id;

    // Update user's email if we have a user row
    if (userId) {
      await query(
        'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
        [linkedinUser.email, userId]
      );
    }

    // Build claim data
    const claimData = {
      linkedin_name: linkedinUser.name,
      linkedin_given_name: linkedinUser.given_name,
      linkedin_family_name: linkedinUser.family_name,
      linkedin_email: linkedinUser.email,
      linkedin_email_verified: linkedinUser.email_verified ?? false,
      linkedin_picture: linkedinUser.picture || '',
      linkedin_sub: linkedinUser.sub, // unique member ID
      verified_at: new Date().toISOString(),
    };

    // Upload to IPFS
    let ipfsHash = '';
    try {
      ipfsHash = await uploadToIPFS(JSON.stringify(claimData));
    } catch {
      console.warn('IPFS upload failed for LinkedIn credential');
    }

    // Mint credential NFT
    let txHash = '';
    let tokenId = 0;
    try {
      const issuerSecret = process.env.LINKEDIN_ISSUER_SECRET || process.env.GITHUB_ISSUER_SECRET || '';
      if (issuerSecret && stellarAddress) {
        const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        const result = await mintCredentialNFT(
          issuerSecret,
          stellarAddress,
          'linkedin_professional',
          ipfsHash || 'no_ipfs',
          expiresAt
        );
        txHash = result.txHash;
        tokenId = result.tokenId;
      }
    } catch (stellarErr: any) {
      console.warn(
        'Stellar mint failed for LinkedIn credential:',
        stellarErr.message
      );
    }

    // Store credential in database
    if (userId) {
      // Check if user already has a LinkedIn credential - skip duplicate
      const existing = await query(
        "SELECT id FROM credentials WHERE user_id = $1 AND credential_type = 'linkedin_professional'",
        [userId]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO credentials (user_id, issuer_id, credential_type, claim_data,
                                    nft_token_id, stellar_tx_hash, ipfs_hash, expires_at)
           VALUES ($1, $2, 'linkedin_professional', $3, $4, $5, $6, NOW() + INTERVAL '1 year')`,
          [
            userId,
            issuerId,
            JSON.stringify(claimData),
            tokenId.toString(),
            txHash,
            ipfsHash,
          ]
        );
      } else {
        // Update existing credential
        await query(
          `UPDATE credentials SET claim_data = $1, nft_token_id = $2, stellar_tx_hash = $3,
                                   ipfs_hash = $4, updated_at = NOW()
           WHERE user_id = $5 AND credential_type = 'linkedin_professional'`,
          [
            JSON.stringify(claimData),
            tokenId.toString(),
            txHash,
            ipfsHash,
            userId,
          ]
        );
      }
    }

    // Redirect to frontend dashboard with new token
    if (userId && stellarAddress) {
      const newToken = generateToken({
        userId,
        stellarAddress,
      });
      res.redirect(
        `${FRONTEND_URL}/dashboard?credential=minted&type=linkedin_professional&token=${newToken}`
      );
    } else {
      res.redirect(
        `${FRONTEND_URL}/dashboard?credential=minted&type=linkedin_professional`
      );
    }
  } catch (err: any) {
    console.error('LinkedIn callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/dashboard?error=linkedin_auth_failed`);
  }
});

export default router;
