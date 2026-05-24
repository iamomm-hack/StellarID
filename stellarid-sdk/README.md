# StellarID JavaScript SDK

The official JavaScript/TypeScript SDK for **StellarID** — the protocol-grade identity and reputation layer on Stellar.

Easily integrate user credential verification, reputation score lookups, on-chain credential issuance, and embeddable trust badges into your Web3 applications.

---

## Installation

Install the package via npm, yarn, or pnpm:

```bash
npm install stellarid-sdk
# or
yarn add stellarid-sdk
# or
pnpm add stellarid-sdk
```

---

## Quick Start

### 1. Initialize the Client

Obtain your Developer API Key from the StellarID Dashboard and instantiate the client:

```typescript
import { StellarID } from 'stellarid-sdk';

const stellarId = new StellarID({
  apiKey: 'your-developer-api-key',
  // Optional: Custom base URL (e.g. for local testing)
  // baseURL: 'http://localhost:5555/api/v1' 
});
```

### 2. Verify a User's Reputation Score & Credentials

Retrieve verified credentials and computed reputation levels for any Stellar wallet address:

```typescript
async function checkUserReputation(walletAddress: string) {
  try {
    const profile = await stellarId.verifyWallet(walletAddress);
    
    console.log(`Score: ${profile.reputation_score}`);
    console.log(`Tier: ${profile.tier}`);
    console.log(`Is Verified: ${profile.verified}`);
    
    // List user credentials
    profile.credentials.forEach(cred => {
      console.log(`- ${cred.name} (${cred.status}) issued by ${cred.issuer_name}`);
    });
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

checkUserReputation('GA2C7...55');
```

### 3. Generate and Embed a Trust Badge

Retrieve the ready-to-use `iframe` HTML code to render a gorgeous, glassmorphic trust badge on your website:

```typescript
async function renderUserBadge(walletAddress: string) {
  const badge = await stellarId.getBadge({
    walletAddress,
    style: 'dark', // 'light' | 'dark'
    size: 'md',     // 'sm' | 'md' | 'lg'
  });

  console.log('Insert this HTML to display the badge:');
  console.log(badge.html);
  
  // Or get the direct URL to use as you wish:
  console.log('Iframe URL:', badge.iframe_url);
}
```

### 4. Issue a New Credential

Programmatically issue credentials to builders. This inserts a pending credential and emails the recipient a secure link to claim it:

```typescript
async function sendDeveloperCredential(recipientEmail: string, walletAddress?: string) {
  const result = await stellarId.issueCredential({
    recipientEmail,
    recipientWallet: walletAddress, // Optional
    credential: {
      name: 'github_developer',
      description: 'Verified GitHub Contributor',
      metadata: {
        repositoriesContributionCount: 15,
        languages: ['Rust', 'TypeScript']
      },
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    }
  });

  console.log(`Credential Pending! Claim URL: ${result.claim_url}`);
}
```

---

## React Integration Pattern

You can build a reactive hook or component to fetch reputation dynamically:

```tsx
import React, { useState, useEffect } from 'react';
import { StellarID, VerifyWalletResponse } from 'stellarid-sdk';

const stellarIdClient = new StellarID({ apiKey: process.env.NEXT_PUBLIC_STELLARID_KEY! });

export function UserReputationWidget({ walletAddress }: { walletAddress: string }) {
  const [data, setData] = useState<VerifyWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stellarIdClient.verifyWallet(walletAddress)
      .then(setData)
      .finally(() => setLoading(false));
  }, [walletAddress]);

  if (loading) return <div>Loading reputation...</div>;
  if (!data) return <div>Unverified User</div>;

  return (
    <div className="reputation-card">
      <h4>Reputation: {data.reputation_score}</h4>
      <span className="tier-tag">{data.tier}</span>
    </div>
  );
}
```

---

## SDK API Reference

| Method | Parameters | Return Type | Required API Permission | Description |
| :--- | :--- | :--- | :--- | :--- |
| `verifyWallet(walletAddress)` | `walletAddress: string` | `Promise<VerifyWalletResponse>` | `verify` | Fetches a wallet's full reputation score, credentials list, and tier. |
| `getBadge(params)` | `{ walletAddress, style?, size? }` | `Promise<GetBadgeResponse>` | `verify` or `read_profile` | Generates iframe embedding HTML & source URL to show a micro-badge. |
| `issueCredential(params)` | `{ recipientEmail, recipientWallet?, credential }` | `Promise<IssueCredentialResponse>` | `issue` | Creates a pending credential and triggers a verification email. |
| `getCredential(credentialId)` | `credentialId: string` | `Promise<GetCredentialResponse>` | `read_profile` | Retrieves specific details of an existing, verified credential. |
| `getProof(credentialId)` | `credentialId: string` | `Promise<GetProofResponse>` | `verify` | Retrieves details about a verified zero-knowledge proof for a credential. |

---

## License

MIT License. Copyright (c) 2026 StellarID.
