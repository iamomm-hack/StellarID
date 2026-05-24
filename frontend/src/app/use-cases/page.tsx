'use client';

import { motion } from 'framer-motion';
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
    color: '#6366f1',
  },
  {
    icon: Users,
    title: 'DAO Governance',
    desc: 'Prove membership tier for weighted voting rights',
    detail: 'Verify contributor status, token holdings, or membership level for governance voting without revealing wallet balances or personal identity.',
    tag: 'GOVERNANCE',
    color: '#a855f7',
  },
  {
    icon: ShoppingBag,
    title: 'NFT Marketplace',
    desc: 'Age-gate premium collections with ZK proofs',
    detail: 'Restrict access to age-gated or region-locked NFT collections with cryptographic proof — no document uploads needed.',
    tag: 'MARKETPLACE',
    color: '#fcd34d',
  },
  {
    icon: Building2,
    title: 'Crypto Exchange',
    desc: 'Verify accredited investor status privately',
    detail: 'Meet regulatory requirements for accredited investor verification while keeping financial details private from the exchange.',
    tag: 'EXCHANGE',
    color: '#6366f1',
  },
  {
    icon: User,
    title: 'Age-gated Services',
    desc: 'Prove 18+ or 21+ without sharing birthdate',
    detail: 'Cryptographically prove you meet an age threshold without revealing your actual date of birth or any other personal information.',
    tag: 'IDENTITY',
    color: '#a855f7',
  },
  {
    icon: Briefcase,
    title: 'Freelance Platforms',
    desc: 'Verify skills and credentials to win contracts',
    detail: 'Prove certifications, degrees, or professional experience to clients without exposing the underlying documents or personal details.',
    tag: 'WORKFORCE',
    color: '#fcd34d',
  },
];

export default function UseCasesPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <section className="py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="mb-20"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [.23,1,.32,1] }}
              className="tag-green mb-4 block w-fit"
            >
              Deployment Vectors
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [.23,1,.32,1] }}
              className="text-display font-display"
            >
              Use<br />
              <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #a855f7, #fcd34d)' }}>Cases</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [.23,1,.32,1] }}
              className="text-muted max-w-2xl mt-6 text-lg leading-relaxed"
            >
              From DeFi to DAOs, StellarID enables private identity verification everywhere.
            </motion.p>
          </motion.div>

          {/* Use Case Cards — Liquid Glass Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: [.23,1,.32,1] }}
                className="protocol-panel p-8 group hover:border-white/[0.12] transition-all duration-300"
              >
                {/* Tag */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-muted">
                    {useCase.tag}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: useCase.color }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Icon */}
                <div className="liquid-glass w-12 h-12 rounded-xl flex items-center justify-center mb-5">
                  <useCase.icon className="w-6 h-6" style={{ color: useCase.color }} />
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-bold mb-2 text-foreground">
                  {useCase.title}
                </h3>
                <p className="text-sm text-foreground/80 mb-3">{useCase.desc}</p>
                <p className="text-xs text-muted leading-relaxed">{useCase.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a href="/dashboard">
              <button className="btn-stellar inline-flex items-center gap-2">
                Start Verifying <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
