'use client';

import {
  Coins,
  Users,
  ShoppingBag,
  Building2,
  User,
  Briefcase,
  ArrowRight,
  Zap,
} from 'lucide-react';

const useCases = [
  {
    icon: Coins,
    title: 'DeFi Protocols',
    desc: 'KYC-compliant lending without exposing identity documents',
    detail: 'Enable under-collateralized lending, regulatory-compliant liquidity pools, and credit scoring — all while keeping user identities fully private through ZK proofs.',
  },
  {
    icon: Users,
    title: 'DAO Governance',
    desc: 'Prove membership tier for weighted voting rights',
    detail: 'Verify contributor status, token holdings, or membership level for governance voting without revealing wallet balances or personal identity.',
  },
  {
    icon: ShoppingBag,
    title: 'NFT Marketplace',
    desc: 'Age-gate premium collections with ZK proofs',
    detail: 'Restrict access to age-gated or region-locked NFT collections with cryptographic proof — no document uploads needed.',
  },
  {
    icon: Building2,
    title: 'Crypto Exchange',
    desc: 'Verify accredited investor status privately',
    detail: 'Meet regulatory requirements for accredited investor verification while keeping financial details private from the exchange.',
  },
  {
    icon: User,
    title: 'Age-gated Services',
    desc: 'Prove 18+ or 21+ without sharing birthdate',
    detail: 'Cryptographically prove you meet an age threshold without revealing your actual date of birth or any other personal information.',
  },
  {
    icon: Briefcase,
    title: 'Freelance Platforms',
    desc: 'Verify skills and credentials to win contracts',
    detail: 'Prove certifications, degrees, or professional experience to clients without exposing the underlying documents or personal details.',
  },
];

export default function UseCasesPage() {
  return (
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute top-[15%] right-[5%] w-[250px] h-[250px] rounded-full bg-[#9333ea]/20 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[30%] left-[-5%] w-[280px] h-[280px] rounded-full bg-[#6d28d9]/20 blur-[110px] pointer-events-none" />

      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-sm text-white/70 mb-6">
              <Zap className="w-4 h-4 text-[#00e676]" />
              <span>Built For Every Industry</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              Use{' '}
              <span className="bg-gradient-to-r from-[#00e676] via-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
                Cases
              </span>
            </h1>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              From DeFi to DAOs, StellarID enables private identity verification everywhere.
            </p>
          </div>

          {/* Use Case Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-2xl glass p-7 hover:border-[#7c3aed]/25 transition-all duration-300 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a5530] to-[#0d6b3e] border border-[#00e676]/25 flex items-center justify-center mb-4">
                  <useCase.icon className="w-6 h-6 text-[#00e676] group-hover:text-[#4ade80] transition-colors" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{useCase.title}</h3>
                <p className="text-sm text-white/55 mb-3">{useCase.desc}</p>
                <p className="text-xs text-white/30 leading-relaxed">{useCase.detail}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a
              href="/dashboard"
              className="btn-green-glow inline-flex items-center gap-2 group"
            >
              Start Verifying
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
