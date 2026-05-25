import axios from 'axios';

/**
 * Generate a developer bio locally using credentials heuristics.
 * Used as a fallback when ANTHROPIC_API_KEY is not configured or fails.
 */
export function generateFallbackBio(
  tier: string,
  credentials: any[],
  badges: string[],
  reputationScore: number
): string {
  const verifiedGitHub = credentials.some(c => {
    const type = (c.credential_type || '').toLowerCase();
    return type.includes('github') || type.includes('pr') || type.includes('contribution');
  });
  const verifiedLinkedIn = credentials.some(c => {
    const type = (c.credential_type || '').toLowerCase();
    return type.includes('linkedin') || type.includes('skill') || type.includes('job');
  });
  const verifiedHackathon = credentials.some(c => {
    const type = (c.credential_type || '').toLowerCase();
    return type.includes('hackathon') || type.includes('winner');
  });

  let roleStr = 'software developer';
  if (verifiedHackathon) {
    roleStr = 'hackathon-winning Web3 developer';
  } else if (verifiedGitHub && verifiedLinkedIn) {
    roleStr = 'full-stack open-source engineer';
  } else if (verifiedGitHub) {
    roleStr = 'open-source software developer';
  } else if (verifiedLinkedIn) {
    roleStr = 'professional systems engineer';
  }

  let strengthStr = '';
  if (credentials.length > 0) {
    const mainCreds = credentials
      .map(c => c.credential_type)
      .filter(Boolean)
      .slice(0, 2)
      .join(' and ');
    if (mainCreds) {
      strengthStr = ` with verified achievements in ${mainCreds}`;
    }
  }

  let achievementStr = '';
  if (badges.length > 0) {
    const badgeNames = badges.slice(0, 2).join(' and ');
    achievementStr = ` Recognized with ${badgeNames} badges, they are active in the developer ecosystem.`;
  }

  return `A verified ${tier} developer on StellarID (${reputationScore} reputation) specialized as a ${roleStr}${strengthStr}.${achievementStr} Currently building on the Stellar network.`;
}

/**
 * Generate developer bio using Anthropic Claude API with local heuristic fallback.
 */
export async function generateDeveloperBio(
  walletAddress: string,
  credentials: any[],
  reputation: { total_score: number; tier: string },
  badges: string[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[AI Service] No ANTHROPIC_API_KEY found. Using heuristic fallback generator.');
    return generateFallbackBio(reputation.tier, credentials, badges, reputation.total_score);
  }

  try {
    const credText = credentials.length > 0
      ? credentials.map(c => `- ${c.credential_type} issued by ${c.issuer_name || 'Verified Issuer'}`).join('\n')
      : '- No verified credentials yet';
    const badgeText = badges.length > 0 ? badges.join(', ') : 'None';

    const systemPrompt = `You are a professional technical resume writer. Write a concise, action-oriented 2-3 sentence developer bio in the third-person. Use the user's verified credentials and badges. Do not include introductory text, quote marks, or pleasantries. Output ONLY the bio. Keep it under 250 characters.`;

    const userPrompt = `Write a bio for a developer with the following verified identity on StellarID:
- Reputation Score: ${reputation.total_score} (${reputation.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const bio = response.data?.content?.[0]?.text?.trim();
    if (bio) {
      return bio;
    }
    throw new Error('Empty response content from Claude');
  } catch (err: any) {
    console.warn(`[AI Service] Claude API request failed: ${err.message}. Falling back to heuristics.`);
    return generateFallbackBio(reputation.tier, credentials, badges, reputation.total_score);
  }
}
