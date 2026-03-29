'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Fingerprint,
  Lock,
  Layers,
  Key,
  Eye,
  ArrowRight,
  BookOpen,
  Code2,
  Database,
  Terminal,
  Copy,
  Check,
  Zap,
  FileCode,
  Rocket,
  GitBranch,
  Server,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Box,
  Linkedin,
  Github,
  Coins,
  Users,
  Activity,
  ShieldCheck,
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
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl bg-[#0a0020] border border-white/8 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        <span className="ml-2 text-xs text-white/25 font-mono">{lang}</span>
      </div>
      <CopyButton text={code} />
      <pre className="p-4 text-sm font-mono text-white/70 overflow-x-auto leading-relaxed">
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
    color: 'text-[#00e676]',
    bg: 'bg-[#00e676]/10',
  },
  {
    icon: Fingerprint,
    title: 'NFT Credentials',
    desc: 'Non-transferable NFTs on Stellar containing cryptographic commitments (Poseidon hash), not raw data.',
    color: 'text-[#7c3aed]',
    bg: 'bg-[#7c3aed]/10',
  },
  {
    icon: Eye,
    title: 'Selective Disclosure',
    desc: 'Prove specific claims (age 18+, income bracket) without revealing underlying identity data.',
    color: 'text-[#4ade80]',
    bg: 'bg-[#4ade80]/10',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'Zero personal data stored on-chain. All credentials encrypted client-side. Blockchain stores only hashed commitments.',
    color: 'text-[#a855f7]',
    bg: 'bg-[#a855f7]/10',
  },
  {
    icon: Coins,
    title: 'Fee Sponsorship',
    desc: 'Gasless transactions — users never pay XLM gas fees. StellarID sponsors all credential minting costs via fee bump.',
    color: 'text-[#fbbf24]',
    bg: 'bg-[#fbbf24]/10',
  },
  {
    icon: Users,
    title: 'Multi-Signature Approval',
    desc: 'High-value credentials require N-of-M signer approval. Full audit trail recorded on-chain for enterprise trust.',
    color: 'text-[#f472b6]',
    bg: 'bg-[#f472b6]/10',
  },
];

