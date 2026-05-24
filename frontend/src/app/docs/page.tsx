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
      className="absolute top-3 right-3 p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/5 transition-colors text-muted hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-accent-indigo" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40">
      <div className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] border-b border-white/[0.04]">
        <Terminal className="w-3 h-3 text-accent-indigo" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted">{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-muted/90 max-h-[300px] scrollbar-thin">
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
    desc: 'Verifiable non-transferable NFTs on Stellar containing cryptographic Poseidon commitments, rather than raw user data.',
  },
  {
    icon: Eye,
    title: 'Selective Disclosure',
    desc: 'Prove specific claims (e.g., age 18+, income bracket) without revealing your underlying identity or documents.',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'Zero personal data is stored on-chain. Hashed commitments are pinned to IPFS and committed on Stellar.',
  },
  {
    icon: Coins,
    title: 'Fee Sponsorship',
    desc: 'Gasless transactions — users never pay XLM gas fees. StellarID sponsors all minting operations via fee bumps.',
  },
  {
    icon: Users,
    title: 'Multi-Signature Approval',
    desc: 'High-value enterprise credentials require N-of-M signature approval, creating a secure, trustless audit trail.',
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
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <span className="tag-orange mb-3 block w-fit">
            Developer Documentation
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight font-display text-foreground uppercase">
            StellarID <span className="text-accent-indigo">Docs</span>
          </h1>
          <p className="text-muted max-w-2xl mt-4 text-sm leading-relaxed">
            Full API reference, OAuth integration guides, ZK circuit docs, Fee Sponsorship, and Multi-Signature — everything you need to build with StellarID.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a href={`${API_BASE.replace('/api/v1', '')}/health`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-accent-indigo border-indigo-500/20 hover:bg-indigo-500/20 transition-all duration-300">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> API Live
            </a>
            <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] text-xs font-mono font-bold uppercase tracking-wider text-muted hover:text-foreground hover:bg-white/[0.02] transition-all duration-300">
              <Github className="w-3.5 h-3.5" /> Source
            </a>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-[96px] space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold font-display tracking-wider rounded-xl transition-all duration-200 text-left uppercase border ${
                    activeSection === item.id
                      ? 'border-accent-indigo/20 text-foreground bg-accent-indigo/10'
                      : 'border-transparent text-muted hover:text-foreground hover:bg-white/[0.02]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-accent-indigo' : ''}`} />
                  {item.label}
                </button>
              ))}

              <div className="pt-4 mt-4 border-t border-white/[0.06]">
                <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:text-accent-indigo transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
                </a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* === QUICKSTART === */}
            <section id="quickstart" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Rocket className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Quick Start
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                Get up and running with StellarID in 4 steps. Connect wallet → Get credential → Generate ZK proof → Verify anywhere.
              </p>

              <div className="space-y-6">
                {quickstartSteps.map((s) => (
                  <div key={s.step} className="protocol-panel p-6">
                    <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                      <span className="text-[10px] font-mono text-accent-indigo uppercase font-bold">Step {s.step}</span>
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-foreground">{s.title}</span>
                    </div>
                    <p className="text-xs text-muted mb-4">{s.desc}</p>
                    <CodeBlock code={s.code} lang="bash" />
                  </div>
                ))}
              </div>
            </section>

            {/* === CORE CONCEPTS === */}
            <section id="concepts" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Layers className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Core Concepts
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {coreConcepts.map((c, idx) => (
                  <div key={c.title} className="protocol-panel p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/[0.04]">
                        <c.icon className="w-5 h-5 text-accent-indigo" />
                      </div>
                      <span className="text-[9px] font-mono text-muted uppercase">Module {String(idx + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-2 font-display uppercase tracking-wider text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* === ARCHITECTURE === */}
            <section id="architecture" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <GitBranch className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Architecture
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID leverages a multi-layer design to separate zero-knowledge computations, state management, and blockchain settlement.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {architectureLayers.map((layer, idx) => (
                  <div key={layer.label} className="protocol-panel p-6">
                    <div className="flex items-center gap-3 border-b border-white/[0.04] pb-3 mb-4">
                      <layer.icon className="w-4 h-4 text-accent-indigo" />
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-foreground">{layer.label}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-muted font-mono list-disc list-inside">
                      {layer.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* === OAUTH ISSUERS === */}
            <section id="oauth" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Github className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  OAuth Issuers
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                Issuers verify off-chain identity attributes via standard OAuth protocol workflows, producing cryptographic assertions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="protocol-panel p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                    <span className="flex items-center gap-2 font-display text-xs font-bold text-foreground">
                      <Github className="w-4 h-4 text-accent-indigo" />
                      GitHub Verification
                    </span>
                    <span className="text-[9px] font-mono text-accent-indigo uppercase font-bold">Active</span>
                  </div>
                  <p className="text-xs text-muted mb-3">
                    Credential Type: <code className="text-accent-indigo font-mono bg-white/[0.02] px-1 py-0.5 rounded">github_developer</code>
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted list-disc list-inside">
                    <li>GitHub username verification</li>
                    <li>Total public repository volume</li>
                    <li>Verified primary address profile</li>
                    <li>Account age & social stats</li>
                  </ul>
                </div>

                <div className="protocol-panel p-6">
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                    <span className="flex items-center gap-2 font-display text-xs font-bold text-foreground">
                      <Linkedin className="w-4 h-4 text-blue-400" />
                      LinkedIn Verification
                    </span>
                    <span className="text-[9px] font-mono text-blue-400 uppercase font-bold">Active</span>
                  </div>
                  <p className="text-xs text-muted mb-3">
                    Credential Type: <code className="text-blue-400 font-mono bg-white/[0.02] px-1 py-0.5 rounded">linkedin_professional</code>
                  </p>
                  <ul className="space-y-1.5 text-xs text-muted list-disc list-inside">
                    <li>Certified full name match</li>
                    <li>Verified enterprise email</li>
                    <li>Authorized avatar validation</li>
                    <li>Unique member sub identity</li>
                  </ul>
                </div>
              </div>

              <CodeBlock
                lang="json"
                code={`// GitHub credential claim data (IPFS-stored metadata)
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
            <section id="advanced" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Zap className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Advanced Features
                </h2>
              </div>

              {/* Fee Sponsorship */}
              <div className="protocol-panel p-6">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                  <span className="font-display text-xs font-bold text-foreground">Fee Sponsorship (Gasless TX)</span>
                  <span className="text-[9px] font-mono text-accent-indigo uppercase font-bold">Active</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  Platform sponsorships remove the friction of gas fees. StellarID covers costs via Stellar fee-bump transactions.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Max fee/tx', value: '0.01 XLM' },
                    { label: 'Mechanism', value: 'Fee Bump TX' },
                    { label: 'User XLM needed', value: '0 XLM' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3 text-center">
                      <p className="text-sm font-bold font-display text-accent-indigo">{stat.value}</p>
                      <p className="text-[10px] text-muted mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <CodeBlock lang="json" code={`// GET /api/v1/fee-sponsor/status
{
  "sponsor": {
    "address": "G...",
    "balance": "100 XLM",
    "canSponsor": true,
    "transactionsRemaining": 10000
  }
}`} />
              </div>

              {/* Multi-Sig */}
              <div className="protocol-panel p-6">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                  <span className="font-display text-xs font-bold text-foreground">Multi-Signature Approval</span>
                  <span className="text-[9px] font-mono text-accent-purple uppercase font-bold">Active</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  High-value credentials require N-of-M authorized signatures prior to on-chain issuance.
                </p>
                <ul className="space-y-1.5 text-xs text-muted mb-6 list-disc list-inside">
                  <li>Corporate ID: HR + Manager (2-of-2)</li>
                  <li>Dean + Department (2-of-3)</li>
                  <li>Compliance + Audit Node (2-of-2)</li>
                </ul>
                <CodeBlock lang="json" code={`// Create multi-sig credential request
POST ${API_BASE}/multisig/request
Authorization: Bearer YOUR_JWT
{
  "credentialType": "corporate_identity",
  "ownerAddress": "G...",
  "requiredSigners": ["G...HR", "G...MANAGER"],
  "threshold": 2
}`} />
              </div>
            </section>

            {/* === API REFERENCE === */}
            <section id="api" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Code2 className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  API Reference
                </h2>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-muted">
                  Base Endpoint URL: <code className="font-mono text-accent-indigo bg-white/[0.02] px-1.5 py-0.5 rounded">{API_BASE}</code>
                </p>
                <p className="text-muted">
                  Header Scheme: <code className="font-mono text-foreground bg-white/[0.02] px-1.5 py-0.5 rounded">Authorization: Bearer JWT_TOKEN</code>
                </p>
              </div>

              {groups.map(group => (
                <div key={group} className="space-y-3 pt-4">
                  <h3 className="text-xs font-bold font-display uppercase tracking-widest text-accent-indigo">
                    {group}
                  </h3>
                  <div className="protocol-panel overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-muted">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-muted text-[10px] uppercase font-mono tracking-wider">
                            <th className="p-4 font-semibold w-24">Method</th>
                            <th className="p-4 font-semibold">Endpoint</th>
                            <th className="p-4 font-semibold">Description</th>
                            <th className="p-4 font-semibold w-20 text-right">Auth</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {apiEndpoints.filter(e => e.group === group).map((ep) => (
                            <tr key={ep.path + ep.method} className="hover:bg-white/[0.01] transition-colors">
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                                  ep.method === 'GET' ? 'bg-indigo-500/10 text-accent-indigo border border-indigo-500/20' :
                                  ep.method === 'POST' ? 'bg-purple-500/10 text-accent-purple border border-purple-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {ep.method}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-foreground text-xs whitespace-nowrap">{ep.path}</td>
                              <td className="p-4">{ep.desc}</td>
                              <td className="p-4 text-right">
                                {ep.auth ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-accent-amber border border-amber-500/20">
                                    JWT
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-muted/50 font-mono">Public</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* === ZK CIRCUITS === */}
            <section id="circuits" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <FileCode className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  ZK Circuits
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID compiles pre-built Circom arithmetic circuits to generate zero-knowledge proofs under Groth16.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'age_check', desc: 'Proves birthYear <= threshold threshold without disclosing age details.', inputs: 'birthYear, currentYear, threshold' },
                  { name: 'income_check', desc: 'Proves salary range boundary assertions without revealing precise amount.', inputs: 'income, minIncome, maxIncome' },
                  { name: 'residency_check', desc: 'Proves geographic location compliance with zero metadata leaks.', inputs: 'countryCode, allowedCountries[]' },
                  { name: 'membership_check', desc: 'Proves secret membership in a Merkle tree without revealing leaf index.', inputs: 'memberSecret, merkleProof, groupRoot' },
                ].map((circuit) => (
                  <div key={circuit.name} className="protocol-panel p-6">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                      <span className="font-mono text-xs text-foreground font-bold">{circuit.name}</span>
                      <span className="text-[9px] font-mono text-accent-indigo uppercase font-bold">Circom</span>
                    </div>
                    <p className="text-xs text-muted mb-4">{circuit.desc}</p>
                    <p className="text-[10px] text-muted/80 font-mono">
                      <span className="text-foreground font-bold">Inputs:</span> {circuit.inputs}
                    </p>
                  </div>
                ))}
              </div>

              <CodeBlock
                lang="bash"
                code={`# Compile age_check circuit
circom age_check.circom --r1cs --wasm --sym -o build/

# Generate proving key (Groth16 setup)
snarkjs groth16 setup build/age_check.r1cs pot12_final.ptau age_check_0000.zkey

# Export verification key
snarkjs zkey export verificationkey age_check_0000.zkey verification_key.json`}
              />
            </section>

            {/* === SECURITY === */}
            <section id="security" className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <ShieldCheck className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Security System
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID is built with a defense-in-depth model safeguarding all client interfaces and storage networks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'JWT Authentication', desc: '7-day session lifetimes with encrypted payload signatures.' },
                  { title: 'Helmet.js Security', desc: 'Strict HTTP response headers preventing injection attacks.' },
                  { title: 'Rate Limiter Filters', desc: 'DDoS mitigation triggers blocking excessive request patterns.' },
                  { title: 'Database Safety', desc: 'Parameterized query parameters blocking SQLi entry vectors.' },
                  { title: 'Vaulted Secrets', desc: 'Zero code exposure of passwords or API signing certificates.' },
                  { title: 'Encrypted Transport', desc: 'Compulsory TLS tunnels securing REST API socket endpoints.' },
                ].map(item => (
                  <div key={item.title} className="protocol-panel p-6 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-accent-indigo" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground font-display uppercase tracking-wider">{item.title}</h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="protocol-panel p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-indigo via-accent-purple to-transparent" />
              <h3 className="text-2xl font-bold mb-3 font-display uppercase tracking-wider text-foreground">
                Start Integrating
              </h3>
              <p className="text-sm text-muted mb-6 max-w-lg mx-auto leading-relaxed">
                Verify credentials instantly and prove identity statements securely with StellarID.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href="/dashboard" className="btn-stellar !py-3">
                  Open Console <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                   className="btn-stellar-ghost !py-3">
                  Source Code <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
