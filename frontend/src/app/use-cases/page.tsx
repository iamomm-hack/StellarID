'use client';

import {
  Coins,
  Users,
  ShoppingBag,
  Building2,
  User,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

const useCases = [
  {
    icon: Coins,
    title: 'DeFi Protocols',
    desc: 'KYC-compliant lending without exposing identity documents',
    detail: 'Enable under-collateralized lending, regulatory-compliant liquidity pools, and credit scoring — all while keeping user identities fully private through ZK proofs.',
    tag: 'FINANCE',
  },
  {
    icon: Users,
    title: 'DAO Governance',
    desc: 'Prove membership tier for weighted voting rights',
    detail: 'Verify contributor status, token holdings, or membership level for governance voting without revealing wallet balances or personal identity.',
    tag: 'GOVERNANCE',
  },
  {
    icon: ShoppingBag,
    title: 'NFT Marketplace',
    desc: 'Age-gate premium collections with ZK proofs',
    detail: 'Restrict access to age-gated or region-locked NFT collections with cryptographic proof — no document uploads needed.',
    tag: 'MARKETPLACE',
  },
  {
    icon: Building2,
    title: 'Crypto Exchange',
    desc: 'Verify accredited investor status privately',
    detail: 'Meet regulatory requirements for accredited investor verification while keeping financial details private from the exchange.',
    tag: 'EXCHANGE',
  },
  {
    icon: User,
    title: 'Age-gated Services',
    desc: 'Prove 18+ or 21+ without sharing birthdate',
    detail: 'Cryptographically prove you meet an age threshold without revealing your actual date of birth or any other personal information.',
    tag: 'IDENTITY',
  },
  {
    icon: Briefcase,
    title: 'Freelance Platforms',
    desc: 'Verify skills and credentials to win contracts',
    detail: 'Prove certifications, degrees, or professional experience to clients without exposing the underlying documents or personal details.',
    tag: 'WORKFORCE',
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      <section className="py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="mb-20 reveal-wrap">
            <div className="reveal-content delay-1">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] mb-4"
                    style={{ color: 'var(--color-accent)' }}>
                {'// Deployment Vectors'}
              </span>
              <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
                Use<br />
                <span className="outline-text">Cases</span>
              </h1>
              <p className="text-[var(--color-text-muted)] max-w-2xl mt-6">
                From DeFi to DAOs, StellarID enables private identity verification everywhere.
              </p>
            </div>
          </div>

          {/* Use Case Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {useCases.map((useCase, idx) => (
              <div key={useCase.title} className="brutal-card">
                <div className="card-header-brutal"
                     style={idx % 2 === 1 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>Component: {String(idx + 1).padStart(3, '0')}</span>
                  <span>[{useCase.tag}]</span>
                </div>
                <div className="card-body-brutal">
                  <div className="w-12 h-12 flex items-center justify-center border border-[#333] mb-4"
                       style={{ background: 'var(--color-bg)' }}>
                    <useCase.icon className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 uppercase tracking-wider"
                      style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff', fontSize: '0.95rem' }}>
                    {useCase.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-main)] mb-3">{useCase.desc}</p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{useCase.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a href="/dashboard">
              <button className="btn-brutal btn-brutal-primary inline-flex items-center gap-2">
                Start Verifying <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
