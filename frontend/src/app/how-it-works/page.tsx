'use client';

import { motion, Variants } from 'framer-motion';
import {
  Shield,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [.23, 1, .32, 1] as const }
  })
};

const steps = [
  {
    step: '01',
    icon: CheckCircle2,
    title: 'Get Verified',
    desc: 'Connect your wallet and get verified by a trusted issuer like GitHub, a university, or a KYC provider.',
    detail: 'StellarID partners with trusted issuers who verify your real-world credentials. You connect your Stellar wallet, submit your claim, and the issuer validates it — all without storing your raw data on-chain.',
    color: '#6366f1',
  },
  {
    step: '02',
    icon: Fingerprint,
    title: 'Receive NFT Credential',
    desc: 'Your verified claim is minted as an NFT on Stellar. The underlying data stays encrypted and private.',
    detail: 'Once verified, a non-transferable NFT credential is minted to your wallet on the Stellar blockchain. This NFT contains only a cryptographic commitment — your actual identity data never touches the blockchain.',
    color: '#a855f7',
  },
  {
    step: '03',
    icon: Shield,
    title: 'Prove with ZK Proofs',
    desc: 'Generate zero-knowledge proofs to prove claims to any platform. They learn YES/NO — nothing else.',
    detail: 'When a platform requests verification, you generate a zero-knowledge proof locally on your device. The platform receives a mathematical guarantee of your claim — without learning anything about your underlying data.',
    color: '#fcd34d',
  },
];

export default function HowItWorksPage() {
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
            <motion.span variants={fadeUp} custom={0} className="tag-orange mb-4 block w-fit">
              Protocol Overview
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="text-display font-display">
              How It<br />
              <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)' }}>Works</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted max-w-2xl mt-6 text-lg leading-relaxed">
              From verification to proof generation — your identity stays private at every step.
            </motion.p>
          </motion.div>

          {/* Steps List (Rectangles) */}
          <div className="space-y-0">
            {steps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.12, ease: [.23, 1, .32, 1] }}
                className="relative p-10 border-b group hover:bg-white/[0.01] transition-all duration-500 overflow-hidden"
                style={{
                  borderColor: 'var(--border)',
                  '--step-color': item.color,
                  '--step-color-bg': `${item.color}0d`, // ~5% opacity
                } as React.CSSProperties}
              >
                {/* Background Glow */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-[var(--step-color-bg)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                />

                <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <span className="text-[13px] font-mono font-bold transition-all duration-500 group-hover:scale-110" style={{ color: item.color }}>
                      {item.step}
                    </span>
                    <div className="liquid-glass w-14 h-14 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500"
                      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }}
                    >
                      <item.icon className="w-7 h-7 transition-transform duration-500 group-hover:rotate-6" style={{ color: item.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2 text-foreground group-hover:translate-x-1 transition-transform duration-500">
                      {item.title}<span style={{ color: item.color }}>.</span>
                    </h3>
                    <p className="text-base text-foreground/80 mb-3">{item.desc}</p>
                    <p className="text-sm text-muted leading-relaxed">{item.detail}</p>
                  </div>
                </div>

                {/* Bottom border glow accent on hover */}
                <div 
                  className="absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `linear-gradient(90deg, transparent, var(--step-color), transparent)` }}
                />
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a href="/dashboard">
              <button className="btn-stellar inline-flex items-center gap-2">
                Try It Now <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
