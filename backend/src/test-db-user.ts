import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { query } from './db';
import { generateDeveloperBio } from './services/ai';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const walletPattern = 'GBMQJ3%';
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is not defined!');
    return;
  }
  try {
    const userRes = await query('SELECT * FROM users WHERE stellar_address LIKE $1', [walletPattern]);
    if (userRes.rows.length === 0) {
      console.error('No user found matching pattern', walletPattern);
      const allUsers = await query('SELECT stellar_address FROM users LIMIT 5', []);
      console.log('Sample users in DB:', allUsers.rows);
      return;
    }

    const user = userRes.rows[0];
    console.log('User found:', {
      id: user.id,
      stellar_address: user.stellar_address,
      reputation_score: user.reputation_score,
      ai_summary: user.ai_summary
    });

    // Get credentials
    const credsRes = await query(
      `SELECT c.*, i.name as issuer_name 
       FROM credentials c
       LEFT JOIN issuers i ON c.issuer_id = i.id
       WHERE c.user_id = $1`,
      [user.id]
    );
    console.log('Credentials count:', credsRes.rows.length);
    console.log('Credentials:', credsRes.rows.map(c => ({ id: c.id, type: c.credential_type })));

    // Get badges
    const badgesRes = await query('SELECT * FROM user_badges WHERE wallet_address = $1', [user.stellar_address]);
    console.log('Badges:', badgesRes.rows);

    // Get reputation
    const repRes = await query('SELECT * FROM user_reputation WHERE wallet_address = $1', [user.stellar_address]);
    const rep = repRes.rows[0] || { total_score: 0, tier: 'Bronze' };
    console.log('Reputation details:', rep);

    const badges = badgesRes.rows.map(r => r.badge_id);

    console.log('\n--- Generating Bios using actual service ---');
    
    for (const format of ['linkedin', 'twitter', 'resume'] as const) {
      console.log(`\nFormat [${format}]:`);
      try {
        const credText = credsRes.rows.length > 0
          ? credsRes.rows.map((c: any) => `- ${c.credential_type} issued by ${c.issuer_name || 'Verified Issuer'}`).join('\n')
          : '- No verified credentials yet';
        const badgeText = badges.length > 0 ? badges.join(', ') : 'None';

        let systemPrompt = '';
        let userPrompt = '';
        let maxTokens = 300;

        if (format === 'twitter') {
          systemPrompt = "You are a professional social media writer. Write a punchy, engaging developer bio for a Twitter/X profile in the first-person (using 'I'). Use the user's credentials and badges. Keep the total output under 160 characters. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
          userPrompt = `Write a Twitter bio under 160 characters for this developer identity:
- Reputation Score: ${rep.total_score} (${rep.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
        } else if (format === 'linkedin') {
          systemPrompt = "You are a professional LinkedIn resume writer. Write a concise, action-oriented 2-3 sentence developer summary in the first-person (using 'I'). Focus on verified achievements, credentials, and badges. Keep the total output under 250 characters. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
          userPrompt = `Write a LinkedIn summary under 250 characters for this developer identity:
- Reputation Score: ${rep.total_score} (${rep.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
        } else {
          systemPrompt = "You are an expert technical resume writer. Write a highly professional 3-4 sentence developer summary in the third-person (using 'They' or candidate name). Focus on verified credentials, badges, and technical expertise. Write in a formal, high-impact style. Do not include quote marks, intros, or pleasantries. Output ONLY the raw bio text.";
          userPrompt = `Write a third-person resume summary for this developer identity:
- Reputation Score: ${rep.total_score} (${rep.tier} tier)
- Badges: ${badgeText}
- Verified Credentials:
${credText}`;
          maxTokens = 400;
        }

        const fullPrompt = `${systemPrompt}\n\nDeveloper Data:\n${userPrompt}`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: fullPrompt }] }]
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        console.log('Raw API Response candidates content parts:', JSON.stringify(response.data?.candidates?.[0]?.content?.parts, null, 2));
      } catch (err: any) {
        console.error('API Call failed:', err.response?.data || err.message);
      }
    }

  } catch (err: any) {
    console.error('Error during run:', err);
  }
}

run();
