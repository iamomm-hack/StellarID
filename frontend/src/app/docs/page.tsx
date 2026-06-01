'use client';
/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Fingerprint, Lock, Layers, Key, Eye,
  ArrowRight, BookOpen, Code2, Database, Terminal,
  Copy, Check, Zap, FileCode, Rocket, GitBranch,
  Server, ChevronRight, ExternalLink, CheckCircle2,
  Clock, Box, Linkedin, Github, Coins, Users,
  Activity, ShieldCheck, Globe, Award, Upload, Plus,
} from 'lucide-react';

const API_BASE = 'https://stellarid.onrender.com/api/v1';

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
  { method: 'POST', path: '/developer/keys', desc: 'Generate new developer API key', auth: true, group: 'Auth' },
  { method: 'POST', path: '/credentials', desc: 'Issue a new credential', auth: true, group: 'Credentials' },
  { method: 'GET',  path: '/credentials/my', desc: 'List your credentials', auth: true, group: 'Credentials' },
  { method: 'DELETE', path: '/credentials/:id', desc: 'Delete (unlink) a credential', auth: true, group: 'Credentials' },
  { method: 'POST', path: '/credentials/issue-with-email', desc: 'Issue credential via email (pending)', auth: true, group: 'Credentials' },
  { method: 'GET',  path: '/credentials/claim/:token', desc: 'Verify claim invitation token', auth: false, group: 'Credentials' },
  { method: 'POST', path: '/credentials/claim/:token', desc: 'Submit wallet and claim pending credential', auth: false, group: 'Credentials' },
  { method: 'POST', path: '/bulk/upload', desc: 'Upload CSV to bulk issue credentials', auth: true, group: 'Bulk Issuance' },
  { method: 'GET',  path: '/bulk/jobs/:id/status', desc: 'SSE/Polling for bulk job progress status', auth: true, group: 'Bulk Issuance' },
  { method: 'POST', path: '/bulk/jobs/:id/retry-failed', desc: 'Retry failed rows in bulk job', auth: true, group: 'Bulk Issuance' },
  { method: 'GET',  path: '/reputation/:wallet_address', desc: 'Get reputation score & breakdown', auth: false, group: 'Reputation' },
  { method: 'POST', path: '/reputation/:wallet_address/recalculate', desc: 'Force recalculate reputation', auth: false, group: 'Reputation' },
  { method: 'POST', path: '/issuers/:id/request-domain-verification', desc: 'Request DNS verification TXT token', auth: true, group: 'Issuer Verification' },
  { method: 'POST', path: '/issuers/:id/confirm-domain-verification', desc: 'Perform DNS TXT lookup to verify', auth: true, group: 'Issuer Verification' },
  { method: 'POST', path: '/issuers/:id/endorse', desc: 'Endorse another issuer account', auth: true, group: 'Issuer Verification' },
  { method: 'GET',  path: '/leaderboard', desc: 'Fetch rankings filtered by city/college', auth: false, group: 'Leaderboard' },
  { method: 'GET',  path: '/leaderboard/my-rank', desc: 'Get calling wallet leaderboard position', auth: true, group: 'Leaderboard' },
  { method: 'POST', path: '/ai/generate-bio', desc: 'Generate developer bio using Gemini API', auth: true, group: 'AI Services' },
  { method: 'GET',  path: '/billing/status', desc: 'Fetch subscription status & destination address', auth: true, group: 'Billing & Monetization' },
  { method: 'POST', path: '/billing/mock-upgrade', desc: 'Directly upgrade tier (Sandbox Mock Mode)', auth: true, group: 'Billing & Monetization' },
  { method: 'GET',  path: '/public/verify/:wallet_address', desc: 'Programmatically verify profile (B2B API)', auth: false, group: 'Public API' },
  { method: 'POST', path: '/public/credentials/issue', desc: 'Programmatically issue pending credential (B2B API)', auth: false, group: 'Public API' },
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
  const [sdkTab, setSdkTab] = useState<'readme' | 'api'>('readme');

  const sidebarItems = [
    { id: 'quickstart', label: 'Quick Start', icon: Rocket },
    { id: 'concepts', label: 'Core Concepts', icon: Layers },
    { id: 'controlcenter', label: 'Control Center', icon: Terminal },
    { id: 'architecture', label: 'Architecture', icon: GitBranch },
    { id: 'sdk', label: 'Developer SDK', icon: Code2 },
    { id: 'reputation', label: 'Reputation System', icon: Shield },
    { id: 'bulk', label: 'Bulk Issuance', icon: Layers },
    { id: 'oauth', label: 'OAuth Issuers', icon: Github },
    { id: 'discord', label: 'Discord Bot', icon: Users },
    { id: 'advanced', label: 'Advanced Features', icon: Zap },
    { id: 'billing', label: 'Billing & Sandbox', icon: Coins },
    { id: 'api', label: 'API Reference', icon: FileCode },
    { id: 'circuits', label: 'ZK Circuits', icon: FileCode },
    { id: 'security', label: 'Security', icon: ShieldCheck },
  ];



  const groups = [...new Set(apiEndpoints.map(e => e.group))];

  return (
    <div className="fixed top-[72px] bottom-0 left-0 right-0 z-30 flex bg-background overflow-hidden">
      <div className="max-w-[1400px] w-full mx-auto px-6 py-8 flex h-full overflow-hidden">
        {/* Sticky Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 h-full overflow-y-auto pr-6 scrollbar-thin">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  document.getElementById('docs-content-container')?.scrollTo({ top: 0, behavior: 'instant' });
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold font-display tracking-wider rounded-xl transition-all duration-200 text-left uppercase border ${
                  activeSection === item.id
                    ? 'border-accent-indigo text-foreground bg-accent-indigo/10 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-bold'
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

        {/* Vertical Divider */}
        <div className="hidden lg:block w-[1px] bg-white/[0.08] h-full" />

        {/* Scrollable Content Container */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto pl-8 pr-4 scrollbar-thin" id="docs-content-container">
          {/* Header */}
          <div className="mb-8">
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

          {/* Main Content */}
          <main className="flex-grow">
            {/* Mobile Navigation Scroll */}
            <div className="lg:hidden w-full overflow-x-auto flex gap-2 pb-3 mb-6 scrollbar-none sticky top-0 z-40 bg-[hsl(260,87%,3%)]/95 backdrop-blur-md py-3 border-b border-white/[0.06]">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    document.getElementById('docs-content-container')?.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold font-display tracking-wider rounded-full uppercase border transition-all duration-200 ${
                    activeSection === item.id
                      ? 'border-accent-indigo text-foreground bg-accent-indigo/10 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'border-white/[0.06] text-muted bg-white/[0.02] hover:text-foreground hover:bg-white/[0.05]'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>

            {/* === QUICKSTART === */}
            <section id="quickstart" className={`space-y-6 ${activeSection === 'quickstart' ? '' : 'hidden'}`}>
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
            <section id="concepts" className={`space-y-6 ${activeSection === 'concepts' ? '' : 'hidden'}`}>
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

            {/* === CONTROL CENTER === */}
            <section id="controlcenter" className={`space-y-6 ${activeSection === 'controlcenter' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Terminal className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Control Center
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                The **Identity Control Center** serves as the unified dashboard for StellarID. It provides users and developers access to various portals, analytics, and credential options.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Globe className="w-4 h-4 text-accent-indigo" />
                    Public Profile
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    A public shareable profile hosted at <code className="text-accent-indigo">/p/[address]</code>. Displays your verified credentials, ZK proof history, and peer-to-peer reputation score, perfect for resume or client verification. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Award className="w-4 h-4 text-accent-indigo" />
                    Leaderboard
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    A platform rankings board filtered by city or college. Displays active reputation scores and tiers to gamify on-chain trust and identity. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-accent-indigo" />
                    Issuer Portal
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Allows institutions to request domain verification tokens, run DNS TXT record lookups, perform email verification, and endorse other trusted peer issuers to build network-wide reputation. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Upload className="w-4 h-4 text-accent-indigo" />
                    Bulk Issuance
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Send up to 1000 credentials simultaneously via a CSV upload template. Uses background BullMQ workers and Redis queue management to bypass rate limits. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Terminal className="w-4 h-4 text-accent-indigo" />
                    Developer API
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Create and revoke Developer API Keys, configure B2B webhooks, inspect rate limits, and access live logs of credentials issued programmatically. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-accent-indigo" />
                    Plans & Billing
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Manage tier subscriptions (Free, Pro, Enterprise) via Stripe Checkout or direct Stellar XLM/USDC payments. Features a Sandbox Instant Mock Upgrade toggle in development mode. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-accent-indigo" />
                    Analytics
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    An advanced SaaS console visualizing credential trends, telemetry trend lines, daily issuance volume graphs, and recent verification event feeds. Opens in a new tab.
                  </p>
                </div>

                <div className="protocol-panel p-6 space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-display font-bold text-sm uppercase tracking-wider">
                    <Plus className="w-4 h-4 text-accent-indigo" />
                    Request Credential
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    An on-screen wizard interface allowing users to submit credential requests directly to trusted university, employee, or community issuers.
                  </p>
                </div>
              </div>
            </section>

            {/* === ARCHITECTURE === */}
            <section id="architecture" className={`space-y-6 ${activeSection === 'architecture' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <GitBranch className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Architecture
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID leverages a multi-layer trust architecture designed to decouple client-side zero-knowledge computations, asynchronous queue management, metadata distribution, and secure on-chain token settlement.
              </p>

              <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40 p-6 flex justify-center">
                <img
                  src="/flowchart_black.png"
                  alt="StellarID System Architecture Flowchart"
                  className="w-full max-w-[900px] h-auto object-contain"
                />
              </div>

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

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo"></span>
                  Claim Credential Architecture Flow
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  This flow facilitates gasless credential onboarding for users without a pre-existing wallet. A unique encrypted token is routed to their email, serving as the bridge to connect their Freighter wallet and trigger Soroban smart contract minting.
                </p>
                <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40 p-6 flex justify-center">
                  <img
                    src="/docs/claim_credential_architecture_flow.svg"
                    alt="Claim Credential Architecture Flow"
                    className="w-full max-w-[800px] h-auto object-contain"
                  />
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo"></span>
                  Bulk Credential Issuance Queue Flow
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  To prevent hitting API bottlenecks and Resend SMTP limits, bulk issuances of up to 1000 items are queued using Redis and processed asynchronously by BullMQ background workers.
                </p>
                <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40 p-6 flex justify-center">
                  <img
                    src="/docs/bulk_credential_issuance_queue_flow_v2.svg"
                    alt="Bulk Credential Issuance Queue Flow"
                    className="w-full max-w-[800px] h-auto object-contain"
                  />
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo"></span>
                  Non-Crypto Onboarding (Privy) Flow
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  For users without Freighter wallets, StellarID leverages Privy to enable email/social logins. On registration, Privy creates a secure, embedded wallet on behalf of the user, which is mapped directly to their user ID in the database, allowing seamless credential claiming.
                </p>
                <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40 p-6 flex justify-center">
                  <img
                    src="/docs/non_crypto_onboarding_privy_flow_v2.svg"
                    alt="Non-Crypto Onboarding (Privy) Flow"
                    className="w-full max-w-[800px] h-auto object-contain"
                  />
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-indigo"></span>
                  Stripe Subscription Billing & Webhook Flow
                </h3>
                <p className="text-xs text-muted leading-relaxed font-sans">
                  The API monetization layer supports tiered limits (Free, Pro, Enterprise). Tiers can be upgraded programmatically via Stripe Checkout. Webhook payloads notify the backend of lifecycle status updates, updating user limits immediately.
                </p>
                <div className="relative border border-white/[0.06] rounded-xl overflow-hidden bg-black/40 p-6 flex justify-center">
                  <img
                    src="/docs/stripe_billing_webhook_flow_v3.svg"
                    alt="Stripe Subscription Billing & Webhook Flow"
                    className="w-full max-w-[800px] h-auto object-contain"
                  />
                </div>
              </div>
            </section>

            {/* === DEVELOPER SDK === */}
            <section id="sdk" className={`space-y-6 ${activeSection === 'sdk' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Code2 className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Developer SDK
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID provides a high-level developer toolkit to interact programmatically with our reputation engine and credentials. 
                Below is the official documentation for the <code className="text-accent-indigo font-mono">stellarid-sdk</code> NPM package.
              </p>

              {/* NPM Package Mock Registry UI */}
              <div className="w-full rounded-xl overflow-hidden border border-white/[0.06] bg-black/40">
                {/* Header */}
                <div className="bg-white/[0.02] border-b border-white/[0.06] p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold font-mono text-foreground tracking-tight">stellarid-sdk</h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-accent-indigo border border-indigo-500/20">
                          TS
                        </span>
                        <span className="text-xs text-muted">1.0.0 • Public</span>
                      </div>
                      <p className="text-xs text-muted mt-2 max-w-xl font-sans">
                        The official JavaScript/TypeScript SDK for StellarID — the protocol-grade identity and reputation layer on Stellar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06] bg-black/20">
                  <button
                    onClick={() => setSdkTab('readme')}
                    className={`px-6 py-3 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
                      sdkTab === 'readme'
                        ? 'border-accent-indigo text-foreground bg-white/[0.02]'
                        : 'border-transparent text-muted hover:text-foreground hover:bg-white/[0.01]'
                    }`}
                  >
                    Readme
                  </button>
                  <button
                    onClick={() => setSdkTab('api')}
                    className={`px-6 py-3 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
                      sdkTab === 'api'
                        ? 'border-accent-indigo text-foreground bg-white/[0.02]'
                        : 'border-transparent text-muted hover:text-foreground hover:bg-white/[0.01]'
                    }`}
                  >
                    API Reference
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-black/10 flex flex-col lg:flex-row gap-8">
                  {/* Main Tab Content */}
                  <div className="flex-1 min-w-0 space-y-8">
                    {sdkTab === 'readme' ? (
                      <div className="space-y-6 text-sm text-muted leading-relaxed font-sans">
                        <div>
                          <h4 className="text-base font-bold text-foreground mb-2">StellarID JavaScript SDK</h4>
                          <p>
                            Easily integrate user credential verification, reputation score lookups, on-chain credential issuance, and embeddable trust badges into your Web3 applications.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h5 className="font-bold text-foreground font-display uppercase tracking-wider text-xs">Installation</h5>
                          <p>Install the package via npm, yarn, or pnpm:</p>
                          <CodeBlock code="npm install stellarid-sdk" lang="bash" />
                          <div className="text-xs text-muted font-mono bg-white/[0.01] p-3 rounded-lg border border-white/[0.04] space-y-1">
                            <div># or</div>
                            <div>yarn add stellarid-sdk</div>
                            <div># or</div>
                            <div>pnpm add stellarid-sdk</div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h5 className="font-bold text-foreground font-display uppercase tracking-wider text-xs border-b border-white/[0.06] pb-2">Quick Start</h5>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">1. Initialize the Client</h6>
                            <p>Obtain your Developer API Key from the StellarID Dashboard and instantiate the client:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`import { StellarID } from 'stellarid-sdk';

const stellarId = new StellarID({
  apiKey: 'your-developer-api-key',
  // Optional: Custom base URL (e.g. for local testing)
  // baseURL: 'http://localhost:5555/api/v1' 
});`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">2. Verify a User's Reputation Score & Credentials</h6>
                            <p>Retrieve verified credentials and computed reputation levels for any Stellar wallet address:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`async function checkUserReputation(walletAddress: string) {
  try {
    const profile = await stellarId.verifyWallet(walletAddress);
    
    console.log(\`Score: \${profile.reputation_score}\`);
    console.log(\`Tier: \${profile.tier}\`);
    console.log(\`Is Verified: \${profile.verified}\`);
    
    // List user credentials
    profile.credentials.forEach(cred => {
      console.log(\`- \${cred.name} (\${cred.status}) issued by \${cred.issuer_name}\`);
    });
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
}

checkUserReputation('GA2C7...55');`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">3. Generate and Embed a Trust Badge</h6>
                            <p>Retrieve the ready-to-use iframe HTML code to render a gorgeous, glassmorphic trust badge on your website:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`async function renderUserBadge(walletAddress: string) {
  const badge = await stellarId.getBadge({
    walletAddress,
    style: 'dark', // 'light' | 'dark'
    size: 'md',     // 'sm' | 'md' | 'lg'
  });

  console.log('Insert this HTML to display the badge:');
  console.log(badge.html);
  
  // Or get the direct URL to use as you wish:
  console.log('Iframe URL:', badge.iframe_url);
}`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">4. Issue a New Credential</h6>
                            <p>Programmatically issue credentials to builders. This inserts a pending credential and emails the recipient a secure link to claim it:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`async function sendDeveloperCredential(recipientEmail: string, walletAddress?: string) {
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

  console.log(\`Credential Pending! Claim URL: \${result.claim_url}\`);
}`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">React Integration Pattern</h6>
                            <p>You can build a reactive hook or component to fetch reputation dynamically:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`import React, { useState, useEffect } from 'react';
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
}`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">React Hooks Package (`stellarid-react`)</h6>
                            <p>For Next.js and React developers, we provide pre-built custom hooks that handle caching, error boundaries, and state mapping automatically:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`import { useStellarIDProfile, useVerifyCredential } from 'stellarid-react';

export function ProfileDashboard({ walletAddress }: { walletAddress: string }) {
  const { profile, loading, error, refetch } = useStellarIDProfile(walletAddress);
  
  if (loading) return <div>Fetching credentials from IPFS...</div>;
  if (error) return <div>Failed to verify: {error.message}</div>;

  return (
    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
      <h3 className="text-lg font-bold">Reputation: {profile?.reputation_score} ({profile?.tier})</h3>
      <p className="text-xs text-slate-400 mt-1">Stellar Address: {walletAddress}</p>
      
      <div className="mt-4 space-y-2">
        {profile?.credentials.map(cred => (
          <div key={cred.id} className="flex justify-between text-xs py-1 border-b border-slate-800">
            <span>{cred.name}</span>
            <span className="font-mono text-emerald-400">STATUS_MINTED</span>
          </div>
        ))}
      </div>
    </div>
  );
}`}
                            />
                          </div>

                          <div className="space-y-3">
                            <h6 className="font-bold text-foreground text-xs">Build Bundling Configuration (`tsup`)</h6>
                            <p>The SDK compiles dual formats (CommonJS and ESM) with strict type outputs using tsup. Here is our setup for standard integrations:</p>
                            <CodeBlock
                              lang="typescript"
                              code={`// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  external: ['stellar-sdk', '@privy-io/react-auth'],
});`}
                            />
                          </div>
                        </div>

                        <div className="border-t border-white/[0.06] pt-4 flex justify-between text-xs text-muted font-sans">
                          <span>License: MIT License. Copyright (c) 2026 StellarID.</span>
                          <span className="font-mono text-accent-indigo">Keywords: stellar, identity, sdk, zk-proof, verification</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6 font-sans">
                        <h4 className="text-base font-bold text-foreground">SDK API Reference</h4>
                        <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="p-3 font-semibold text-foreground">Method</th>
                                <th className="p-3 font-semibold text-foreground">Parameters</th>
                                <th className="p-3 font-semibold text-foreground">Return Type</th>
                                <th className="p-3 font-semibold text-foreground">Required API Permission</th>
                                <th className="p-3 font-semibold text-foreground">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                              <tr>
                                <td className="p-3 font-mono text-accent-indigo font-semibold">verifyWallet(walletAddress)</td>
                                <td className="p-3 font-mono text-muted">walletAddress: string</td>
                                <td className="p-3 font-mono text-muted">Promise&lt;VerifyWalletResponse&gt;</td>
                                <td className="p-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-yellow-500/10 text-yellow-400">verify</span></td>
                                <td className="p-3 text-muted">Fetches a wallet's full reputation score, credentials list, and tier.</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-mono text-accent-indigo font-semibold">getBadge(params)</td>
                                <td className="p-3 font-mono text-muted">{"{ walletAddress, style?, size? }"}</td>
                                <td className="p-3 font-mono text-muted">Promise&lt;GetBadgeResponse&gt;</td>
                                <td className="p-3 flex flex-wrap gap-1"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-yellow-500/10 text-yellow-400">verify</span> <span className="text-muted">or</span> <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400">read_profile</span></td>
                                <td className="p-3 text-muted">Generates iframe embedding HTML & source URL to show a micro-badge.</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-mono text-accent-indigo font-semibold">issueCredential(params)</td>
                                <td className="p-3 font-mono text-muted">{"{ recipientEmail, recipientWallet?, credential }"}</td>
                                <td className="p-3 font-mono text-muted">Promise&lt;IssueCredentialResponse&gt;</td>
                                <td className="p-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400">issue</span></td>
                                <td className="p-3 text-muted">Creates a pending credential and triggers a verification email.</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-mono text-accent-indigo font-semibold">getCredential(credentialId)</td>
                                <td className="p-3 font-mono text-muted">credentialId: string</td>
                                <td className="p-3 font-mono text-muted">Promise&lt;GetCredentialResponse&gt;</td>
                                <td className="p-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400">read_profile</span></td>
                                <td className="p-3 text-muted">Retrieves specific details of an existing, verified credential.</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-mono text-accent-indigo font-semibold">getProof(credentialId)</td>
                                <td className="p-3 font-mono text-muted">credentialId: string</td>
                                <td className="p-3 font-mono text-muted">Promise&lt;GetProofResponse&gt;</td>
                                <td className="p-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-yellow-500/10 text-yellow-400">verify</span></td>
                                <td className="p-3 text-muted">Retrieves details about a verified zero-knowledge proof for a credential.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Stats */}
                  <div className="w-full lg:w-64 shrink-0 space-y-6 lg:border-l lg:border-white/[0.06] lg:pl-8 font-sans">
                    <div className="space-y-2">
                      <span className="text-[10px] font-display uppercase tracking-widest text-muted font-bold block">Install</span>
                      <div className="relative border border-white/[0.06] rounded-lg overflow-hidden bg-black/30 p-3 pr-10 font-mono text-xs text-foreground">
                        npm i stellarid-sdk
                        <button
                          onClick={() => navigator.clipboard.writeText('npm i stellarid-sdk')}
                          className="absolute right-2 top-2.5 p-1 rounded hover:bg-white/[0.04] text-muted hover:text-foreground transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-muted">Weekly Downloads</span>
                        <span className="font-bold text-foreground font-mono">144</span>
                      </div>
                      <div className="flex justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-muted">Version</span>
                        <span className="font-bold text-foreground font-mono">1.0.0</span>
                      </div>
                      <div className="flex justify-between border-b border-white/[0.04] pb-2">
                        <span className="text-muted">License</span>
                        <span className="font-bold text-foreground font-mono">MIT</span>
                      </div>
                      <div className="flex justify-between border-b border-white/[0.04] pb-2">
                        {/* <span className="text-muted">Last publish</span>
                        <span className="font-bold text-foreground font-mono">2 days ago</span> */}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-muted">Collaborators</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-4 h-4 rounded-full bg-accent-indigo text-[10px] text-black font-bold flex items-center justify-center font-mono">O</span>
                          <span className="font-mono text-foreground">omkumarx</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* === REPUTATION SYSTEM === */}
            <section id="reputation" className={`space-y-6 ${activeSection === 'reputation' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Shield className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Reputation System
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID calculates a composite credibility score (0 - 1000) for each profile based on on-chain credentials, issuer trust levels, and temporal recency.
              </p>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">Scoring Formula</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Each claimed credential increases the score. Credentials decay gracefully over time to ensure active builders remain at the top.
                </p>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] font-mono text-xs text-accent-indigo text-center">
                  Score = (Base Points [10] + Recency Bonus [0-5]) × Issuer Multiplier × 100
                </div>
                <ul className="space-y-2 text-xs text-muted list-disc list-inside">
                  <li><span className="text-foreground font-bold">Recency Bonus:</span> Starts at +5 points and decays by 1 point every 3 months after issuance.</li>
                  <li><span className="text-foreground font-bold">Issuer Multiplier:</span> Scaled from 0.1 to 1.0 based on the issuer's verification tier and history.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="protocol-panel p-6">
                  <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Reputation Tiers</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Verified Builder', range: '0 - 199', color: 'text-gray-400 bg-gray-800/40 border-gray-800' },
                      { name: 'Proven Builder', range: '200 - 499', color: 'text-blue-400 bg-blue-900/20 border-blue-900/40' },
                      { name: 'Elite Builder', range: '500+ / 1000', color: 'text-violet-400 bg-violet-900/20 border-violet-900/40' },
                    ].map(tier => (
                      <div key={tier.name} className={`flex items-center justify-between p-3 rounded-xl border ${tier.color}`}>
                        <span className="text-xs font-bold font-display uppercase tracking-wider">{tier.name}</span>
                        <span className="text-xs font-mono">{tier.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="protocol-panel p-6">
                  <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Extra Profile Bonuses</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'GitHub Connected', bonus: '+50 pts', desc: 'Verify ownership of a GitHub account via OAuth.' },
                      { name: 'Official Issuer Boost', bonus: '+20 pts', desc: 'Earn a credential issued by an officially verified entity.' },
                      { name: 'Diversity Bonus', bonus: '+100 pts', desc: 'Hold credentials from 5 or more unique issuers.' },
                      { name: 'Active Streak', bonus: '+25 pts', desc: 'Claim at least one verified credential within the last 30 days.' },
                    ].map(bonus => (
                      <div key={bonus.name} className="flex items-start justify-between gap-3 text-xs">
                        <div>
                          <p className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">{bonus.name}</p>
                          <p className="text-[10px] text-muted mt-0.5">{bonus.desc}</p>
                        </div>
                        <span className="text-xs font-mono text-accent-indigo font-bold">{bonus.bonus}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">StellarID Cards & Social Sharing (P0-B)</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Every user gets a public profile page at <code className="text-accent-indigo font-mono bg-white/[0.02] px-1 py-0.5 rounded">/p/[walletAddress]</code> containing an interactive, glassmorphic reputation card.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted">
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px] mb-2">Dynamic Canvas Card Renderer</h4>
                    <p className="leading-relaxed">The frontend renders the card in HTML/CSS with premium hover gradients, then dynamically draws the card to an HTML5 canvas for direct PNG download. It matches the user's reputation tier background colors.</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px] mb-2">Edge-Generated Social OG Images</h4>
                    <p className="leading-relaxed">To ensure rich previews when profiles are shared on X or LinkedIn, an Edge Function API utilizes <code className="font-mono text-accent-purple">@vercel/og</code> to generate dynamic SVG/PNG images with real-time score statistics directly from database records.</p>
                  </div>
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">Gamified Badges & Streaks (P2-C)</h3>
                <p className="text-xs text-muted leading-relaxed">
                  StellarID uses daily streaks and verifiable badges to incentivize active participation and community contributions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px] mb-2">Consecutive Streaks</h4>
                    <p className="text-[11px] text-muted leading-relaxed">Users increase their daily streak by submitting proof verifications. If 24 hours elapse since the last activity, the streak resets to 0 (evaluated at midnight UTC).</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px] mb-2">Redis Sorted Sets</h4>
                    <p className="text-[11px] text-muted leading-relaxed">Reputation and streak rankings are stored in Redis sorted sets. This allows fast, low-latency leaderboard lookups, supporting filter tags such as global, city, or university rankings.</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px] mb-2">Badge Library</h4>
                    <ul className="text-[10px] text-muted list-disc list-inside space-y-1">
                      <li><span className="font-bold text-foreground">First Step:</span> Earned on first credential claim.</li>
                      <li><span className="font-bold text-foreground">Collector:</span> Own 5+ unique credentials.</li>
                      <li><span className="font-bold text-foreground">Elite Builder:</span> Score passes 500.</li>
                      <li><span className="font-bold text-foreground">Consistent:</span> Maintain a 7-day streak.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* === BULK ISSUANCE === */}
            <section id="bulk" className={`space-y-6 ${activeSection === 'bulk' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Layers className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Bulk Issuance Architecture
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID supports large-scale credential distribution for hackathons and organizations. By utilizing asynchronous queues, the system processes up to 1,000 recipients asynchronously without overloading the network or API limits.
              </p>

              <div className="protocol-panel p-6">
                <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Background Queue Flow</h3>
                
                <div className="relative border-l-2 border-accent-indigo/20 ml-3 pl-6 space-y-6 text-xs text-muted">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-accent-indigo text-[10px] text-black font-bold font-mono">1</span>
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">CSV Upload & Validation</h4>
                    <p className="mt-1">The issuer uploads a recipient CSV (validated for email formats and wallet prefixes) and pushes the raw sheet audit backup to IPFS.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-accent-indigo text-[10px] text-black font-bold font-mono">2</span>
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">BullMQ Asynchronous Enqueueing</h4>
                    <p className="mt-1">A Redis-backed BullMQ worker picks up the job. It processes rows at a rate-limit of 10 emails/second to comply with third-party service bounds.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-accent-indigo text-[10px] text-black font-bold font-mono">3</span>
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">Token Generation & Delivery</h4>
                    <p className="mt-1">A secure, unique UUID claim token is generated for each row. A customizable HTML invite email is dispatched via Resend.</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-0 flex items-center justify-center w-4 h-4 rounded-full bg-accent-indigo text-[10px] text-black font-bold font-mono">4</span>
                    <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">SSE Real-Time Stepper Updates</h4>
                    <p className="mt-1">The frontend uses Server-Sent Events (SSE) to subscribe to real-time status streams (showing processed, success, and failure counts).</p>
                  </div>
                </div>
              </div>
            </section>

            {/* === OAUTH ISSUERS === */}
            <section id="oauth" className={`space-y-6 ${activeSection === 'oauth' ? '' : 'hidden'}`}>
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

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">Issuer Verification Tiers & DNS Validation (P1-B)</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Organizations acting as credential issuers must undergo domain validation to establish trust. Issuers are partitioned into three distinct tiers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-1">Tier 1: Community</span>
                    <p className="text-muted leading-relaxed">Self-registered issuers. Credentials have a default multiplier weight of <code className="font-mono text-accent-indigo">0.2</code>. Best for hackathon projects and niche apps.</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider block mb-1">Tier 2: Official</span>
                    <p className="text-muted leading-relaxed">Verified domains. Credentials have a multiplier weight of <code className="font-mono text-accent-indigo">0.8</code>. Requires adding a DNS TXT record check at host root.</p>
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                    <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider block mb-1">Tier 3: Endorsed</span>
                    <p className="text-muted leading-relaxed">Manually vetted or delegated by other Top-Tier issuers. Credentials have a multiplier weight of <code className="font-mono text-accent-indigo">1.0</code>.</p>
                  </div>
                </div>
                <div className="space-y-2 mt-4 text-xs text-muted">
                  <h4 className="font-bold text-foreground font-display uppercase tracking-wider text-[11px]">DNS TXT Verification Protocol</h4>
                  <p className="leading-relaxed">To claim Official domain ownership, issuers must add a TXT record to their domain DNS configuration:</p>
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl font-mono text-[10px] leading-relaxed">
                    Type: TXT <br />
                    Host: @ <br />
                    Value: stellarid-verify=TOKEN_UUID_VALUE
                  </div>
                  <p className="leading-relaxed">The backend verifies this record programmatically using secure DNS-over-HTTPS queries to check for matching token states prior to domain approval.</p>
                </div>
              </div>
            </section>

            {/* === DISCORD BOT === */}
            <section id="discord" className={`space-y-6 ${activeSection === 'discord' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Users className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Discord Bot Integration
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                Automate developer community gating using our custom Discord bot. Link your wallet, prove your credentials, and automatically unlock server channels based on your reputation score and tier.
              </p>

              <div className="flex items-center justify-between gap-4 bg-accent-indigo/10 border border-white/[0.04] rounded-xl p-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-foreground">Join Our Community</h4>
                  <p className="text-[11px] text-muted leading-relaxed">Experience live reputation-gating in action. Join the official StellarID Discord server today.</p>
                </div>
                <a 
                  href="https://discord.gg/8Xdyj7ZD" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-accent-indigo hover:bg-accent-indigo/80 text-white text-xs font-bold px-4 py-2 rounded-lg font-display uppercase tracking-wider whitespace-nowrap transition-colors"
                >
                  Join Server
                </a>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">Supported Discord Slash Commands</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { cmd: '/verify', desc: 'Generates a secure wallet-linking gateway link valid for 10 minutes.' },
                    { cmd: '/profile', desc: 'Displays linked wallet details, active streak, earned badges, and reputation tier.' },
                    { cmd: '/leaderboard', desc: 'Fetches the top 10 global reputation rankings from the database.' },
                  ].map(command => (
                    <div key={command.cmd} className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
                      <code className="text-accent-indigo font-mono font-bold text-xs">{command.cmd}</code>
                      <p className="text-xs text-muted mt-2 leading-relaxed">{command.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="protocol-panel p-6">
                <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Role Gating Hierarchy</h3>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  The bot dynamically checks member reputation scores via backend webhook alerts and assigns the corresponding server role:
                </p>
                <div className="space-y-2">
                  {[
                    { role: 'Stellar Platinum', desc: 'Assigned to Elite Builders with scores 500+', color: 'text-violet-400 bg-violet-950/20 border-violet-900/40' },
                    { role: 'Stellar Gold', desc: 'Assigned to Proven Builders with scores 350-499', color: 'text-yellow-400 bg-yellow-950/20 border-yellow-900/40' },
                    { role: 'Stellar Silver', desc: 'Assigned to Proven Builders with scores 200-349', color: 'text-zinc-300 bg-zinc-900/40 border-zinc-800' },
                    { role: 'Stellar Bronze', desc: 'Assigned to Verified Builders with scores 0-199', color: 'text-amber-600 bg-amber-950/10 border-amber-900/20' },
                  ].map(tier => (
                    <div key={tier.role} className={`flex items-center justify-between p-3 rounded-xl border ${tier.color}`}>
                      <span className="text-xs font-bold font-display uppercase tracking-wider">{tier.role}</span>
                      <span className="text-[11px] text-muted">{tier.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">SQLite Discord Database Schema</h3>
                <p className="text-xs text-muted leading-relaxed">
                  The Discord bot runs a local SQLite server for tracking configuration states and wallet mapping. This operates independently of the main PostgreSQL database for fast local execution.
                </p>
                <CodeBlock lang="sql" code={`-- Guild verification settings
CREATE TABLE IF NOT EXISTS guilds (
  guild_id TEXT PRIMARY KEY,
  required_tier TEXT DEFAULT 'Proven Builder',
  role_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Linked user mappings
CREATE TABLE IF NOT EXISTS verified_members (
  discord_id TEXT PRIMARY KEY,
  stellar_address TEXT UNIQUE NOT NULL,
  reputation_score INTEGER NOT NULL,
  last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`} />
              </div>
            </section>

            {/* === ADVANCED FEATURES === */}
            <section id="advanced" className={`space-y-6 ${activeSection === 'advanced' ? '' : 'hidden'}`}>
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

              {/* AI Developer Bio Generator */}
              <div className="protocol-panel p-6">
                <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-4">
                  <span className="font-display text-xs font-bold text-foreground">AI Developer Bio (Gemini)</span>
                  <span className="text-[9px] font-mono text-accent-indigo uppercase font-bold">Active</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mb-4">
                  Generates an optimized professional profile bio using Google Gemini AI, leveraging the user's verified credentials, Github linked data, and reputation tiers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { style: 'LinkedIn', desc: 'A professional, high-signal resume summary (2-3 sentences).' },
                    { style: 'Twitter', desc: 'A concise, punchy builder bio under the 160-character limit.' },
                    { style: 'Resume', desc: 'A comprehensive, detailed background profile statement.' },
                  ].map(styleObj => (
                    <div key={styleObj.style} className="bg-white/[0.01] border border-white/[0.04] rounded-xl p-3">
                      <p className="text-xs font-bold font-display text-accent-indigo">{styleObj.style}</p>
                      <p className="text-[10px] text-muted mt-1 leading-relaxed">{styleObj.desc}</p>
                    </div>
                  ))}
                </div>
                <CodeBlock lang="json" code={`// POST /api/v1/ai/generate-bio
Authorization: Bearer YOUR_JWT
{
  "style": "linkedin" // "linkedin" | "twitter" | "resume"
}

// Response
{
  "bio": "Stellar Soroban developer with an Elite reputation rating. Proven track record of deploying verified smart contracts and contributing to open-source ecosystems."
}`} />
              </div>
            </section>

            {/* === BILLING & SANDBOX === */}
            <section id="billing" className={`space-y-6 ${activeSection === 'billing' ? '' : 'hidden'}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
                <Coins className="w-5 h-5 text-accent-indigo" />
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-foreground">
                  Billing & Sandbox Mode
                </h2>
              </div>

              <p className="text-muted text-sm leading-relaxed">
                StellarID features a wallet-integrated subscription billing mechanism utilizing Stellar XLM/USDC payments. For testing and development environment safety, the platform operates in Sandbox Mock Mode.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="protocol-panel p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Sandbox Mock Mode</h3>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      When Stripe is disabled, <code className="font-mono text-accent-indigo">IS_MOCK_MODE</code> is activated. In this state, issuers can trigger instant, zero-cost upgrades directly from the billing dashboard to mock specific API limit tiers.
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center">
                    <span className="text-[10px] font-mono text-accent-indigo font-bold uppercase tracking-wider">Status: Mock Mode Active</span>
                  </div>
                </div>

                <div className="protocol-panel p-6">
                  <h3 className="font-bold text-sm border-b border-white/[0.04] pb-3 mb-4 font-display uppercase tracking-wider text-foreground">Payment Settlement</h3>
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    In production networks, billing payments are settled directly on-chain using Freighter wallets. Transactions are sent to the platform's primary treasury billing address:
                  </p>
                  <div className="p-3 bg-black/40 border border-white/[0.06] rounded-xl font-mono text-[10px] break-all select-all text-muted relative mb-2">
                    GBMQJ3G5LDWODZKUUQWGGT6NIKMM7KL5NLHVIG53WLNLWB27Z4AKH3F4
                  </div>
                  <p className="text-[10px] text-muted/80 leading-relaxed font-sans">
                    Supports on-chain payment matching via transaction hashes synced automatically with Soroban contract events.
                  </p>
                </div>
              </div>

              <div className="protocol-panel p-6 space-y-4">
                <h3 className="font-bold text-sm font-display uppercase tracking-wider text-foreground">Stripe Products & API Limits Mapping</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Stripe Checkout maps product IDs directly to subscription tier limits. Webhook payloads verify signatures and update limits in real time.
                </p>
                <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs text-muted">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="p-3 font-semibold text-foreground">Subscription Tier</th>
                        <th className="p-3 font-semibold text-foreground">Stripe Product ID</th>
                        <th className="p-3 font-semibold text-foreground">API Rate Limit</th>
                        <th className="p-3 font-semibold text-foreground">Daily Request Quota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] font-mono">
                      <tr>
                        <td className="p-3 font-bold text-foreground">Free Tier</td>
                        <td className="p-3">prod_free_default</td>
                        <td className="p-3">2 requests / sec</td>
                        <td className="p-3">100 requests</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-yellow-400">Developer Pro</td>
                        <td className="p-3 text-yellow-400">prod_dev_pro_999</td>
                        <td className="p-3">15 requests / sec</td>
                        <td className="p-3">10,000 requests</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-violet-400">Enterprise</td>
                        <td className="p-3 text-violet-400">prod_enterprise_unlim</td>
                        <td className="p-3">100 requests / sec</td>
                        <td className="p-3">Unlimited</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* === API REFERENCE === */}
            <section id="api" className={`space-y-6 ${activeSection === 'api' ? '' : 'hidden'}`}>
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
            <section id="circuits" className={`space-y-6 ${activeSection === 'circuits' ? '' : 'hidden'}`}>
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
                  {
                    name: 'age_check',
                    desc: 'Proves birthYear <= threshold threshold without disclosing age details.',
                    privateInputs: 'birthYear',
                    publicInputs: 'currentYear, ageLimit',
                    outputs: 'isAboveLimit (1 if currentYear - birthYear >= ageLimit, else 0)'
                  },
                  {
                    name: 'income_check',
                    desc: 'Proves salary range boundary assertions without revealing precise amount.',
                    privateInputs: 'income',
                    publicInputs: 'minIncome, maxIncome',
                    outputs: 'isValid (1 if income is between minIncome and maxIncome, else 0)'
                  },
                  {
                    name: 'residency_check',
                    desc: 'Proves geographic location compliance with zero metadata leaks.',
                    privateInputs: 'countryCode',
                    publicInputs: 'allowedCountries[10]',
                    outputs: 'isResident (1 if countryCode matches one of the allowedCountries, else 0)'
                  },
                  {
                    name: 'membership_check',
                    desc: 'Proves secret membership in a Merkle tree without revealing leaf index.',
                    privateInputs: 'memberSecret, merklePathElements[16], merklePathIndices[16]',
                    publicInputs: 'groupRoot',
                    outputs: 'isValidMember (1 if calculated Merkle root matches groupRoot, else 0)'
                  },
                ].map((circuit) => (
                  <div key={circuit.name} className="protocol-panel p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-2">
                      <span className="font-mono text-xs text-foreground font-bold">{circuit.name}</span>
                      <span className="text-[9px] font-mono text-accent-indigo uppercase font-bold">Circom Circuit</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{circuit.desc}</p>
                    <div className="space-y-1 text-[10px] text-muted/80 font-mono">
                      <div>
                        <span className="text-foreground font-bold">Private Inputs:</span> {circuit.privateInputs}
                      </div>
                      <div>
                        <span className="text-foreground font-bold">Public Inputs:</span> {circuit.publicInputs}
                      </div>
                      <div>
                        <span className="text-foreground font-bold">Outputs:</span> {circuit.outputs}
                      </div>
                    </div>
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
            <section id="security" className={`space-y-6 ${activeSection === 'security' ? '' : 'hidden'}`}>
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
            <div className="protocol-panel p-8 text-center relative overflow-hidden mt-12">
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
