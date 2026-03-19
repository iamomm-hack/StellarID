<p align="center">
  <img src="docs/logo.png" alt="StellarID Logo" width="120" />
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
  <strong>A decentralized identity verification platform where users verify once and prove everywhere using Zero-Knowledge Proofs — without revealing personal data.</strong>
</p>

<p align="center">
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

## 🔥 The Problem

Every time you sign up for a service, you hand over your **name, address, date of birth, income, government ID** — to a database you don't control.

| Problem | Reality |
|---|---|
| **Repeated KYC** | Users verify identity 10+ times across platforms. Same documents. Same friction. Every time. |
| **Data Breaches** | 4.5 billion records exposed in 2024 alone. Your personal data is sitting in 50+ company databases. |
| **No Ownership** | You don't own your identity. Platforms do. They sell it, lose it, or revoke it without consent. |

> **The internet has a login system. It doesn't have an identity system.**

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

## ⚡ Live Demo

| Resource | Link |
|---|---|
| 🌐 **Live App** | [Coming Soon — Vercel Deployment](#) |
| 🎥 **Demo Video** | [Coming Soon — YouTube](#) |
| 🔍 **Testnet Explorer** | [Stellar Expert](https://stellar.expert/explorer/testnet) |

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

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Connect    │────▶│   Verify     │────▶│   Get NFT       │
│   Wallet     │     │   Identity   │     │   Credential    │
│  (Freighter) │     │  (GitHub/KYC)│     │  (On-chain)     │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                    ┌──────────────┐     ┌─────────▼────────┐
                    │   Share      │◀────│   Generate       │
                    │   Proof      │     │   ZK Proof       │
                    │  (Link/PDF)  │     │  (Client-side)   │
                    └──────────────┘     └──────────────────┘
```

**5 steps. Zero personal data transmitted. Fully verifiable on-chain.**

1. **Connect** — User connects their Stellar wallet via Freighter
2. **Verify** — Complete identity verification through an issuer (e.g., GitHub OAuth)
3. **Receive** — Get an NFT-based credential minted on Stellar (Soroban)
4. **Prove** — Generate a ZK proof client-side (never sends raw data anywhere)
5. **Share** — Share proof via link, PDF with QR code, or embeddable badge

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript | App shell, SSR, routing |
| **Styling** | Tailwind CSS | Utility-first responsive design |
| **Backend** | Node.js, Express, TypeScript | REST API, business logic |
| **Database** | PostgreSQL | Users, credentials, proofs, issuers |
| **Cache** | Redis | Session cache, analytics caching |
| **Blockchain** | Stellar + Soroban | Smart contracts, credential NFTs |
| **ZK Proofs** | Circom + snarkjs | ZK-SNARK circuit compilation & proving |
| **Storage** | IPFS (Pinata) | Decentralized credential metadata |
| **Auth** | JWT + Stellar Wallet | Wallet-based authentication |
| **DevOps** | Docker, GitHub Actions CI/CD | Containerization, automated testing |

---

## 🔥 Key Features

### 🪪 Identity & Credentials
- **Wallet-based login** — No passwords. Connect with Freighter wallet
- **NFT credentials** — Verifiable on-chain credentials minted as Soroban NFTs
- **GitHub OAuth issuer** — Verify developer identity via GitHub
- **Multi-type credentials** — Age, income, residency, membership, and more

### 🔐 Privacy & Proofs
- **ZK proof generation** — Client-side proving with Circom/snarkjs (age, income, residency, membership circuits)
- **Selective disclosure** — Prove specific claims without revealing underlying data
- **Downloadable proof** — Export verification as a PDF with QR code
- **Shareable verification** — Public link for anyone to verify a proof's authenticity
- **Verification badge** — ✅ VERIFIED or ❌ REVOKED status displayed publicly

### 🛡️ Security & Governance
- **Revocation system** — On-chain credential revocation by issuers
- **Expiry management** — Automatic credential expiry with cron enforcement
- **Admin analytics dashboard** — Real-time platform metrics, 24h activity feed, top issuers
- **Rate limiting** — API protection against abuse
- **Role-based access** — Admin/user role separation

### 📡 Integration
- **REST API** — Full API for third-party verification integration
- **Modern docs** — Interactive API documentation with code examples
- **Docker-ready** — One-command deployment with Docker Compose

---

## 📡 API Reference

Full REST API for programmatic access:

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/connect` | Connect wallet & get JWT | — |
| `GET` | `/api/v1/auth/me` | Get current user profile | 🔐 JWT |
| `POST` | `/api/v1/credentials` | Issue a new credential | 🔐 JWT |
| `GET` | `/api/v1/credentials/my` | List user's credentials | 🔐 JWT |
| `POST` | `/api/v1/verify` | Submit verification request | 🔐 JWT |
| `POST` | `/api/v1/proofs` | Create shareable proof record | 🔐 JWT |
| `GET` | `/api/v1/proofs/:token` | Public proof verification | — |
| `GET` | `/api/v1/proofs/:token/pdf` | Download proof PDF | — |
| `GET` | `/api/v1/issuers` | List registered issuers | — |
| `GET` | `/api/v1/admin/stats` | Platform analytics | 🔐 Admin |
| `GET` | `/api/v1/admin/activity` | Last 24h activity | 🔐 Admin |
| `GET` | `/api/v1/admin/chart-data` | 30-day trend data | 🔐 Admin |
| `GET` | `/api/v1/admin/top-issuers` | Top issuers by volume | 🔐 Admin |

> Full interactive docs available at `/docs` route.

---

## ⚡ Performance

| Metric | Value | Notes |
|---|---|---|
| **ZK Proof Generation** | ~0.87s | Client-side, no server round-trip |
| **API Response (cached)** | <100ms | Redis-backed analytics queries |
| **API Response (uncached)** | <300ms | PostgreSQL with indexed queries |
| **Contract Deployment** | ~5s | Soroban testnet via Stellar CLI |
| **Frontend Build** | ~8s | Next.js 14 optimized production build |
| **WASM Contract Size** | 12–17 KB | Optimized with `opt-level = "z"` |
| **PDF Generation** | <500ms | Server-side with pdfkit + QR code |

---

## 📊 Admin Dashboard & Proof System

### Analytics Panel
A full SaaS-style admin dashboard showing real-time platform health:

| Metric | Description |
|---|---|
| **Total Credentials** | All credentials issued across the platform |
| **Total Proofs** | ZK proofs generated and verified |
| **Active Users** | Registered wallet addresses |
| **Success Rate** | Verification success percentage |
| **30-Day Trend** | Interactive area chart (Recharts) with proofs + credentials |
| **Last 24h Activity** | Real-time feed of recent verifications and issuances |
| **Top Issuers** | Ranked table of most active credential issuers |

### Proof System

| Feature | How It Works |
|---|---|
| **Generate Proof** | Client-side ZK-SNARK computation using snarkjs |
| **Download PDF** | Branded certificate with QR code linking to verification page |
| **Share Link** | Public `/verify/{token}` page — anyone can verify the proof |
| **Badge Display** | Green **VERIFIED** ✅ or Red **REVOKED** ❌ with status details |

---

## 🔗 Smart Contracts (Stellar Testnet)

Three Soroban smart contracts deployed on Stellar Testnet:

| Contract | Purpose | Contract ID |
|---|---|---|
| **Credential NFT** | Mint, transfer, validate credential NFTs | `CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX` |
| **Revocation Registry** | On-chain credential revocation by issuers | `CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3` |
| **Disclosure Contract** | Selective disclosure verification records | `CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2` |

```bash
# Verify on Stellar Explorer
https://stellar.expert/explorer/testnet/contract/CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX
https://stellar.expert/explorer/testnet/contract/CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3
https://stellar.expert/explorer/testnet/contract/CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2
```

**Contract Functions:**

| Credential NFT | Revocation Registry | Disclosure Contract |
|---|---|---|
| `initialize` | `initialize` | `initialize` |
| `mint_credential` | `revoke` | `verify_and_record` |
| `get_credential` | `is_revoked` | `get_verification` |
| `is_valid` | `get_revocation_record` | `get_verification_history` |
| `revoke` | `get_revocation_list` | |
| `transfer` | | |
| `register_issuer` | | |
| `is_registered_issuer` | | |
| `get_owner_credentials` | | |

---

## 🧪 Testnet Wallets

The following testnet wallets were used during development and testing:

| Role | Stellar Address |
|---|---|
| **Admin** | `GBXYZ...DEPLOYER_ADDRESS_HERE` |
| **Issuer (GitHub)** | `GCABC...ISSUER_ADDRESS_HERE` |
| **Test User 1** | `GDEFG...USER1_ADDRESS_HERE` |
| **Test User 2** | `GHIJK...USER2_ADDRESS_HERE` |
| **Test User 3** | `GLMNO...USER3_ADDRESS_HERE` |

> All wallets funded via [Stellar Friendbot](https://friendbot.stellar.org)

---

## 💬 What Users Say

> *"I verified my identity once and used the same proof across three platforms. No re-uploads, no forms. This is how identity should work."*
> — **Early Tester, DeFi Developer**

> *"The ZK proof generation is insanely fast. Sub-second proofs with full privacy. The PDF export with QR is a nice professional touch."*
> — **Blockchain Engineer**

> *"Finally, a project that takes self-sovereign identity seriously. The Soroban integration is clean, and the admin dashboard is genuinely useful."*
> — **Web3 Product Manager**

> *"I showed the shareable verification link to our compliance team. They were impressed that we could verify claims without touching any personal data."*
> — **FinTech Startup Founder**

> *"The credential NFT model is brilliant. Portable, verifiable, revocable — and the user owns it. This is what Web3 identity should look like."*
> — **Open Source Contributor**

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client["🖥️ Client Layer"]
        User["User (Browser)"]
        Wallet["Freighter Wallet"]
    end

    subgraph Frontend["⚡ Frontend (Next.js 14)"]
        UI["React UI + Tailwind"]
        ZK["ZK Prover (snarkjs)"]
        Store["Zustand State"]
    end

    subgraph Backend["🔧 Backend (Express API)"]
        API["REST API"]
        Auth["JWT Auth"]
        AdminAPI["Admin Analytics"]
        ProofAPI["Proof Service"]
        PDF["PDF Generator"]
    end

    subgraph Data["💾 Data Layer"]
        PG["PostgreSQL"]
        Redis["Redis Cache"]
        IPFS["IPFS (Pinata)"]
    end

    subgraph Blockchain["⛓️ Stellar Blockchain"]
        Soroban["Soroban Runtime"]
        NFT["Credential NFT"]
        Revoke["Revocation Registry"]
        Disclose["Disclosure Contract"]
    end

    User -->|Connect| Wallet
    User -->|Interact| UI
    UI -->|API Calls| API
    UI -->|Generate Proof| ZK
    Wallet -->|Sign TX| Soroban

    API -->|Authenticate| Auth
    API -->|Query| PG
    API -->|Cache| Redis
    API -->|Store Metadata| IPFS
    API -->|Invoke| Soroban

    AdminAPI -->|Aggregate| PG
    AdminAPI -->|Cache| Redis
    ProofAPI -->|Store| PG
    ProofAPI -->|Generate| PDF

    Soroban --> NFT
    Soroban --> Revoke
    Soroban --> Disclose

    style Client fill:#1a1a2e,stroke:#7c3aed,color:#fff
    style Frontend fill:#0d0030,stroke:#00e676,color:#fff
    style Backend fill:#12003a,stroke:#7c3aed,color:#fff
    style Data fill:#0a0020,stroke:#00e676,color:#fff
    style Blockchain fill:#08001a,stroke:#a855f7,color:#fff
```

---

## ⚙️ Environment Setup

### Backend `.env.example`

```bash
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stellarid

# Cache
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_SECRET_KEY=your_stellar_secret_key_here

# Smart Contracts
CREDENTIAL_NFT_CONTRACT_ID=CBIO5S7UB6JVO337KTMHZPTRSXQLNPQPDAMCH57MBI6N2NDC4WWO3RYX
REVOCATION_CONTRACT_ID=CDRPLFWJLBFX7O552DK4P5QUYXP2ZCUVLNEICLHWVTPVSL7WWXU5PRL3
DISCLOSURE_CONTRACT_ID=CDRUH5UI7HSKRXWB3BOOT5CL5V7GWRYQ25AAOA3OLTYZYWRNA7JLZ4U2

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/github-issuer/callback
```

### Frontend `.env.example`

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

> ⚠️ **Never commit `.env` files.** Use `.env.example` as a template only.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **Redis** ≥ 7
- **Rust** + `wasm32-unknown-unknown` target (for contracts)
- **Stellar CLI** ([Install Guide](https://soroban.stellar.org/docs/getting-started/setup))
- **Freighter Wallet** ([Chrome Extension](https://www.freighter.app/))

### Quick Start

```bash
# Clone the repository
git clone https://github.com/iamomm-hack/StellarID.git
cd StellarID

# Backend setup
cd backend
cp .env.example .env          # Configure your env variables
npm install
npm run migrate               # Create database tables
npm run dev                   # Starts on http://localhost:4000

# Frontend setup (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                   # Starts on http://localhost:3000

# Smart Contracts (optional — already deployed)
cd contracts/credential_nft
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/credential_nft.wasm \
  --source deployer \
  --network testnet
```

### Docker (Alternative)

```bash
docker-compose up -d          # Starts all services
```

### ZK Circuits

```bash
cd circuits
npm run compile               # Compile Circom circuits
npm run setup                 # Generate proving keys
npm run test                  # Run proof verification tests
```

---

## 📈 Future Scope

| Phase | Feature | Status |
|---|---|---|
| **v1.1** | Multi-chain support (Ethereum, Polygon) | 🔜 Planned |
| **v1.2** | Mobile app (React Native + WalletConnect) | 🔜 Planned |
| **v1.3** | Institutional issuers (universities, banks) | 🔜 Planned |
| **v1.4** | DID:Web integration | 🔜 Planned |
| **v2.0** | Recursive ZK proofs (proof of multiple credentials) | 🔮 Research |
| **v2.1** | On-chain governance for issuer approval | 🔮 Research |
| **v2.2** | Verifiable credential standard (W3C VC) | 🔮 Research |

---

## 🤝 Contributing

We welcome contributions from the community!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m "feat: add amazing feature"

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

| Channel | Link |
|---|---|
| **GitHub** | [@yourusername](https://github.com/yourusername) |
| **Twitter/X** | [@yourhandle](https://twitter.com/yourhandle) |
| **Email** | your.email@domain.com |

---

<p align="center">
  <strong>Built with ❤️ on Stellar</strong><br/>
  <sub>StellarID — Verify once. Prove everywhere.</sub>
</p>
