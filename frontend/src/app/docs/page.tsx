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
} from 'lucide-react';

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
    desc: 'Zero personal data stored. All credentials encrypted client-side. Blockchain stores only hashed commitments.',
    color: 'text-[#a855f7]',
    bg: 'bg-[#a855f7]/10',
  },
];

const apiEndpoints = [
  { method: 'POST', path: '/api/v1/auth/login', desc: 'Authenticate with Stellar wallet', auth: false },
  { method: 'POST', path: '/api/v1/credentials/request', desc: 'Request a new credential', auth: true },
  { method: 'GET', path: '/api/v1/credentials', desc: 'List your credentials', auth: true },
  { method: 'POST', path: '/api/v1/verify', desc: 'Verify a ZK proof', auth: false },
  { method: 'GET', path: '/api/v1/issuers', desc: 'List trusted issuers', auth: false },
  { method: 'POST', path: '/api/v1/platforms/register', desc: 'Register as verifier platform', auth: true },
  { method: 'GET', path: '/api/v1/github-issuer/auth', desc: 'Start GitHub OAuth flow', auth: false },
];

const quickstartSteps = [
  {
    step: '01',
    title: 'Install SDK',
    desc: 'Add the StellarID verification SDK to your project',
    code: 'npm install @stellarid/sdk',
  },
  {
    step: '02',
    title: 'Initialize Client',
    desc: 'Set up the verification client with your API key',
    code: `import { StellarID } from '@stellarid/sdk';

const stellarid = new StellarID({
  apiKey: 'your_api_key',
  network: 'testnet'
});`,
  },
  {
    step: '03',
    title: 'Verify a Proof',
    desc: 'Accept and verify a user\'s ZK proof in one call',
    code: `const result = await stellarid.verify({
  proof: userProof,
  claim: 'age_over_18',
  credentialId: 'cred_abc123'
});

console.log(result.valid);    // true
console.log(result.dataExposed); // "none"`,
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
    items: ['Express.js REST API', 'JWT + API Key Auth', 'Rate Limiting', 'GitHub OAuth Issuer'],
    color: 'border-[#7c3aed]/20',
    dotColor: 'bg-[#7c3aed]',
  },
  {
    icon: Database,
    label: 'Data Layer',
    items: ['PostgreSQL 15', 'Redis 7 Cache', 'Pinata IPFS', 'Stellar Blockchain'],
    color: 'border-[#a855f7]/20',
    dotColor: 'bg-[#a855f7]',
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  const sidebarItems = [
    { id: 'quickstart', label: 'Quick Start', icon: Rocket },
    { id: 'concepts', label: 'Core Concepts', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: GitBranch },
    { id: 'api', label: 'API Reference', icon: Code2 },
    { id: 'circuits', label: 'ZK Circuits', icon: FileCode },
  ];

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
            <span className="text-[#00e676] font-semibold text-xs ml-1">v2.0</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            <span className="bg-gradient-to-r from-[#00e676] via-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
              StellarID
            </span>{' '}
            Documentation
          </h1>
          <p className="text-lg text-white/40 max-w-2xl">
            Integrate privacy-preserving identity verification in minutes. Full API reference, ZK circuit docs, and integration guides.
          </p>
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
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 px-3.5 py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
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
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Rocket className="w-4.5 h-4.5 text-[#00e676]" />
                </div>
                <h2 className="text-2xl font-bold">Quick Start</h2>
              </div>

              <p className="text-white/45 text-sm mb-8 max-w-2xl">
                Get up and running with StellarID verification in 3 steps. The SDK handles proof validation, credential checking, and on-chain verification automatically.
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
                    <CodeBlock code={s.code} lang={s.step === '01' ? 'bash' : 'typescript'} />
                  </div>
                ))}
              </div>
            </section>

            {/* === CORE CONCEPTS === */}
            <section id="concepts">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                  <Layers className="w-4.5 h-4.5 text-[#7c3aed]" />
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
                  <GitBranch className="w-4.5 h-4.5 text-[#a855f7]" />
                </div>
                <h2 className="text-2xl font-bold">Architecture</h2>
              </div>

              <p className="text-white/45 text-sm mb-6 max-w-2xl">
                StellarID uses a three-layer architecture separating client-side operations, API logic, and blockchain interactions.
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

              <div className="mt-6">
                <CodeBlock
                  lang="text"
                  code={`┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js Client    │────▶│   Express API    │────▶│  Stellar Chain  │
│  (ZK Proof Gen)     │     │  (Verify + Issue) │     │  (NFT + Revoke) │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
         │                          │                         │
         ▼                          ▼                         ▼
   snarkjs + Circom           PostgreSQL + Redis        Soroban Contracts`}
                />
              </div>
            </section>

            {/* === API REFERENCE === */}
            <section id="api">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Code2 className="w-4.5 h-4.5 text-[#00e676]" />
                </div>
                <h2 className="text-2xl font-bold">API Reference</h2>
              </div>

              <p className="text-white/45 text-sm mb-6">
                Base URL: <code className="text-[#00e676] bg-[#00e676]/8 px-2 py-0.5 rounded text-xs font-mono">https://api.stellarid.com/api/v1</code>
              </p>

              <div className="rounded-2xl glass overflow-hidden border border-white/8">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">Method</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">Endpoint</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">Description</th>
                        <th className="text-left px-5 py-3.5 font-semibold text-white/60 text-xs uppercase tracking-wider">Auth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiEndpoints.map((ep) => (
                        <tr key={ep.path + ep.method} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold tracking-wide ${
                              ep.method === 'GET'
                                ? 'bg-emerald-500/12 text-emerald-400'
                                : 'bg-blue-500/12 text-blue-400'
                            }`}>
                              {ep.method}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-white/55 text-xs">{ep.path}</td>
                          <td className="px-5 py-3 text-white/40 text-xs">{ep.desc}</td>
                          <td className="px-5 py-3">
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

              {/* Example Request */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/60 mb-3">Example: Verify a Proof</h3>
                <CodeBlock
                  lang="bash"
                  code={`curl -X POST https://api.stellarid.com/api/v1/verify \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sk_live_abc123" \\
  -d '{
    "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
    "publicSignals": ["1"],
    "credentialId": "cred_abc123",
    "circuitType": "age_check"
  }'`}
                />
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-white/60 mb-3">Response</h3>
                  <CodeBlock
                    lang="json"
                    code={`{
  "valid": true,
  "claim": "age_over_18",
  "dataExposed": "none",
  "verifiedAt": "2026-03-19T14:22:00Z",
  "txHash": "abc123...def456"
}`}
                  />
                </div>
              </div>
            </section>

            {/* === ZK CIRCUITS === */}
            <section id="circuits">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#4ade80]/10 flex items-center justify-center">
                  <FileCode className="w-4.5 h-4.5 text-[#4ade80]" />
                </div>
                <h2 className="text-2xl font-bold">ZK Circuits</h2>
              </div>

              <p className="text-white/45 text-sm mb-6 max-w-2xl">
                StellarID includes 4 pre-built Circom circuits. All circuits use Poseidon hashing and Groth16 proving.
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

# Generate proving key
snarkjs groth16 setup build/age_check.r1cs pot12_final.ptau age_check_0000.zkey

# Export verification key
snarkjs zkey export verificationkey age_check_0000.zkey verification_key.json`}
              />
            </section>

            {/* Bottom CTA */}
            <div className="rounded-2xl glass p-8 text-center border border-[#00e676]/15">
              <h3 className="text-xl font-bold mb-2">Ready to integrate?</h3>
              <p className="text-sm text-white/40 mb-5">Start building with StellarID in under 5 minutes.</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] text-[#0a0a1a] font-semibold text-sm hover:shadow-lg hover:shadow-[#00e676]/30 transition-all"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/15 text-white/60 font-medium text-sm hover:bg-white/5 hover:text-white transition-all"
                >
                  View Source <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