const apiEndpoints = [
  // Auth
  { method: 'POST', path: '/auth/connect', desc: 'Connect wallet & get JWT token', auth: false, group: 'Auth' },
  { method: 'GET',  path: '/auth/me', desc: 'Get current user profile', auth: true, group: 'Auth' },
  // Credentials
  { method: 'POST', path: '/credentials', desc: 'Issue a new credential', auth: true, group: 'Credentials' },
  { method: 'GET',  path: '/credentials/my', desc: 'List your credentials', auth: true, group: 'Credentials' },
  { method: 'DELETE', path: '/credentials/:id', desc: 'Delete (unlink) a credential', auth: true, group: 'Credentials' },
  // Proofs
  { method: 'POST', path: '/proofs', desc: 'Create shareable ZK proof record', auth: true, group: 'Proofs' },
  { method: 'GET',  path: '/proofs/:token', desc: 'Public proof verification', auth: false, group: 'Proofs' },
  { method: 'GET',  path: '/proofs/:token/pdf', desc: 'Download PDF certificate', auth: false, group: 'Proofs' },
  // Issuers
  { method: 'GET',  path: '/issuers', desc: 'List all trusted issuers', auth: false, group: 'Issuers' },
  // OAuth
  { method: 'GET',  path: '/github-issuer/auth', desc: 'Start GitHub OAuth flow', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/github-issuer/callback', desc: 'GitHub OAuth callback (auto)', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/linkedin-issuer/auth', desc: 'Start LinkedIn OAuth flow', auth: false, group: 'OAuth' },
  { method: 'GET',  path: '/linkedin-issuer/callback', desc: 'LinkedIn OAuth callback (auto)', auth: false, group: 'OAuth' },
  // Fee Sponsorship
  { method: 'GET',  path: '/fee-sponsor/info', desc: 'Fee sponsorship feature info', auth: false, group: 'Fee Sponsorship' },
  { method: 'GET',  path: '/fee-sponsor/status', desc: 'Sponsor account balance & status', auth: false, group: 'Fee Sponsorship' },
  { method: 'POST', path: '/fee-sponsor/request', desc: 'Request gasless transaction', auth: true, group: 'Fee Sponsorship' },
  // Multi-Sig
  { method: 'GET',  path: '/multisig/info', desc: 'Multi-sig feature info', auth: false, group: 'Multi-Signature' },
  { method: 'POST', path: '/multisig/request', desc: 'Create multi-sig credential request', auth: true, group: 'Multi-Signature' },
  { method: 'POST', path: '/multisig/sign/:id', desc: 'Add signature to request', auth: true, group: 'Multi-Signature' },
  { method: 'GET',  path: '/multisig/request/:id', desc: 'Check multi-sig request status', auth: true, group: 'Multi-Signature' },
  { method: 'GET',  path: '/multisig/pending', desc: 'List your pending requests', auth: true, group: 'Multi-Signature' },
  // Admin
  { method: 'GET',  path: '/admin/stats', desc: 'Platform-wide analytics', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/activity', desc: 'Last 24h activity feed', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/chart-data', desc: '30-day trend chart data', auth: true, group: 'Admin' },
  { method: 'GET',  path: '/admin/top-issuers', desc: 'Top issuers by volume', auth: true, group: 'Admin' },
  // Verify
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
    color: 'border-[#00e676]/20',
    dotColor: 'bg-[#00e676]',
  },
  {
    icon: Server,
    label: 'API Layer',
    items: ['Express.js REST API', 'JWT + API Key Auth', 'Rate Limiting (Helmet)', 'GitHub & LinkedIn OAuth'],
    color: 'border-[#7c3aed]/20',
    dotColor: 'bg-[#7c3aed]',
  },
  {
    icon: Database,
    label: 'Data Layer',
    items: ['PostgreSQL 15 + Indexes', 'Redis 7 Cache', 'Pinata IPFS Storage', 'Stellar Horizon API'],
    color: 'border-[#a855f7]/20',
    dotColor: 'bg-[#a855f7]',
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/12 text-emerald-400',
  POST: 'bg-blue-500/12 text-blue-400',
  DELETE: 'bg-red-500/12 text-red-400',
};

