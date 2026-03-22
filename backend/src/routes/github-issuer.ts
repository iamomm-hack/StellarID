import { Router, Request, Response } from 'express';
import axios from 'axios';
import { query } from '../db';
import { mintCredentialNFT } from '../services/stellar';
import { uploadToIPFS } from '../services/ipfs';
import { generateToken } from '../utils/jwt';

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/v1/github-issuer/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function isGithubOAuthConfigured(): boolean {
  const invalidValues = new Set([
    '',
    'your_github_oauth_client_id',
    'your_github_oauth_client_secret',
  ]);

  return !invalidValues.has(GITHUB_CLIENT_ID) && !invalidValues.has(GITHUB_CLIENT_SECRET);
}

// GET /auth — Redirect to GitHub OAuth
router.get('/auth', (req: Request, res: Response) => {
  const stellarAddress = req.query.stellarAddress as string || '';

  if (!isGithubOAuthConfigured()) {
    console.error('GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env');
    res.redirect(`${FRONTEND_URL}/dashboard?error=github_oauth_not_configured`);
    return;
  }

  if (!stellarAddress) {
    res.redirect(`${FRONTEND_URL}/dashboard?error=missing_wallet_address`);
    return;
  }

  const state = Buffer.from(JSON.stringify({ stellarAddress })).toString('base64');

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user%20user:email&state=${state}&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}`;

  res.redirect(githubAuthUrl);
});

// GET /callback — Handle GitHub OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    if (!isGithubOAuthConfigured()) {
      res.redirect(`${FRONTEND_URL}/dashboard?error=github_oauth_not_configured`);
      return;
    }

    const { code, state } = req.query;

    if (!code) {
      res.status(400).json({ error: 'Missing authorization code' });
      return;
    }

    // Decode state to get stellar address
    let stellarAddress = '';
    try {
      const decoded = JSON.parse(Buffer.from(state as string, 'base64').toString());
      stellarAddress = decoded.stellarAddress;
    } catch {
      console.warn('Could not decode state parameter');
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      res.status(400).json({ error: 'Failed to obtain access token' });
      return;
    }

    // Get user profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;

    // Get user emails to check verification
    const emailsResponse = await axios.get('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const verifiedEmail = emailsResponse.data.find(
      (e: any) => e.verified && e.primary
    );

    if (!verifiedEmail) {
      res.redirect(`${FRONTEND_URL}/dashboard?error=no_verified_email`);
      return;
    }

    // Find or create GitHub issuer
    let issuerResult = await query(
      "SELECT id FROM issuers WHERE issuer_type = 'oauth' AND name = 'GitHub Verified'"
    );

    let issuerId: string;
    if (issuerResult.rows.length === 0) {
      issuerResult = await query(
        `INSERT INTO issuers (name, description, stellar_address, credential_types, verified, issuer_type)
         VALUES ('GitHub Verified', 'Verifies active GitHub accounts', 'GITHUB_SYSTEM_ISSUER', $1, true, 'oauth')
         RETURNING id`,
        [JSON.stringify(['github_developer'])]
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

    // Update user's GitHub username
    if (userId) {
      await query(
        'UPDATE users SET github_username = $1, email = $2, updated_at = NOW() WHERE id = $3',
        [githubUser.login, verifiedEmail.email, userId]
      );
    }

    // Build claim data
    const claimData = {
      github_username: githubUser.login,
      public_repos_count: githubUser.public_repos,
      account_created_year: new Date(githubUser.created_at).getFullYear(),
      verified_email: true,
      followers: githubUser.followers,
    };

    // Upload to IPFS
    let ipfsHash = '';
    try {
      ipfsHash = await uploadToIPFS(JSON.stringify(claimData));
    } catch {
      console.warn('IPFS upload failed for GitHub credential');
    }

    // Mint credential NFT
    let txHash = '';
    let tokenId = 0;
    try {
      const issuerSecret = process.env.GITHUB_ISSUER_SECRET || '';
      if (issuerSecret && stellarAddress) {
        const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
        const result = await mintCredentialNFT(
          issuerSecret,
          stellarAddress,
          'github_developer',
          ipfsHash || 'no_ipfs',
          expiresAt
        );
        txHash = result.txHash;
        tokenId = result.tokenId;
      }
    } catch (stellarErr: any) {
      console.warn('Stellar mint failed for GitHub credential:', stellarErr.message);
    }

    // Store credential in database
    if (userId) {
      await query(
        `INSERT INTO credentials (user_id, issuer_id, credential_type, claim_data,
                                  nft_token_id, stellar_tx_hash, ipfs_hash, expires_at)
         VALUES ($1, $2, 'github_developer', $3, $4, $5, $6, NOW() + INTERVAL '1 year')`,
        [userId, issuerId, JSON.stringify(claimData), tokenId.toString(), txHash, ipfsHash]
      );
    }

    // Redirect to frontend dashboard with new token
    if (userId && stellarAddress) {
      const newToken = generateToken({
        userId,
        stellarAddress,
      });
      res.redirect(`${FRONTEND_URL}/dashboard?credential=minted&type=github_developer&token=${newToken}`);
    } else {
      res.redirect(`${FRONTEND_URL}/dashboard?credential=minted&type=github_developer`);
    }
  } catch (err: any) {
    console.error('GitHub callback error:', err.message);
    res.redirect(`${FRONTEND_URL}/dashboard?error=github_auth_failed`);
  }
});

export default router;
