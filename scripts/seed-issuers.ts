import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '../backend/.env' });

const issuers = [
  {
    name: 'GitHub Verified',
    description: 'Verifies active GitHub accounts with verified email',
    stellar_address: 'GITHUB_ISSUER_ADDRESS_PLACEHOLDER',
    credential_types: JSON.stringify(['github_developer']),
    verified: true,
    issuer_type: 'oauth',
  },
  {
    name: 'University Email Verification',
    description: 'Verifies .edu email addresses for student/alumni status',
    stellar_address: 'UNI_ISSUER_ADDRESS_PLACEHOLDER',
    credential_types: JSON.stringify(['student', 'alumni']),
    verified: true,
    issuer_type: 'email',
  },
  {
    name: 'Jumio KYC',
    description: 'Document-based identity verification',
    stellar_address: 'JUMIO_ISSUER_ADDRESS_PLACEHOLDER',
    credential_types: JSON.stringify(['age_18', 'age_21', 'us_resident']),
    verified: true,
    issuer_type: 'kyc',
  },
  {
    name: 'Plaid Income',
    description: 'Bank-connected income verification',
    stellar_address: 'PLAID_ISSUER_ADDRESS_PLACEHOLDER',
    credential_types: JSON.stringify(['income_100k', 'income_200k', 'accredited_investor']),
    verified: true,
    issuer_type: 'financial',
  },
];

async function seedIssuers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Seeding issuers...\n');

  for (const issuer of issuers) {
    try {
      await pool.query(
        `INSERT INTO issuers (name, description, stellar_address, credential_types, verified, issuer_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (stellar_address) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           credential_types = EXCLUDED.credential_types,
           verified = EXCLUDED.verified
         RETURNING id`,
        [
          issuer.name,
          issuer.description,
          issuer.stellar_address,
          issuer.credential_types,
          issuer.verified,
          issuer.issuer_type,
        ]
      );
      console.log(`  ✓ ${issuer.name} (${issuer.issuer_type})`);
    } catch (err: any) {
      console.error(`  ✗ ${issuer.name}: ${err.message}`);
    }
  }

  console.log('\nSeeding complete!');
  await pool.end();
  process.exit(0);
}

seedIssuers().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
