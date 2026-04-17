'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Fingerprint, Lock, Layers, Key, Eye,
  ArrowRight, BookOpen, Code2, Database, Terminal,
  Copy, Check, Zap, FileCode, Rocket, GitBranch,
  Server, ChevronRight, ExternalLink, CheckCircle2,
  Clock, Box, Linkedin, Github, Coins, Users,
  Activity, ShieldCheck,
} from 'lucide-react';

const API_BASE = 'https://stellarid-api.onrender.com/api/v1';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 border border-[#333] bg-transparent hover:bg-white/5 transition-colors text-[var(--color-text-muted)] hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-highlight)' }} /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative border border-[#333] overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[#222]">
        <Terminal className="w-3 h-3" style={{ color: 'var(--color-accent)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 text-sm font-mono overflow-x-auto leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const coreConcepts = [
  {
    icon: Shield,
    title: 'Zero-Knowledge Proofs',
    desc: 'Groth16 ZK-SNARKs via Circom. Proofs generated client-side — your data never leaves your device.',
  },
  {
    icon: Fingerprint,
    title: 'NFT Credentials',
    desc: 'Non-transferable NFTs on Stellar containing cryptographic commitments (Poseidon hash), not raw data.',
  },
  {
    icon: Eye,
    title: 'Selective Disclosure',
    desc: 'Prove specific claims (age 18+, income bracket) without revealing underlying identity data.',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'Zero personal data stored on-chain. All credentials encrypted client-side. Blockchain stores only hashed commitments.',
  },
  {
    icon: Coins,
    title: 'Fee Sponsorship',
    desc: 'Gasless transactions — users never pay XLM gas fees. StellarID sponsors all credential minting costs via fee bump.',
  },
  {
    icon: Users,
    title: 'Multi-Signature Approval',
    desc: 'High-value credentials require N-of-M signer approval. Full audit trail recorded on-chain for enterprise trust.',
  },
];

const apiEndpoints = [
  { method: 'POST', path: '/auth/connect', desc: 'Connect wallet & get JWT token', auth: false, group: 'Auth' },
  { method: 'GET',  path: '/auth/me', desc: 'Get current user profile', auth: true, group: 'Auth' },
  { method: 'POST', path: '/credentials', desc: 'Issue a new credential', auth: true, group: 'Credentials' },
  { method: 'GET',  path: '/credentials/my', desc: 'List your credentials', auth: true, group: 'Credentials' },
  { method: 'DELETE', path: '/credentials/:id', desc: 'Delete (unlink) a credential', auth: true, group: 'Credentials' },
  { method: 'POST', path: '/proofs', desc: 'Create shareable ZK proof record', auth: true, group: 'Proofs' },
  { method: 'GET',  path: '/proofs/:token', desc: 'Public proof verification', auth: false, group: 'Proofs' },
  { method: 'GET',  path: '/proofs/:token/pdf', desc: 'Download PDF certificate', auth: false, group: 'Proofs' },
  { method: 'GET',  path: '/issuers', desc: 'List all trusted issuers', auth: false, group: 'Issuers' },
  { method: 'GET',  path: '/github-issuer/auth', desc: 'Start GitHub OAuth flow', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/github-issuer/callback', desc: 'GitHub OAuth callback (auto)', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/linkedin-issuer/auth', desc: 'Start LinkedIn OAuth flow', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/linkedin-issuer/callback', desc: 'LinkedIn OAuth callback (auto)', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/fee-sponsor/info', desc: 'Fee sponsorship feature info', auth: false, group: 'Fee Sponsorship' },
  { method: 'GET',  path: '/fee-sponsor/status', desc: 'Sponsor account balance & status', auth: false, group: 'Fee Sponsorship' },
  { method: 'POST', path: '/fee-sponsor/request', desc: 'Request gasless transaction', auth: true, group: 'Fee Sponsorship' },
  { method: 'GET',  path: '/multisig/info', desc: 'Multi-sig feature info', auth: false, group: 'Multi-Signature' },
  { method: 'POST', path: '/multisig/request', desc: 'Create multi-sig credential request', auth: true, group: 'Multi-Signature' },
  { method: 'POST', path: '/multisig/sign/:id', desc: 'Add signature to request', auth: true, group: 'Multi-Signature' },
  { method: 'GET',  path: '/multisig/request/:id', desc: 'Check multi-sig request status', auth: true, group: 'Multi-Signature' },
  { method: 'GET',  path: '/multisig/pending', desc: 'List your pending requests', auth: true, group: 'Multi-Signature' },
  { method: 'GET',  path: '/admin/stats', desc: 'Platform-wide analytics', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/activity', desc: 'Last 24h activity feed', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/chart-data', desc: '30-day trend chart data', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/top-issuers', desc: 'Top issuers by volume', auth: true, group: 'Admin' },
  { method: 'POST', path: '/verify', desc: 'Verify a ZK proof (platform API)', auth: false, group: 'Verify' },
];

const quickstartSteps = [
  {
    step: '01',
    title: 'Connect Your Wallet',
    desc: 'Install Freighter wallet extension and connect to StellarID',
    code: `# 1. Install Freighter from https://www.freighter.app/
# 2. Create or import a Stellar testnet wallet
# 3. Fund it via Stellar Friendbot:
curl https://friendbot.stellar.org?addr=YOUR_WALLET_ADDRESS`,
  },
  {
    step: '02',
    title: 'Get Your First Credential',
    desc: 'Link GitHub or LinkedIn to receive a verifiable on-chain credential NFT',
    code: `# GitHub OAuth flow
GET ${API_BASE}/github-issuer/auth?stellarAddress=YOUR_STELLAR_ADDRESS

# LinkedIn OAuth flow  
GET ${API_BASE}/linkedin-issuer/auth?stellarAddress=YOUR_STELLAR_ADDRESS

# Both flows return a JWT token and mint an NFT credential`,
  },
  {
    step: '03',
    title: 'Generate a ZK Proof',
    desc: 'Generate a zero-knowledge proof to prove a claim without revealing your data',
    code: `# POST to create a shareable proof
POST ${API_BASE}/proofs
Authorization: Bearer YOUR_JWT_TOKEN
{
  "credentialId": "your-credential-id",
  "circuitType": "age_check",
  "publicInputs": { "threshold": 18 }
}

# Response includes a public share link + PDF download`,
  },
  {
    step: '04',
    title: 'Verify a Proof (Platform Integration)',
    desc: 'Any platform can verify a StellarID proof using the public endpoint',
    code: `# Public verification — no auth required
GET ${API_BASE.replace('/api/v1', '')}/verify/YOUR_PROOF_TOKEN

# Or via API
POST ${API_BASE}/verify
{
  "token": "YOUR_PROOF_TOKEN"
}`,
  },
];

const architectureLayers = [
  {
    icon: Box,
    label: 'Client Layer',
    items: ['Next.js 14 Frontend', 'Zustand State', 'snarkjs Proof Generation', 'Freighter Wallet'],
  },
  {
    icon: Server,
    label: 'API Layer',
    items: ['Express.js REST API', 'JWT + API Key Auth', 'Rate Limiting (Helmet)', 'GitHub & LinkedIn OAuth'],
  },
  {
    icon: Database,
    label: 'Data Layer',
    items: ['PostgreSQL 15 + Indexes', 'Redis 7 Cache', 'Pinata IPFS Storage', 'Stellar Horizon API'],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-[var(--color-highlight)]/15 text-[var(--color-highlight)]',
  POST: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  DELETE: 'bg-red-500/15 text-red-400',
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  const sidebarItems = [
    { id: 'quickstart', label: 'Quick Start', icon: Rocket },
    { id: 'concepts', label: 'Core Concepts', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: GitBranch },
    { id: 'oauth', label: 'OAuth Issuers', icon: Github },
    { id: 'advanced', label: 'Advanced Features', icon: Zap },
    { id: 'api', label: 'API Reference', icon: Code2 },
    { id: 'circuits', label: 'ZK Circuits', icon: FileCode },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];

  const groups = [...new Set(apiEndpoints.map(e => e.group))];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 reveal-wrap">
          <div className="reveal-content delay-1">
            <span className="block text-sm font-bold uppercase tracking-[0.2em] mb-4"
                  style={{ color: 'var(--color-accent)' }}>
              // Developer Documentation
            </span>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 6vw, 4rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Stellar<span style={{ color: 'var(--color-accent)' }}>ID</span> <span className="outline-text">Docs</span>
            </h1>
            <p className="text-[var(--color-text-muted)] max-w-2xl mt-4">
              Full API reference, OAuth integration guides, ZK circuit docs, Fee Sponsorship, and Multi-Signature — everything you need to build with StellarID.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <a href={`${API_BASE.replace('/api/v1', '')}/health`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ borderColor: 'var(--color-highlight)', color: 'var(--color-highlight)' }}>
                <Activity className="w-3 h-3" /> API Live
              </a>
              <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#333] text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] hover:text-white transition-colors">
                <Github className="w-3 h-3" /> Source
              </a>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-[96px] space-y-0">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 text-left uppercase tracking-wider border-l-2 ${
                    activeSection === item.id
                      ? 'border-[var(--color-accent)] text-white bg-white/[0.03]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-white hover:border-[#333]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-[var(--color-accent)]' : ''}`} />
                  {item.label}
                </button>
              ))}

              <div className="pt-4 mt-4 border-t border-[#222]">
                <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-3.5 py-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
                </a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* === QUICKSTART === */}
            <section id="quickstart">
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Quick Start
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-8">
                Get up and running with StellarID in 4 steps. Connect wallet → Get credential → Generate ZK proof → Verify anywhere.
              </p>

              <div className="space-y-0">
                {quickstartSteps.map((s) => (
                  <div key={s.step} className="brutal-card mb-0">
                    <div className="card-header-brutal">
                      <span>Step {s.step}</span>
                      <span>[{s.title.toUpperCase()}]</span>
                    </div>
                    <div className="card-body-brutal">
                      <p className="text-xs text-[var(--color-text-muted)] mb-3">{s.desc}</p>
                      <CodeBlock code={s.code} lang="bash" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* === CORE CONCEPTS === */}
            <section id="concepts">
              <div className="flex items-center gap-3 mb-6">
                <Layers className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Core Concepts
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-0">
                {coreConcepts.map((c, idx) => (
                  <div key={c.title} className="brutal-card">
                    <div className="card-header-brutal"
                         style={idx % 3 === 0 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                      <span>Module: {String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <div className="card-body-brutal">
                      <div className="w-10 h-10 flex items-center justify-center border border-[#333] mb-3"
                           style={{ background: 'var(--color-bg)' }}>
                        <c.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-white">{c.title}</h3>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* === ARCHITECTURE === */}
            <section id="architecture">
              <div className="flex items-center gap-3 mb-6">
                <GitBranch className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Architecture
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                StellarID uses a three-layer architecture separating client-side ZK operations, REST API logic, and blockchain interactions.
              </p>

              <div className="grid sm:grid-cols-3 gap-0">
                {architectureLayers.map((layer, idx) => (
                  <div key={layer.label} className="brutal-card">
                    <div className="card-header-brutal"
                         style={idx === 2 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                      <span>{layer.label}</span>
                    </div>
                    <div className="card-body-brutal">
                      <ul className="styled-list">
                        {layer.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* === OAUTH ISSUERS === */}
            <section id="oauth">
              <div className="flex items-center gap-3 mb-6">
                <Github className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  OAuth Issuers
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                StellarID supports OAuth-based credential issuance. Users authenticate with a 3rd party and receive a verifiable NFT credential.
              </p>

              <div className="grid sm:grid-cols-2 gap-0 mb-6">
                <div className="brutal-card">
                  <div className="card-header-brutal" style={{ background: 'var(--color-highlight)', color: 'var(--color-bg)' }}>
                    <span>GitHub Issuer</span>
                    <span>[ACTIVE]</span>
                  </div>
                  <div className="card-body-brutal">
                    <Github className="w-6 h-6 mb-3" style={{ color: 'var(--color-highlight)' }} />
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">
                      Credential type: <code style={{ color: 'var(--color-highlight)' }}>github_developer</code>
                    </p>
                    <ul className="styled-list text-sm">
                      <li>GitHub username verified</li>
                      <li>Public repo count</li>
                      <li>Verified primary email</li>
                      <li>Account age & followers</li>
                    </ul>
                  </div>
                </div>

                <div className="brutal-card">
                  <div className="card-header-brutal">
                    <span>LinkedIn Issuer</span>
                    <span>[ACTIVE]</span>
                  </div>
                  <div className="card-body-brutal">
                    <Linkedin className="w-6 h-6 mb-3 text-[#0077b5]" />
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">
                      Credential type: <code className="text-[#0077b5]">linkedin_professional</code>
                    </p>
                    <ul className="styled-list text-sm">
                      <li>Full name verified</li>
                      <li>Professional email</li>
                      <li>Profile picture</li>
                      <li>LinkedIn member ID</li>
                    </ul>
                  </div>
                </div>
              </div>

              <CodeBlock
                lang="json"
                code={`// GitHub credential claim data (stored on IPFS, never raw on-chain)
{
  "github_username": "iamomm-hack",
  "public_repos_count": 42,
  "account_created_year": 2020,
  "verified_email": true,
  "followers": 150
}

// LinkedIn credential claim data
{
  "linkedin_name": "Om Kumar",
  "linkedin_email": "user@example.com",
  "linkedin_email_verified": true,
  "linkedin_sub": "xAbCDef12345",
  "verified_at": "2026-03-30T00:00:00Z"
}`}
              />
            </section>

            {/* === ADVANCED FEATURES === */}
            <section id="advanced">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Advanced Features
                </h2>
              </div>

              {/* Fee Sponsorship */}
              <div className="brutal-card mb-0">
                <div className="card-header-brutal" style={{ background: 'var(--color-highlight)', color: 'var(--color-bg)' }}>
                  <span>Fee Sponsorship (Gasless TX)</span>
                  <span>[ACTIVE]</span>
                </div>
                <div className="card-body-brutal">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Users never pay XLM gas fees. StellarID&apos;s sponsor account covers all transaction costs using Stellar&apos;s <strong className="text-white">Fee Bump</strong> mechanism.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-0 mb-4">
                    {[
                      { label: 'Max fee/tx', value: '0.01 XLM' },
                      { label: 'Mechanism', value: 'Fee Bump TX' },
                      { label: 'User XLM needed', value: '0 XLM' },
                    ].map(stat => (
                      <div key={stat.label} className="border border-[#333] p-3 text-center">
                        <p className="text-lg font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--color-highlight)' }}>{stat.value}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <CodeBlock lang="bash" code={`# Check sponsor status
GET ${API_BASE}/fee-sponsor/status

# Response:
{
  "sponsor": {
    "address": "G...",
    "balance": "100 XLM",
    "canSponsor": true,
    "transactionsRemaining": 10000
  }
}`} />
                </div>
              </div>

              {/* Multi-Sig */}
              <div className="brutal-card">
                <div className="card-header-brutal">
                  <span>Multi-Signature Approval</span>
                  <span>[ACTIVE]</span>
                </div>
                <div className="card-body-brutal">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    High-value credentials require <strong className="text-white">N-of-M signers</strong> to approve before issuance.
                  </p>
                  <ul className="styled-list mb-4 text-sm">
                    <li>Corporate ID: HR + Manager (2-of-2)</li>
                    <li>University degree: Dean + Department (2-of-3)</li>
                    <li>Professional license: Board + Examiner (3-of-5)</li>
                    <li>Financial credential: Bank + Compliance (2-of-2)</li>
                  </ul>
                  <CodeBlock lang="bash" code={`# Create multi-sig request
POST ${API_BASE}/multisig/request
Authorization: Bearer YOUR_JWT
{
  "credentialType": "corporate_identity",
  "ownerAddress": "G...",
  "requiredSigners": ["G...HR", "G...MANAGER"],
  "threshold": 2
}

# Signer adds their signature
POST ${API_BASE}/multisig/sign/:requestId
{
  "signerPublicKey": "G...HR",
  "signature": "..."
}`} />
                </div>
              </div>
            </section>

            {/* === API REFERENCE === */}
            <section id="api">
              <div className="flex items-center gap-3 mb-6">
                <Code2 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  API Reference
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-2">
                Base URL: <code className="font-mono text-xs" style={{ color: 'var(--color-accent)' }}>{API_BASE}</code>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">
                Auth: <code className="font-mono text-xs text-white">Authorization: Bearer YOUR_JWT_TOKEN</code>
              </p>

              {groups.map(group => (
                <div key={group} className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--color-accent)' }}>
                    {group}
                  </h3>
                  <div className="overflow-x-auto border border-[#333]" style={{ background: 'var(--color-surface)' }}>
                    <table className="edge-table w-full">
                      <tbody>
                        {apiEndpoints.filter(e => e.group === group).map((ep) => (
                          <tr key={ep.path + ep.method}>
                            <td className="w-16">
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                                ep.method === 'GET' ? 'bg-[rgba(212,255,0,0.15)] text-[var(--color-highlight)]' :
                                ep.method === 'POST' ? 'bg-[rgba(255,60,0,0.15)] text-[var(--color-accent)]' :
                                'bg-[rgba(255,60,0,0.25)] text-red-400'
                              }`}>
                                {ep.method}
                              </span>
                            </td>
                            <td className="font-mono text-xs whitespace-nowrap text-white">{ep.path}</td>
                            <td className="text-xs">{ep.desc}</td>
                            <td>
                              {ep.auth ? (
                                <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider"
                                      style={{ background: 'rgba(255, 60, 0, 0.15)', color: 'var(--color-accent)' }}>
                                  JWT
                                </span>
                              ) : (
                                <span className="text-[10px] text-[var(--color-text-muted)]">Public</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>

            {/* === ZK CIRCUITS === */}
            <section id="circuits">
              <div className="flex items-center gap-3 mb-6">
                <FileCode className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  ZK Circuits
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                StellarID includes 4 pre-built Circom circuits. All circuits use Poseidon hashing and Groth16 proving.
              </p>

              <div className="grid sm:grid-cols-2 gap-0 mb-6">
                {[
                  { name: 'age_check', desc: 'Proves age ≥ threshold without revealing birthdate', inputs: 'birthYear, currentYear, threshold' },
                  { name: 'income_check', desc: 'Proves income in range without revealing exact amount', inputs: 'income, minIncome, maxIncome' },
                  { name: 'residency_check', desc: 'Proves residency in a country without revealing address', inputs: 'countryCode, allowedCountries[]' },
                  { name: 'membership_check', desc: 'Proves group membership without revealing identity', inputs: 'memberSecret, merkleProof, groupRoot' },
                ].map((circuit, idx) => (
                  <div key={circuit.name} className="brutal-card">
                    <div className="card-header-brutal"
                         style={idx === 0 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                      <span>{circuit.name}</span>
                    </div>
                    <div className="card-body-brutal">
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">{circuit.desc}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        <span className="text-white font-bold">Inputs:</span> {circuit.inputs}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <CodeBlock
                lang="bash"
                code={`# Compile a circuit
cd zk-circuits
circom age_check.circom --r1cs --wasm --sym -o build/

# Generate proving key (Groth16)
snarkjs groth16 setup build/age_check.r1cs pot12_final.ptau age_check_0000.zkey

# Export verification key
snarkjs zkey export verificationkey age_check_0000.zkey verification_key.json

# Generate proof (client-side in browser via snarkjs WASM)
const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  { birthYear: 2000, currentYear: 2026, threshold: 18 },
  "age_check.wasm",
  "age_check_final.zkey"
);`}
              />
            </section>

            {/* === SECURITY === */}
            <section id="security">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <h2 className="text-xl font-bold uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Security
                </h2>
              </div>

              <p className="text-[var(--color-text-muted)] text-sm mb-6">
                StellarID was built with security-first principles. See the full{' '}
                <a href="https://github.com/iamomm-hack/StellarID/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer"
                   style={{ color: 'var(--color-accent)' }} className="hover:underline">
                  SECURITY.md checklist →
                </a>
              </p>

              <div className="grid sm:grid-cols-2 gap-0">
                {[
                  { title: 'JWT Authentication', desc: '7-day expiring tokens. All private endpoints protected.' },
                  { title: 'Helmet.js (HTTP Headers)', desc: 'XSS, clickjacking, MIME-type sniffing protection.' },
                  { title: 'Rate Limiting', desc: '20 req/min on auth, 100 req/min on verify endpoints.' },
                  { title: 'SQL Injection Prevention', desc: 'All queries use parameterized inputs via pg library.' },
                  { title: 'No Secrets in Code', desc: 'All keys in environment variables, never committed.' },
                  { title: 'HTTPS Enforced', desc: 'Render + Vercel enforce HTTPS on all production traffic.' },
                ].map(item => (
                  <div key={item.title} className="brutal-card">
                    <div className="card-body-brutal flex gap-3 items-start">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-highlight)' }} />
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{item.title}</h4>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="brutal-card">
              <div className="card-header-brutal" style={{ background: 'var(--color-highlight)', color: 'var(--color-bg)' }}>
                <span>Ready to Integrate</span>
                <span>[GO]</span>
              </div>
              <div className="card-body-brutal text-center py-8">
                <h3 className="text-xl font-bold mb-2 uppercase tracking-wider"
                    style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                  Start Building
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-5">
                  Verify once, prove everywhere with StellarID.
                </p>
                <div className="flex items-center justify-center gap-0 flex-wrap">
                  <Link href="/dashboard" className="btn-brutal btn-brutal-accent inline-flex items-center gap-2">
                    Open Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                     className="btn-brutal btn-brutal-outline inline-flex items-center gap-2">
                    View Source <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
