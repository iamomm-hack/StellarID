# StellarID Architecture

## 1. System Overview

### Problem Statement
Traditional identity verification requires users to repeatedly upload sensitive documents (passports, driver's licenses, bank statements) to every service. This creates:
- **Massive data breach risk**: 147M records leaked in Equifax alone
- **No user control**: Once shared, data cannot be un-shared
- **Redundant verification**: Same documents uploaded 10+ times

### Solution
StellarID is a decentralized identity verification platform that combines:
- **Stellar blockchain** for tamper-proof credential NFTs
- **Zero-knowledge proofs** for privacy-preserving verification
- **Decentralized issuance** from trusted third-party issuers

```
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │    USER       │     │   ISSUER     │     │  PLATFORM    │
 │  (Freighter)  │     │  (GitHub)    │     │  (DeFi App)  │
 └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
        │                     │                     │
        │  1. Connect wallet  │                     │
        │─────────────────────▶                     │
        │                     │                     │
        │  2. Verify identity │                     │
        │◀────────────────────│                     │
        │                     │                     │
        │  3. Mint NFT        │                     │
        │   credential on     │                     │
        │   Stellar           │                     │
        │◀────────────────────│                     │
        │                     │                     │
        │  4. Generate ZK proof (client-side)       │
        │───────────────────────────────────────────▶
        │                     │                     │
        │  5. Returns: { verified: true }           │
        │  (NO personal data transmitted)           │
        │◀───────────────────────────────────────────
        │                     │                     │
 ┌──────┴───────┐     ┌──────┴───────┐     ┌──────┴───────┐
 │   Stellar    │     │     IPFS     │     │   Backend    │
 │  Blockchain  │     │  (Metadata)  │     │   (Verify)   │
 └──────────────┘     └──────────────┘     └──────────────┘
```

### Privacy Guarantees
- Private data NEVER leaves the user's device
- Platforms receive only YES/NO answers
- No centralized personal data storage

---

## 2. Zero-Knowledge Proof System

### What is a zk-SNARK?
A zk-SNARK (Zero-Knowledge Succinct Non-interactive Argument of Knowledge) lets you prove a statement is true without revealing the underlying data. For example: "I am over 21" without revealing your birthdate.

### Groth16 Proof System
StellarID uses the Groth16 proving system because:
- **Fast verification**: ~10ms on-chain/server
- **Small proof size**: ~200 bytes
- **Mature ecosystem**: Well-audited, battle-tested

### Trusted Setup (Powers of Tau)
Before generating proofs, a one-time trusted setup ceremony produces cryptographic parameters. StellarID uses the Hermez community ceremony (Powers of Tau 2^12), which involved thousands of participants — only one honest participant is needed for security.

### Why Private Inputs Stay on Device
The proof is generated entirely in the user's browser using WebAssembly (snarkjs). The circuit takes private inputs (e.g., birthdate) and public inputs (e.g., minimum age), then produces a proof that can be verified without the private inputs.

### Circuits

| Circuit | Private Inputs | Public Inputs | Proves |
|---------|---------------|---------------|--------|
| `age_check` | birthYear, birthMonth, birthDay, credentialNFTId | currentYear, currentMonth, minAge | Age ≥ minAge |
| `income_check` | exactIncome, credentialNFTId | incomeThreshold | Income ≥ threshold |
| `residency_check` | countryCode, credentialNFTId | allowedCountryCode | Country matches |
| `membership_check` | membershipTier, credentialNFTId | requiredTier | Tier ≥ required |

---

## 3. Stellar Blockchain Layer

### Why Stellar?
- **Fast finality**: ~5 second transactions
- **Low cost**: Fractions of a cent per transaction
- **Soroban**: Smart contract platform with Rust SDK
- **Testnet**: Free testing with Friendbot

### NFT Credentials as Soroban Tokens
Each verified credential is minted as an NFT via the `credential_nft` Soroban contract:
- Stores credential metadata hash (not the actual data)
- Tracks ownership, issuance, expiry
- Supports transfer between addresses
- On-chain revocation by issuer

### Transaction Flow
1. Issuer calls `mint_credential()` on Soroban
2. Contract stores credential struct with owner, issuer, type, hash
3. User's wallet receives the NFT
4. For verification: `is_valid()` checks revocation + expiry
5. For revocation: Issuer calls `revoke()` — updates on-chain state

---

## 4. Privacy Guarantees

### What StellarID NEVER Stores
- Birthdates, ages, or personal identifiers
- Income data or financial records
- Government ID numbers or documents
- Biometric data

### What Platforms Receive
```json
{
  "verified": true,
  "claim": "age_check",
  "timestamp": "2024-01-01T00:00:00Z"
}
```
That's it. No personal data. Ever.

### GDPR Compliance
- Users control all disclosure through ZK proofs
- No personal data stored server-side
- Right to be forgotten: revoke credential on-chain
- Data minimization: only boolean claims shared

---

## 5. Security Model

### Issuer Trust Model
Issuers are trusted third parties (GitHub, universities, KYC providers) who verify real-world identity. Their reputation is trackable on-chain.

### Credential Lifecycle
1. **Issuance**: Issuer verifies identity → mints NFT
2. **Active**: Credential is valid and on-chain
3. **Expiry**: Time-based automatic expiration
4. **Revocation**: Issuer revokes on-chain (fraud, request)

### Rate Limiting
- Verify endpoint: 100 requests/minute per API key
- Auth endpoint: 20 requests/minute per IP

---

## 6. API Reference

### POST /api/v1/verify
Verify a zero-knowledge proof.

**Headers**: `X-API-Key: <platform_api_key>`

**Request**:
```json
{
  "credentialId": "uuid",
  "proofType": "age_check",
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...], "protocol": "groth16" },
  "publicSignals": ["1", "2025", "3", "21"]
}
```

**Response**:
```json
{
  "verified": true,
  "claim": "age_check",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### POST /api/v1/auth/connect-wallet
Connect a Stellar wallet.

**Request**:
```json
{
  "stellarAddress": "GABC...",
  "signature": "...",
  "message": "StellarID authentication: 1234567890"
}
```

**Response**:
```json
{
  "token": "jwt_token",
  "user": { "id": "uuid", "stellarAddress": "GABC..." }
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| 401 | Missing or invalid authentication |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
