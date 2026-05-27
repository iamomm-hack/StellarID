<p align="center">
  <img src="./frontend/public/logo.png" alt="StellarID Logo" width="160" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Soroban-7c3aed?style=for-the-badge&logo=stellar&logoColor=white" />
  <img src="https://img.shields.io/badge/ZK--SNARKs-Circom-00e676?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" />
</p>

<h1 align="center">StellarID</h1>
<h3 align="center">Verify once. Prove everywhere.</h3>

<p align="center">
  <strong>A protocol-grade identity and reputation layer on Stellar. Users verify their attributes once and generate zero-knowledge proofs to authenticate anywhere without disclosing private personal metadata.</strong>
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-the-problem">The Problem</a> •
  <a href="#-the-solution">The Solution</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-advanced-features-deep-dive">Advanced Features</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-smart-contracts-stellar-testnet">Smart Contracts</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#%EF%B8%8F-environment-setup">Environment Setup</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-user-validation--onboarding">User Validation</a> •
  <a href="#-future-roadmap--evolution">Roadmap</a>
</p>

---

## ⚡ Live Demo

| Resource | Link |
|---|---|
| 🌐 **Live App** | [StellarID Live App](https://stellarid-id.vercel.app/) |
| 📊 **User Validation (30+ Users)** | [Feedback Spreadsheet (Google Sheets)](https://docs.google.com/spreadsheets/d/1rahOBAd3jOako0YuvpEnNRjesX23tCQUc6hV2-xk_xc/edit?usp=sharing) |
| 🔍 **Testnet Explorer** | [Stellar Expert](https://stellar.expert/explorer/testnet) |
| 🖥️ **Backend API Health** | [https://stellarid-api.onrender.com/health](https://stellarid-api.onrender.com/health) |
| 🔐 **Security Checklist** | [SECURITY.md](./SECURITY.md) |

---

## 🔥 The Problem

Every time you sign up for a service, you hand over your **name, address, date of birth, income, or government ID** — to centralized databases you do not control.

| Problem | Reality |
|---|---|
| **Repeated KYC** | Users verify identity 10+ times across platforms. Same documents. Same friction. Every time. |
| **Data Breaches** | Billions of records exposed annually. Your personal data sits in 50+ company databases. |
| **No Ownership** | You don't own your identity. Platforms do. They can sell, lose, or revoke access without consent. |

> **The internet has a login system. It doesn't have a secure identity system.**

---

## 💡 The Solution

**StellarID** flips the model. Instead of sharing raw data, you generate a **zero-knowledge proof** — a cryptographic guarantee that something is true, without revealing the underlying data.

| Before StellarID | With StellarID |
|---|---|
| Share full passport to prove age | Prove "I am over 18" — nothing else |
| Upload bank statements for income | Prove "Income > $50K" — no numbers exposed |
| Re-verify on every new platform | Verify once, prove anywhere, forever |
| Platform owns your data | **You** own your identity |

**One verification. Infinite proofs. Zero data exposure.**

---

## 📸 Screenshots

<p align="center">
  <em>Landing Page — Verify once. Prove everywhere.</em><br/>
  <img src="docs/screenshots/landing.png" alt="StellarID Landing Page" width="800" />
</p>

<p align="center">
  <em>Dashboard — Credential management & ZK proof generation</em><br/>
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="800" />
</p>

<p align="center">
  <em>Admin Analytics — Real-time platform metrics & activity feed</em><br/>
  <img src="docs/screenshots/admin.png" alt="Admin Dashboard" width="800" />
</p>

<p align="center">
  <em>Verification Page — Public proof verification with badge</em><br/>
  <img src="docs/screenshots/verify.png" alt="Verification Page" width="800" />
</p>

<p align="center">
  <em>API Documentation — Interactive docs with code examples</em><br/>
  <img src="docs/screenshots/docs.png" alt="API Docs" width="800" />
</p>

---

## 🧠 How It Works

<p align="center">
  <img src="docs/flowchart.png" alt="StellarID System Flowchart" width="900" />
</p>


**5 steps. Zero personal data transmitted. Fully verifiable on-chain.**

1.  **Connect** — User connects their Stellar wallet via Freighter or registers/logs in via Privy (using email/social logs) to create an embedded account.
2.  **Verify** — Complete identity verification through an issuer (e.g., GitHub OAuth, email token validation, or CSV upload).
3.  **Receive** — Get a non-transferable NFT-based credential minted on-chain using Soroban smart contracts.
4.  **Prove** — Generate a ZK proof client-side (never sends raw metadata to the server).
5.  **Share** — Share proof via link, PDF with QR code, or embeddable badge.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript | App shell, SSR, routing, Privy SDK |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Node.js, Express, TypeScript | REST API, BullMQ worker queues, Resend |
| **Database** | PostgreSQL, SQLite | Primary indexed database (PG), Discord DB (SQLite) |
| **Cache** | Redis | Session cache, analytics caching, rate limiter, queues |
| **Blockchain** | Stellar + Soroban | Smart contracts, credential NFTs |
| **ZK Proofs** | Circom + snarkjs | ZK-SNARK circuit compilation & client-side proving |
| **Storage** | IPFS (Pinata) | Decentralized credential metadata commitments |
| **Auth** | JWT + Stellar Wallet | Wallet-based and OAuth session authentication |

---

## 🔥 Key Features

### 🪪 Identity & Credentials
*   **Freighter & Privy Onboarding**: Connect with Freighter wallet or onboard Web2 users seamlessly via email OTP/Google oauth using Privy.
*   **Soroban NFT Credentials**: Verifiable on-chain credentials minted as non-transferable Soroban NFTs.
*   **OAuth Issuers**: Instantly claim credentials validating your GitHub or LinkedIn developer profiles.
*   **Multi-type Credentials**: Support for age limits, income bounds, residency, memberships, and professional designations.

### 🔐 Privacy & Proofs
*   **ZK Proof Generation**: Client-side Groth16 zk-SNARK calculation using `snarkjs` (age, income, residency, membership circuits).
*   **Selective Disclosure**: Authenticate specific facts without disclosing raw birthdates, salaries, or physical addresses.
*   **Downloadable Cryptographic PDFs**: Export verification status as beautifully formatted PDFs with embedded QR codes.
*   **Verification Badges**: Display ✅ VERIFIED or ❌ REVOKED badges programmatically.

### 🛡️ Security & Infrastructure
*   **On-Chain Revocation**: Instant credential revocation on-chain managed by verified issuers.
*   **Expiry Control**: Auto-expiry management enforced via cron tasks.
*   **Admin Analytics**: Real-time SaaS dashboard monitoring credentials, proofs, and active issuers.
*   **Sliding-Window Rate Limiting**: Redis-backed API protection against DDoS/abuse.

---

## 🚀 Advanced Features Deep Dive

### 💸 Fee Sponsorship (Gasless Transactions)
Users do not pay network fees! StellarID covers all Soroban minting and verification transaction costs using Stellar's fee bump mechanism.

| Feature | Description |
|---------|-------------|
| **Zero-cost UX** | Users claim on-chain credentials without holding XLM in their wallets |
| **Fee Bump Transactions** | Sponsor account covers network transaction charges |
| **Usage Tracking** | Live monitoring of sponsored transaction volumes and remaining quota |

```bash
# Check sponsor status
GET /api/v1/fee-sponsor/status

# Response
{
  "sponsor": {
    "address": "GBMQJ3G5LDWODZKUUQWGGT6NIKMM7KL5NLHVIG53WLNLWB27Z4AKH3F4",
    "balance": "1000 XLM",
    "canSponsor": true,
    "transactionsRemaining": 100000
  }
}
```

---

### 🔐 Multi-Signature Credential Approval
Sensitive corporate, medical, or academic credentials require $N$-of-$M$ signatures before on-chain minting is authorized.

| Feature | Description |
|---------|-------------|
| **N-of-M Signatures** | Configurable signature thresholds (e.g. HR + Manager approval) |
| **Distributed Trust** | Prevents single point of failure in credential authority |
| **On-Chain Audit Trail** | Signatures compiled and committed directly to the blockchain |

```bash
# Create multi-sig request
POST /api/v1/multisig/request
{
  "credentialType": "corporate_identity",
  "requiredSigners": ["GBM...HR", "GA5...MANAGER"],
  "threshold": 2
}

# Sign request
POST /api/v1/multisig/sign/:requestId
{
  "signature": "..."
}
```

---

### 📧 Claim Credential Email Flow
Organizers can issue credentials to users who do not have a wallet or Stellar account set up yet. Users receive an email with a secure claim token.

*   **Database Schema (`pending_credentials`)**:
    ```sql
    CREATE TABLE pending_credentials (
      id UUID PRIMARY KEY,
      issuer_id UUID NOT NULL REFERENCES issuers(id),
      recipient_email VARCHAR(255) NOT NULL,
      recipient_wallet VARCHAR(100),
      credential_data JSONB NOT NULL,
      claim_token UUID UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      claim_attempts INTEGER DEFAULT 0,
      expires_at TIMESTAMP NOT NULL,
      claimed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ```
*   **Security Constraints**: Expiry time of 7 days; max 3 claim attempts per token; Redis rate limit of 5 token page loads per IP per hour.

---

### 📥 Bulk Credential Issuance Queue
Organizers can upload CSV templates containing up to 1,000 recipients. A Redis-backed BullMQ worker processes each row asynchronously to prevent SMTP blocking and database connection exhaustion.

*   **Database Schema (`bulk_issuance_jobs`)**:
    ```sql
    CREATE TABLE bulk_issuance_jobs (
      id UUID PRIMARY KEY,
      issuer_id UUID NOT NULL,
      job_name VARCHAR(255) NOT NULL,
      credential_template JSONB NOT NULL,
      total_recipients INTEGER NOT NULL,
      processed_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'queued',
      csv_ipfs_hash VARCHAR(255),
      error_log JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    );
    ```
*   **Queue Rate Limits**: Limits email dispatches to a maximum of 10 messages per second.

---

### 📊 Composite Reputation Score System
StellarID calculates a unified user reputation score $S_i$ mapping verified achievements, streaks, and active disputes:

$$S_i = \text{clamp}\left(100 + \sum w_c \cdot m_{\text{issuer}} + 15 \cdot \text{streak} - 25 \cdot \text{disputes}, 0, 1000\right)$$

*   **Tiers**:
    *   `0-199`: Verified
    *   `200-499`: Proven
    *   `500+`: Elite Builder
*   **Decay Rule**: Half-life degradation of 90 days applies to credential age.
*   **Issuer Trust Tiers ($m_{\text{issuer}}$)**:
    *   *Tier 1 (Community)*: $0.20$ base weight (based on 5+ endorsements from other verified issuers)
    *   *Tier 2 (Official)*: $0.80$ weight (requires DNS TXT record matching `stellarid-verify=TOKEN_UUID`)
    *   *Tier 3 (Endorsed)*: $1.00$ weight (manually vetted and endorsed by platform administrators)

---

### 🤖 Discord Gating Bot
Community managers can gate specific Discord guild channels based on a user's verified StellarID reputation tier.

*   **Slash Commands**:
    *   `/verify wallet:G...` - Connects discord handle to Stellar address, returns embed profile, and assigns the corresponding tier role (`StellarID Verified`, `Proven Builder`, `Elite Builder`).
    *   `/gate channel:#chan min-tier:Proven` - Gates a specific channel requiring Proven or Elite Builder tiers.
*   **Local DB**: SQLite database tracks guild settings and member roles:
    ```sql
    CREATE TABLE guilds (guild_id TEXT PRIMARY KEY, setup_done INTEGER, log_channel TEXT);
    CREATE TABLE verified_members (discord_id TEXT PRIMARY KEY, wallet_address TEXT, current_tier TEXT);
    ```

---

### 💳 Monetization Tier Infrastructure
Provides Stripe billing tiers for issuers based on their monthly volume and feature needs.

*   **Tiers**:
    *   `FREE`: 100 credentials/month, 100 API calls/hour.
    *   `PRO` ($49/mo): Unlimited credentials, bulk issuance enabled, 5,000 API calls/hour.
    *   `ENTERPRISE` ($500/mo): Custom white-label integrations, 50,000 API calls/hour, custom contracts.
*   **Sandbox Mode**: Locally test billing capabilities with a mock upgrade route `POST /api/billing/mock-upgrade` to switch status without external Stripe keys.
*   **Direct Treasury Payment**: Pay directly using XLM/USDC on the Stellar Network to treasury address: `GBMQJ3G5LDWODZKUUQWGGT6NIKMM7KL5NLHVIG53WLNLWB27Z4AKH3F4`.

---

## 📡 API Reference

Full developer endpoint mapping:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/connect` | Connect wallet & obtain JWT token | — |
| `GET` | `/api/v1/auth/me` | Fetch active user credentials and info | 🔐 JWT |
| `POST` | `/api/v1/credentials` | Issue a single credential | 🔐 JWT |
| `GET` | `/api/v1/credentials/my` | List logged credentials for wallet | 🔐 JWT |
| `POST` | `/api/v1/credentials/issue-with-email` | Create pending credential and email claim link | 🔐 JWT |
| `POST` | `/api/v1/credentials/claim/:token` | Complete pending credential claim | — |
| `POST` | `/api/v1/bulk/upload` | Process bulk CSV file for multi-credential issuance | 🔐 JWT |
| `GET` | `/api/v1/reputation/:wallet_address` | Fetch user reputation score and breakdown | — |
| `POST` | `/api/v1/issuers/:id/request-domain-verification` | Request unique token for DNS verification | 🔐 JWT |
| `POST` | `/api/v1/issuers/:id/confirm-domain-verification` | Verify domain DNS TXT record | 🔐 JWT |
| `POST` | `/api/v1/billing/create-checkout` | Initialize Stripe Checkout Session | 🔐 JWT |
| `POST` | `/api/v1/billing/mock-upgrade` | Simulate instant billing upgrade (Sandbox) | 🔐 JWT |

---

## 🔒 ZK Circuits

StellarID compiles and runs 4 Circom zk-SNARK circuits under Groth16 setups:

### 1. `age_check`
Proves a user's age satisfies a threshold constraint.
*   *Private Inputs*: `birthYear`
*   *Public Inputs*: `currentYear`, `ageLimit`
*   *Outputs*: `isAboveLimit` (1 or 0)

### 2. `income_check`
Proves income falls within min and max boundaries.
*   *Private Inputs*: `income`
*   *Public Inputs*: `minIncome`, `maxIncome`
*   *Outputs*: `isValid` (1 or 0)

### 3. `residency_check`
Proves geographic location is within an approved list.
*   *Private Inputs*: `countryCode`
*   *Public Inputs*: `allowedCountries[10]`
*   *Outputs*: `isResident` (1 or 0)

### 4. `membership_check`
Proves membership in a group root.
*   *Private Inputs*: `memberSecret`, `merklePathElements[16]`, `merklePathIndices[16]`
*   *Public Inputs*: `groupRoot`
*   *Outputs*: `isValidMember` (1 or 0)

---

## 📊 Performance Metrics

| Metric | Value | Detail |
|---|---|---|
| **ZK Proof Generation** | ~0.87s | Client-side, no server round-trip |
| **API Response (cached)** | <100ms | Redis-backed analytics queries |
| **API Response (uncached)** | <300ms | PostgreSQL with indexed queries |
| **Contract Deployment** | ~5s | Soroban testnet via Stellar CLI |
| **WASM Contract Size** | 12–17 KB | Optimized with `opt-level = "z"` |
| **PDF Generation** | <500ms | Server-side with pdfkit + QR code |

---

## 🔗 Smart Contracts (Stellar Testnet)

Soroban smart contracts deployed on Stellar Testnet:

| Contract | Purpose | Contract ID |
|---|---|---|
| **Credential NFT** | Mint, transfer, validate credential NFTs | `CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX` |
| **Revocation Registry** | On-chain credential revocation by issuers | `CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3` |
| **Disclosure Contract** | Selective disclosure verification records | `CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2` |

**Verification Links:**
*   [View Credential NFT Contract](https://stellar.expert/explorer/testnet/contract/CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX)
*   [View Revocation Registry Contract](https://stellar.expert/explorer/testnet/contract/CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3)
*   [View Disclosure Contract](https://stellar.expert/explorer/testnet/contract/CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2)

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        User["User (Browser)"]
        Wallet["Freighter Wallet"]
        PrivyWallet["Privy Embedded Wallet (Email/Social)"]
        DiscordClient["Discord Member / Admin"]
    end

    subgraph Frontend["⚡ Frontend (Next.js 14)"]
        UI["React SPA Dashboard / Landing"]
        ZK["ZK Client Prover (snarkjs)"]
        PrivySDK["Privy Auth Provider"]
        Zustand["Zustand State Store"]
        SDK["stellarid-sdk & React Hooks"]
    end

    subgraph Backend["🔧 Backend (Express App / Node.js)"]
        API["REST API Router (/api/v1)"]
        AuthMiddleware["JWT Verification & Auth Middleware"]
        SponsorService["Fee Sponsor Manager"]
        MultisigService["Multi-Sig Signatures Coordinator"]
        BulkService["Bulk Issuance CSV Processor"]
        ReputationScore["Composite Reputation Evaluator"]
        PDFGen["PDF Report Generator (pdfkit & qr-image)"]
        DomainVerifier["DNS TXT Record Resolver (dns)"]
    end

    subgraph Workers["⚡ Workers & Queue Engine"]
        Queue["BullMQ Job Queue"]
        Worker["Background Email & Mint Worker"]
    end

    subgraph ThirdParty["🔌 Integration / SaaS Ecosystem"]
        StripeAPI["Stripe Billing & Portal Gateway"]
        ResendAPI["Resend SMTP Email dispatch"]
        DiscordBot["Discord v14 bot listener"]
    end

    subgraph Data["💾 Database & Cache Layer"]
        PG[("PostgreSQL (Primary DB)")]
        SQLite[("SQLite (Discord Guild config DB)")]
        Redis[("Redis (Queue, Limiter, Session Cache)")]
        IPFS["Decentralized Storage (Pinata IPFS)"]
    end

    subgraph Blockchain["⛓️ Stellar Blockchain"]
        Soroban["Soroban Smart Contracts Engine"]
        NFT["Credential NFT contract (CBIO...)"]
        Revoke["Revocation Registry contract (CDRP...)"]
        Disclose["Disclosure Verification contract (CDRU...)"]
    end

    %% Client and Frontend flows
    User -->|Interact| UI
    User -->|Manage Wallet| Wallet
    User -->|OAuth / OTP| PrivySDK
    PrivySDK -->|Embedded Account| PrivyWallet
    UI -->|Import Hooks| SDK
    UI -->|Generate proofs| ZK
    DiscordClient -->|Commands / verify| DiscordBot

    %% Frontend to Backend
    UI -->|API Requests| API
    PrivyWallet -->|Claim NFT / Transact| Soroban
    Wallet -->|Claim NFT / Transact| Soroban

    %% Backend to Internal
    API -->|Authenticate| AuthMiddleware
    API -->|Process Multi-sig| MultisigService
    API -->|DNS Check| DomainVerifier
    API -->|Request Gasless TX| SponsorService
    API -->|Upload CSV| BulkService
    API -->|Score Reputation| ReputationScore
    API -->|Request PDF certificate| PDFGen

    %% Services to Data / External / Worker
    BulkService -->|Enqueue jobs| Queue
    Queue -->|State & Jobs storage| Redis
    Worker -->|Fetch jobs| Queue
    Worker -->|Send claim links| ResendAPI
    Worker -->|Save state| PG
    SponsorService -->|Bump gas fees| Soroban

    %% ThirdParty API connections
    API -->|Billing checkout & portal| StripeAPI
    StripeAPI -->|Webhook events| API
    DiscordBot -->|Lookup user profile / check tier| API
    DiscordBot -->|Save guild setting| SQLite

    %% Data layers
    AuthMiddleware -->|Validate user| PG
    API -->|Cache stats / Rate limiting| Redis
    API -->|Save metadata hashes| IPFS
    API -->|Query credentials & users| PG

    %% Soroban interactions
    SponsorService -->|Sign fee-bumps| Soroban
    Soroban --> NFT
    Soroban --> Revoke
    Soroban --> Disclose

    style Client fill:#13111c,stroke:#7c3aed,color:#fff
    style Frontend fill:#0f172a,stroke:#00e676,color:#fff
    style Backend fill:#1e1b4b,stroke:#8b5cf6,color:#fff
    style Workers fill:#172554,stroke:#3b82f6,color:#fff
    style ThirdParty fill:#312e81,stroke:#f59e0b,color:#fff
    style Data fill:#020617,stroke:#06b6d4,color:#fff
    style Blockchain fill:#030712,stroke:#ec4899,color:#fff
```

### 🏗️ Architectural Core Layers
StellarID is built upon a highly modular, multi-tier system architecture:

1. **Client-Side ZK Prover (Next.js 14)**: Executes Groth16 ZK-SNARK computations inside the client's browser utilizing `snarkjs` and custom compiled WASM circuit models. This guarantees that raw personal details (such as actual age, exact income, or full residential addresses) never cross the network boundaries.
2. **REST API Interface & Middleware (Node.js + Express)**: Provides structured API routes protected by sliding-window rate-limiting and robust security layers (JWT authentication, inputs verification, and SQL-injection prevention).
3. **Queue & Background Execution Engine (BullMQ + Redis)**: Handles intensive, asynchronous operations (such as compiling bulk CSV recipient imports, queuing credential claims, and sending transactional SMTP emails) to keep HTTP response times sub-100ms.
4. **On-Chain Soroban Engine**: A collection of Rust-based smart contracts deployed to the Stellar Testnet. They maintain decentralized state control over credential NFT ownership, direct revocation registries, and selective-disclosure logs.
5. **Fee Sponsorship Gateway**: Leverages Stellar's native Fee Bump transaction mechanism to sponsor gas/execution costs, creating a gasless and zero-friction onboarding flow for Web2 users.
6. **B2B Integration Layer**: Exposes an advanced, tree-shakeable npm package (`stellarid-sdk`) and a custom Discord Bot allowing community managers to gate channels or look up profiles with zero overhead.

---

## 📂 File Explorer Structure

```
StellarID/
├── backend/                  # Express + TypeScript REST API
│   ├── src/
│   │   ├── config/           # Application-wide configurations (badges, database client, rate limiters)
│   │   ├── db/               # PostgreSQL schema models & migration scripts
│   │   ├── jobs/             # BullMQ background worker setups (Bulk issuance & claim mail queues)
│   │   ├── middleware/       # JWT parsing, monetization tier check, and API rate-limiting middlewares
│   │   ├── routes/           # REST endpoints (auth, credentials, billing portal, domain verification)
│   │   ├── services/         # Integrations (Stellar Soroban contract executor, Stripe, Resend SMTP client)
│   │   ├── types/            # App-wide TS interfaces & database entity types
│   │   └── utils/            # Helper utility modules (sliding-window rate calculation, JWT generators)
│   ├── tests/                # Full test suites for integration endpoints & reputation logic
│   ├── package.json          # Node dependencies list
│   └── tsconfig.json         # TS compilation configs
│
├── frontend/                 # Next.js 14 Web Application
│   ├── src/
│   │   ├── app/              # Next.js App Router paths (landing page, dashboard, admin panel, claims)
│   │   ├── components/       # Interface components (wallet button, identity cards, skeleton placeholders)
│   │   ├── hooks/            # Custom hooks wrapping Privy authentication & state checks
│   │   ├── lib/              # API wrapper client & client-side snarkjs proof engines
│   │   ├── store/            # Unified state management layer using Zustand
│   │   └── types/            # Frontend specific TypeScript interfaces
│   ├── public/               # Static assets & circuit proving keys (.zkey / .wasm files)
│   ├── package.json          # Next.js workspace configurations
│   └── tsconfig.json         # Front-end compiler rules
│
├── stellarid-sdk/            # B2B Integration SDK (npm library)
│   ├── src/
│   │   ├── client.ts         # Main client class containing verification, issuance, and ZK methods
│   │   ├── types.ts          # Core typings shared with developers
│   │   └── index.ts          # ESM & CommonJS entry exports via tsup bundle compilation
│   ├── tests/                # SDK client integration test suite
│   └── package.json          # SDK build settings
│
├── discord-bot/              # discord.js v14 Guild Gating bot
│   ├── src/
│   │   ├── commands/         # Bot commands (/verify, /gate, /leaderboard)
│   │   └── index.ts          # Bot listener, SQLite member tracking, and role assignment logic
│   └── package.json          # Discord dependencies
│
├── zk-circuits/              # Circom Circuits & compilation scripts
│   ├── age_check.circom      # Proves age threshold without revealing year of birth
│   ├── income_check.circom   # Proves income range boundaries
│   ├── residency_check.circom# Proves allowed country residency
│   ├── membership_check.circom# Proves Merkle tree membership inclusion
│   └── compile.js            # Node script compiling circuits to WASM and building ZKeys
│
├── contracts/                # Soroban Rust Smart Contracts
│   ├── src/                  # Smart contracts source files (NFT, Revocation Registry, Disclosure)
│   └── Cargo.toml            # Soroban compiler settings
│
├── docker-compose.yml        # Orchestration template for PG, Redis, backend and frontend containers
└── README.md                 # Complete project guide and documentation
```

---


## ⚙️ Environment Setup

### Backend `.env`
```bash
PORT=5555
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://stellarid_user:stellarid_pass@localhost:5432/stellarid_db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=stellarid_local_dev_secret
JWT_EXPIRES_IN=7d

# Stellar Config
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015

# Smart Contract IDs
CREDENTIAL_NFT_CONTRACT_ID=CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX
REVOCATION_CONTRACT_ID=CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3
DISCLOSURE_CONTRACT_ID=CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2

# IPFS Pinata
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Resend Email Config
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=noreply@stellarid.io
CLAIM_BASE_URL=http://localhost:3000/claim

# Privy Config
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

### Frontend `.env`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5555/api/v1
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js ≥ 18
*   PostgreSQL ≥ 14
*   Redis ≥ 7
*   Freighter Wallet Extension installed

### Installation & Launch
```bash
# Clone the repository
git clone https://github.com/iamomm-hack/StellarID.git
cd StellarID

# Run Backend Services
cd backend
npm install
npm run dev

# Run Frontend Application (in separate terminal)
cd ../frontend
npm install
npm run dev
```

---

## 👥 User Validation & Onboarding

To validate our MVP verification cycles, we conducted onboarding checks with **5 real testnet users**.

### User Feedback Summary

📊 **[Live Feedback Google Sheet](https://docs.google.com/spreadsheets/d/1cemhWHZrEQb0H7FeFCJnAmfDF86QveHgiuNLDHHm22o/edit?usp=sharing)**

| Date | Name | Wallet Address | Email | UX Rating | Favorite Feature | Bugs/Errors | Future Improvement |
|---|---|---|---|---|---|---|---|
| Mar 22, 2026 | Satish jalan | `GDZWLHG6WBRYIGWE2JXJRI4LTXLWQSTBCSXK3XB6HLB2QOTS4DNXDSKP` | satishjalan9163@gmail.com | 5/5 | ZK Proof PDF | None | On-chain ZK-proof verification via Soroban smart contracts |
| Mar 22, 2026 | Mufti Armaan | `GA5RKOAUAVEA5POB4HKI2HCIZ3K67SZYLUW5SOACOAKCNDSM4XLC5BPR` | flamecyborg5@gmail.com | 5/5 | PDF with QR Code | None | A small guide or tooltip for Freighter wallet connection |
| Mar 23, 2026 | Amit Shah | `GCUOCLOPD3I7ECINEXFOJVGFQFNJILYW26BERBCCQBQ7WHJMICHR2WPM` | as3131257@gmail.com | 5/5 | Speed of proof generation | None | None |
| Mar 23, 2026 | Rajdeep Dutta | `GB2CC6D3E3SXRJUPNJ43WGMFFYEN5CNP6NRY5L2S7NUDLEAZW5IMRVLK` | rajdeepdutta393@gmail.com | 5/5 | PDF report with QR code — practical and satisfying | Dashboard loading lag — thought page stopped working | Smoother dashboard loading with animation |
| Mar 24, 2026 | Manjeet s. | `GDLQU6LOKWYX2EUNU7PNOK3IT27MEQD7FDR7EDWTWYVZ66HXSNKGAMO6` | manjeetsharma0796@gmail.com | 4/5 | ZK Concept | None | More credentials to store |


---

## 🤝 Contributing
Contributions are welcome! Please fork this repository and open a pull request into `main` with detailed descriptions of your enhancements.

---

## 📬 Contact

| Channel | Link |
|---|---|
| **GitHub** | [@iamomm-hack](https://github.com/iamomm-hack) |
| **Twitter/X** | [@omdotcmd](https://twitter.com/omdotcmd) |
| **Email** | iamkumarom.edu@gmail.com |

---

## 📜 License
This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ on Stellar</strong><br/>
  <sub>StellarID — Verify once. Prove everywhere.</sub>
</p>

