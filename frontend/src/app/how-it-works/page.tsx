'use client';

import {
  Shield,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: CheckCircle2,
    title: 'Get Verified',
    desc: 'Connect your wallet and get verified by a trusted issuer like GitHub, a university, or a KYC provider.',
    detail: 'StellarID partners with trusted issuers who verify your real-world credentials. You connect your Stellar wallet, submit your claim, and the issuer validates it — all without storing your raw data on-chain.',
  },
  {
    step: '02',
    icon: Fingerprint,
    title: 'Receive NFT Credential',
    desc: 'Your verified claim is minted as an NFT on Stellar. The underlying data stays encrypted and private.',
    detail: 'Once verified, a non-transferable NFT credential is minted to your wallet on the Stellar blockchain. This NFT contains only a cryptographic commitment — your actual identity data never touches the blockchain.',
  },
  {
    step: '03',
    icon: Shield,
    title: 'Prove with ZK Proofs',
    desc: 'Generate zero-knowledge proofs to prove claims to any platform. They learn YES/NO — nothing else.',
    detail: 'When a platform requests verification, you generate a zero-knowledge proof locally on your device. The platform receives a mathematical guarantee of your claim — without learning anything about your underlying data.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>
      <section className="py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="mb-20 reveal-wrap">
            <div className="reveal-content delay-1">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] mb-4"
                    style={{ color: 'var(--color-accent)' }}>
                // Protocol Overview
              </span>
              <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(2rem, 8vw, 5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
                How It<br />
                <span className="outline-text">Works</span>
              </h1>
              <p className="text-[var(--color-text-muted)] max-w-2xl mt-6">
                From verification to proof generation — your identity stays private at every step.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {steps.map((item, idx) => (
              <div key={item.step} className="brutal-card reveal-wrap">
                <div className="card-header-brutal"
                     style={idx === steps.length - 1 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>Step {item.step}</span>
                  <span>[{item.title.toUpperCase()}]</span>
                </div>
                <div className="card-body-brutal">
                  <div className="reveal-content" style={{ animationDelay: `${0.2 + idx * 0.15}s` }}>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 border border-[#333]"
                           style={{ background: 'var(--color-bg)' }}>
                        <item.icon className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-2 uppercase tracking-wider"
                            style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                          {item.title}
                        </h3>
                        <p className="text-base text-[var(--color-text-main)] mb-3">{item.desc}</p>
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a href="/dashboard">
              <button className="btn-brutal btn-brutal-primary inline-flex items-center gap-2">
                Try It Now <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
