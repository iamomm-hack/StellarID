# StellarID

**Prove who you are. Reveal nothing.**

> Stop uploading your passport to strangers. Verify once. Prove everywhere. Your data never leaves your device.

StellarID is a decentralized identity verification platform built on the Stellar blockchain. It uses zero-knowledge proofs (zk-SNARKs) to let users prove claims about their identity without revealing the underlying personal data.

## Architecture

```
User ──▸ ZK Proof (Browser) ──▸ Platform
  │                                │
  ▼                                ▼
Freighter Wallet              Verify API
  │                                │
  └──────────── Stellar Blockchain ┘
```

**Key Technologies:**
- **Stellar Soroban** — Smart contracts for credential NFTs (SDK 22.0.0)
- **Circom + snarkjs** — Zero-knowledge circuit compiler and prover
- **Next.js 14** — Frontend with dark theme UI
- **Express + TypeScript** — Backend API
- **PostgreSQL + Redis** — Data and job queue

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Rust + `wasm32-unknown-unknown` target (for contracts)
- [Freighter Wallet](https://freighter.app) browser extension

### Setup

```bash
# 1. Clone and install
git clone <repo-url> stellar-id
cd stellar-id

# 2. Start infrastructure
docker-compose up -d

# 3. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd zk-circuits && npm install && cd ..

# 4. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your settings

# 5. Run database migrations
cd backend && npm run migrate && cd ..

# 6. Seed issuers
npx ts-node scripts/seed-issuers.ts
```

### Development

```bash
# Start backend (port 4000)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm run dev
```

### Using Makefile

```bash
make setup     # Install all dependencies
make migrate   # Run database migrations
make compile   # Compile ZK circuits
make seed      # Seed issuer data
make dev       # Start development servers
make test      # Run all tests
make demo      # Run demo script
make check     # Check environment status
```

## Project Structure

```
stellar-id/
├── frontend/          # Next.js 14 app (dark theme, Tailwind)
│   └── src/
│       ├── app/       # Pages (landing, dashboard)
│       ├── components/# UI (ConnectWallet, CredentialCard, ProofGenerator)
│       ├── hooks/     # useWallet, useCredentials, useZKProof
│       ├── store/     # Zustand wallet store
│       └── lib/       # API client
├── backend/           # Express + TypeScript API
│   └── src/
│       ├── routes/    # auth, credentials, issuers, verify, platforms, github-issuer
│       ├── services/  # stellar, zkVerifier, ipfs
│       ├── middleware/ # auth, apiKey, rateLimiter, errorHandler
│       ├── jobs/      # expiry-cron
│       └── db/        # schema, migrations, pool
├── contracts/         # Soroban smart contracts (Rust)
│   ├── credential_nft/
│   ├── revocation_registry/
│   └── disclosure_contract/
├── zk-circuits/       # Circom 2.0 circuits
│   ├── age_check.circom
│   ├── income_check.circom
│   ├── residency_check.circom
│   └── membership_check.circom
├── scripts/           # Deployment, seeding, demo
├── docs/              # Architecture documentation
└── .github/workflows/ # CI/CD pipeline
```

## ZK Circuits

| Circuit | Proves | Private Data Protected |
|---------|--------|----------------------|
| `age_check` | Age ≥ minimum | Birthdate |
| `income_check` | Income ≥ threshold | Exact income |
| `residency_check` | Country match | Country code |
| `membership_check` | Tier ≥ required | Membership tier |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/connect-wallet` | None | Connect Stellar wallet |
| GET | `/auth/me` | JWT | Get current user |
| GET | `/credentials` | JWT | List user credentials |
| POST | `/credentials/request` | JWT | Request new credential |
| GET | `/issuers` | None | List verified issuers |
| POST | `/issuers/:id/mint` | JWT | Mint credential NFT |
| POST | `/verify` | API Key | Verify ZK proof |
| GET | `/github-issuer/auth` | None | Start GitHub OAuth |

## Smart Contracts

All contracts use **Soroban SDK 22.0.0**:

- **credential_nft** — Mint, transfer, revoke, validate credential NFTs
- **revocation_registry** — On-chain revocation tracking per issuer
- **disclosure_contract** — Record and query verification history

## Security

- Zero-knowledge proofs ensure private data never leaves the user's device
- Platform API responses contain only boolean verification results
- Rate limiting: 100 req/min (verify), 20 req/min (auth)
- JWT authentication with configurable expiry
- All credential data encrypted before IPFS upload

## License

MIT
