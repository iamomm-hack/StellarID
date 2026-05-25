import axios from 'axios';

/**
 * Generate a developer bio locally using credentials heuristics.
 * Used as a fallback when GEMINI_API_KEY is not configured or fails.
 */
export function generateFallbackBio(
  tier: string,
  credentials: any[],
  badges: string[],
  reputationScore: number,
  format: 'linkedin' | 'twitter' | 'resume' = 'linkedin'
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

  let badgesStr = '';
  if (badges.length > 0) {
    badgesStr = badges.slice(0, 2).join(' and ');
  }

  if (format === 'twitter') {
    const badgesPart = badgesStr ? ` | Badges: ${badgesStr}` : '';
    let bio = `Verified ${tier} Builder on @StellarID (${reputationScore} Rep) | ${roleStr}${badgesPart} 🚀`;
    if (bio.length > 160) {
      bio = `Verified ${tier} Builder on @StellarID (${reputationScore} Rep) | ${roleStr} 🚀`;
    }
    return bio.slice(0, 160);
  }

  if (format === 'linkedin') {
    const achievementStr = badgesStr
      ? ` Recognized with my ${badgesStr} badges, I am actively building in the developer ecosystem.`
      : '';
    return `I am a verified ${tier} developer on StellarID (${reputationScore} reputation) specializing as a ${roleStr}${strengthStr}.${achievementStr} Currently building on the Stellar network.`;
  }

  // Resume format (third-person, detailed)
  const achievementStr = badgesStr
    ? ` Recognized with ${badgesStr} badges, they are active in the developer ecosystem.`
    : '';
  return `A verified ${tier} developer on StellarID (${reputationScore} reputation) specialized as a ${roleStr}${strengthStr}.${achievementStr} Dedicated to building high-quality decentralized applications on the Stellar network.`;
}

/**
 * Generate developer bio using Google Gemini API with local heuristic fallback.
 */
export async function generateDeveloperBio(
  walletAddress: string,
  credentials: any[],
  reputation: { total_score: number; tier: string },
  badges: string[],
  format: 'linkedin' | 'twitter' | 'resume' = 'linkedin'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[AI Service] No GEMINI_API_KEY found. Using heuristic fallback generator.');
    return generateFallbackBio(reputation.tier, credentials, badges, reputation.total_score, format);
  }

  try {
    const credText = credentials.length > 0
      ? credentials.map(c => `- ${c.credential_type} issued by ${c.issuer_name || 'Verified Issuer'}`).join('\n')
      : '- No verified credentials yet';
    const badgeText = badges.length > 0 ? badges.join(', ') : 'None';

    let systemPrompt = '';
    let userPrompt = '';

    if (format === 'twitter') {
      systemPrompt = "You are a professional social media writer. Write a punchy, engaging developer bio for a Twitter/X profile in the first-person (using 'I'). Use the user's credentials and badges. Keep the total output under 160 characters. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
      userPrompt = `Write a Twitter bio under 160 characters for this developer identity:
- Reputation Score: ${reputation.total_score} (${reputation.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
    } else if (format === 'linkedin') {
      systemPrompt = "You are a professional LinkedIn resume writer. Write a concise, action-oriented 2-3 sentence developer summary in the first-person (using 'I'). Focus on verified achievements, credentials, and badges. Keep the total output under 250 characters. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
      userPrompt = `Write a LinkedIn summary under 250 characters for this developer identity:
- Reputation Score: ${reputation.total_score} (${reputation.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
    } else {
      // resume
      systemPrompt = "You are an expert technical resume writer. Write a highly professional 3-4 sentence developer summary in the third-person (using 'They' or candidate name). Focus on verified credentials, badges, and technical expertise. Write in a formal, high-impact style. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
      userPrompt = `Write a third-person resume summary for this developer identity:
- Reputation Score: ${reputation.total_score} (${reputation.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
    }

    const fullPrompt = `${systemPrompt}\n\nDeveloper Data:\n${userPrompt}`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const bio = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (bio) {
      return bio;
    }
    throw new Error('Empty response content from Gemini API');
  } catch (err: any) {
    console.warn(`[AI Service] Gemini API request failed: ${err.message}. Falling back to heuristics.`);
    return generateFallbackBio(reputation.tier, credentials, badges, reputation.total_score, format);
  }
}