const groupColors: Record<string, string> = {
  Auth: 'text-[#00e676]',
  Credentials: 'text-[#7c3aed]',
  Proofs: 'text-[#4ade80]',
  Issuers: 'text-[#a855f7]',
  OAuth: 'text-[#0077b5]',
  'Fee Sponsorship': 'text-[#fbbf24]',
  'Multi-Signature': 'text-[#f472b6]',
  Admin: 'text-[#f97316]',
  Verify: 'text-[#22d3ee]',
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
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}
    >
      {/* Bokeh */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-[#7c3aed]/12 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[8%] w-[250px] h-[250px] rounded-full bg-[#9333ea]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-sm text-white/70 mb-5">
            <BookOpen className="w-4 h-4 text-[#00e676]" />
            <span>Developer Documentation</span>
            <span className="text-[#00e676] font-semibold text-xs ml-1">v3.0 · Black Belt</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-[#00e676] via-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
              StellarID
            </span>{' '}
            Documentation
          </h1>
          <p className="text-lg text-white/40 max-w-2xl">
            Full API reference, OAuth integration guides, ZK circuit docs, Fee Sponsorship, and Multi-Signature — everything you need to build with StellarID.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <a href={`${API_BASE.replace('/api/v1', '')}/health`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00e676]/10 border border-[#00e676]/20 text-[#00e676] text-xs font-medium hover:bg-[#00e676]/20 transition-colors">
              <Activity className="w-3 h-3" /> API Live
            </a>
            <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors">
              <Github className="w-3 h-3" /> GitHub Source
            </a>
            <a href="https://x.com/omtdotcmd" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors">
              <ExternalLink className="w-3 h-3" /> Twitter/X
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
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                    activeSection === item.id
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-[#00e676]' : ''}`} />
                  {item.label}
                </button>
              ))}

              <div className="pt-4 mt-4 border-t border-white/5">
                <a href="https://github.com/iamomm-hack/StellarID" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-3.5 py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> View on GitHub
                </a>
                <a href="/admin" className="flex items-center gap-2 px-3.5 py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
                  <Activity className="w-3.5 h-3.5" /> Admin Dashboard
                </a>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* === QUICKSTART === */}
            <section id="quickstart">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-[#00e676]" />
                </div>
                <h2 className="text-2xl font-bold">Quick Start</h2>
              </div>

              <p className="text-white/45 text-sm mb-8 max-w-2xl">
                Get up and running with StellarID in 4 steps. Connect wallet → Get credential → Generate ZK proof → Verify anywhere.
              </p>

              <div className="space-y-6">
                {quickstartSteps.map((s) => (
                  <div key={s.step} className="rounded-2xl glass p-6 border border-white/8">
                    <div className="flex items-start gap-4 mb-4">
                      <span className="text-xs font-bold text-[#00e676] bg-[#00e676]/10 px-2.5 py-1 rounded-full shrink-0">
                        Step {s.step}
                      </span>
                      <div>
                        <h3 className="font-semibold text-base">{s.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                    <CodeBlock code={s.code} lang="bash" />
                  </div>
                ))}
              </div>
            </section>

            {/* === CORE CONCEPTS === */}
            <section id="concepts">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-[#7c3aed]" />
                </div>
                <h2 className="text-2xl font-bold">Core Concepts</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {coreConcepts.map((c) => (
                  <div key={c.title} className="rounded-2xl glass p-6 border border-white/8 hover:border-white/15 transition-all duration-300 group">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <c.icon className={`w-5 h-5 ${c.color}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-1.5">{c.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{c.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* === ARCHITECTURE === */}
            <section id="architecture">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-[#a855f7]" />
                </div>
                <h2 className="text-2xl font-bold">Architecture</h2>
              </div>

              <p className="text-white/45 text-sm mb-6 max-w-2xl">
                StellarID uses a three-layer architecture separating client-side ZK operations, REST API logic, and blockchain interactions.
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {architectureLayers.map((layer) => (
                  <div key={layer.label} className={`rounded-2xl glass p-5 border ${layer.color}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <layer.icon className="w-5 h-5 text-white/60" />
                      <h3 className="font-semibold text-sm">{layer.label}</h3>
                    </div>
                    <ul className="space-y-2">
                      {layer.items.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-white/45">
                          <div className={`w-1.5 h-1.5 rounded-full ${layer.dotColor}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl overflow-hidden border border-white/8 bg-[#0a0020] p-4">
                <p className="text-xs text-white/30 font-mono mb-3">architecture-diagram.svg</p>
                <img
                  src="/architecture.svg"
                  alt="StellarID Architecture Diagram"
                  className="w-full rounded-xl"
                  style={{ background: 'transparent' }}
                />
              </div>
            </section>

            {/* === OAUTH ISSUERS === */}
            <section id="oauth">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center">
                  <Github className="w-4 h-4 text-white/70" />
                </div>
                <h2 className="text-2xl font-bold">OAuth Issuers</h2>
              </div>

              <p className="text-white/45 text-sm mb-6">
                StellarID supports OAuth-based credential issuance. Users authenticate with a 3rd party and receive a verifiable NFT credential minted on Stellar.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl glass p-6 border border-[#00e676]/15">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#00e676]/10 flex items-center justify-center">
                      <Github className="w-5 h-5 text-[#00e676]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">GitHub Issuer</h3>
                      <p className="text-xs text-white/40">Credential type: <code className="text-[#00e676]">github_developer</code></p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/50 mb-4">
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#00e676] shrink-0 mt-0.5" /> GitHub username verified</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#00e676] shrink-0 mt-0.5" /> Public repo count</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#00e676] shrink-0 mt-0.5" /> Verified primary email</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#00e676] shrink-0 mt-0.5" /> Account age & followers</li>
                  </ul>
                  <CodeBlock lang="bash" code={`GET ${API_BASE}/github-issuer/auth?stellarAddress=G...`} />
                </div>

                <div className="rounded-2xl glass p-6 border border-[#0077b5]/15">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0077b5]/10 flex items-center justify-center">
                      <Linkedin className="w-5 h-5 text-[#0077b5]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">LinkedIn Issuer</h3>
                      <p className="text-xs text-white/40">Credential type: <code className="text-[#0077b5]">linkedin_professional</code></p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-white/50 mb-4">
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0077b5] shrink-0 mt-0.5" /> Full name verified</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0077b5] shrink-0 mt-0.5" /> Professional email</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0077b5] shrink-0 mt-0.5" /> Profile picture</li>
                    <li className="flex gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#0077b5] shrink-0 mt-0.5" /> LinkedIn member ID</li>
                  </ul>
                  <CodeBlock lang="bash" code={`GET ${API_BASE}/linkedin-issuer/auth?stellarAddress=G...`} />
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
                <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#fbbf24]" />
                </div>
                <h2 className="text-2xl font-bold">Advanced Features</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/40">Black Belt</span>
              </div>

              {/* Fee Sponsorship */}
              <div className="rounded-2xl glass p-6 border border-[#fbbf24]/15 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-5 h-5 text-[#fbbf24]" />
                  <h3 className="font-semibold text-lg">💸 Fee Sponsorship (Gasless Transactions)</h3>
                </div>
                <p className="text-sm text-white/45 mb-4">
                  Users never pay XLM gas fees. StellarID&apos;s sponsor account covers all transaction costs using Stellar&apos;s <strong className="text-white/70">Fee Bump</strong> mechanism.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Max fee/tx', value: '0.01 XLM' },
                    { label: 'Mechanism', value: 'Fee Bump TX' },
                    { label: 'User XLM needed', value: '0 XLM' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl bg-[#fbbf24]/5 border border-[#fbbf24]/10 p-3 text-center">
                      <p className="text-lg font-bold text-[#fbbf24]">{stat.value}</p>
                      <p className="text-xs text-white/35">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
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
                  <CodeBlock lang="bash" code={`# Feature info (no auth)
GET ${API_BASE}/fee-sponsor/info`} />
                </div>
              </div>

              {/* Multi-Sig */}
              <div className="rounded-2xl glass p-6 border border-[#f472b6]/15">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5 text-[#f472b6]" />
                  <h3 className="font-semibold text-lg">🔐 Multi-Signature Credential Approval</h3>
                </div>
                <p className="text-sm text-white/45 mb-4">
                  High-value credentials require <strong className="text-white/70">N-of-M signers</strong> to approve before issuance. All signatures are recorded on Stellar blockchain.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-5 text-xs text-white/50">
                  {[
                    'Corporate ID: HR + Manager (2-of-2)',
                    'University degree: Dean + Department (2-of-3)',
                    'Professional license: Board + Examiner (3-of-5)',
                    'Financial credential: Bank + Compliance (2-of-2)',
                  ].map(uc => (
                    <div key={uc} className="flex gap-2 items-start">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#f472b6] shrink-0 mt-0.5" />
                      {uc}
                    </div>
                  ))}
                </div>
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
}

# Check status
GET ${API_BASE}/multisig/request/:requestId`} />
              </div>
            </section>

            {/* === API REFERENCE === */}
            <section id="api">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-[#00e676]" />
                </div>
                <h2 className="text-2xl font-bold">API Reference</h2>
              </div>

              <p className="text-white/45 text-sm mb-2">
                Base URL: <code className="text-[#00e676] bg-[#00e676]/8 px-2 py-0.5 rounded text-xs font-mono">{API_BASE}</code>
              </p>
              <p className="text-white/30 text-xs mb-6">
                Authentication: <code className="text-white/50 bg-white/5 px-2 py-0.5 rounded font-mono">Authorization: Bearer YOUR_JWT_TOKEN</code>
              </p>

              {groups.map(group => (
                <div key={group} className="mb-6">
                  <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 ${groupColors[group] || 'text-white/40'}`}>{group}</h3>
                  <div className="rounded-2xl glass overflow-hidden border border-white/8">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {apiEndpoints.filter(e => e.group === group).map((ep) => (
                            <tr key={ep.path + ep.method} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-2.5 w-16">
                                <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${methodColors[ep.method] || 'bg-white/10 text-white/50'}`}>
                                  {ep.method}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-mono text-white/55 text-xs whitespace-nowrap">{ep.path}</td>
                              <td className="px-4 py-2.5 text-white/40 text-xs">{ep.desc}</td>
                              <td className="px-4 py-2.5">
                                {ep.auth ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">JWT</span>
                                ) : (
                                  <span className="text-[11px] text-white/25">Public</span>
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
            <section id="circuits">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-[#4ade80]" />
                </div>
                <h2 className="text-2xl font-bold">ZK Circuits</h2>
              </div>

              <p className="text-white/45 text-sm mb-6 max-w-2xl">
                StellarID includes 4 pre-built Circom circuits. All circuits use Poseidon hashing and Groth16 proving. Proofs are generated entirely client-side.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {[
                  { name: 'age_check', desc: 'Proves age ≥ threshold without revealing birthdate', inputs: 'birthYear, currentYear, threshold' },
                  { name: 'income_check', desc: 'Proves income in range without revealing exact amount', inputs: 'income, minIncome, maxIncome' },
                  { name: 'residency_check', desc: 'Proves residency in a country without revealing address', inputs: 'countryCode, allowedCountries[]' },
                  { name: 'membership_check', desc: 'Proves group membership without revealing identity', inputs: 'memberSecret, merkleProof, groupRoot' },
                ].map((circuit) => (
                  <div key={circuit.name} className="rounded-xl glass p-5 border border-white/8">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="w-4 h-4 text-[#4ade80]" />
                      <code className="text-sm font-mono font-semibold text-[#4ade80]">{circuit.name}</code>
                    </div>
                    <p className="text-xs text-white/45 mb-2">{circuit.desc}</p>
                    <p className="text-[11px] text-white/30">
                      <span className="text-white/20">Inputs:</span> {circuit.inputs}
                    </p>
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
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#00e676]" />
                </div>
                <h2 className="text-2xl font-bold">Security</h2>
              </div>

              <p className="text-white/45 text-sm mb-6">
                StellarID was built with security-first principles. See the full{' '}
                <a href="https://github.com/iamomm-hack/StellarID/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer" className="text-[#00e676] hover:underline">
                  SECURITY.md checklist →
                </a>
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'JWT Authentication', desc: '7-day expiring tokens. All private endpoints protected.' },
                  { title: 'Helmet.js (HTTP Headers)', desc: 'XSS, clickjacking, MIME-type sniffing protection.' },
                  { title: 'Rate Limiting', desc: '20 req/min on auth, 100 req/min on verify endpoints.' },
                  { title: 'SQL Injection Prevention', desc: 'All queries use parameterized inputs via pg library.' },
                  { title: 'No Secrets in Code', desc: 'All keys in environment variables, never committed.' },
                  { title: 'HTTPS Enforced', desc: 'Render + Vercel enforce HTTPS on all production traffic.' },
                ].map(item => (
                  <div key={item.title} className="rounded-xl glass p-4 border border-white/8 flex gap-3 items-start">
                    <CheckCircle2 className="w-4 h-4 text-[#00e676] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold">{item.title}</h4>
                      <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom CTA */}
            <div className="rounded-2xl glass p-8 text-center border border-[#00e676]/15">
              <h3 className="text-xl font-bold mb-2">Ready to integrate?</h3>
              <p className="text-sm text-white/40 mb-5">Start building with StellarID — verify once, prove everywhere.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] text-[#0a0a1a] font-semibold text-sm hover:shadow-lg hover:shadow-[#00e676]/30 transition-all"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com/iamomm-hack/StellarID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/15 text-white/60 font-medium text-sm hover:bg-white/5 hover:text-white transition-all"
                >
                  View Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`${API_BASE.replace('/api/v1', '')}/health`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-[#00e676]/20 text-[#00e676]/70 font-medium text-sm hover:bg-[#00e676]/5 hover:text-[#00e676] transition-all"
                >
                  <Activity className="w-3.5 h-3.5" /> API Health
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
