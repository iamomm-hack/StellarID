'use client';

import {
  Shield,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
  Lock,
  Eye,
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
    <div
      className="min-h-screen text-white relative overflow-x-hidden"
      style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}
    >
      {/* Background orbs */}
      <div className="absolute top-[-80px] left-[10%] w-[320px] h-[320px] rounded-full bg-[#7c3aed]/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[280px] h-[280px] rounded-full bg-[#9333ea]/15 blur-[90px] pointer-events-none" />

      <section className="py-24 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-sm text-white/70 mb-6">
              <Layers className="w-4 h-4 text-[#00e676]" />
              <span>Simple 3-Step Process</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-5">
              How{' '}
              <span className="bg-gradient-to-r from-[#00e676] via-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
                StellarID
              </span>{' '}
              Works
            </h1>
            <p className="text-lg text-white/45 max-w-2xl mx-auto">
              From verification to proof generation — your identity stays private at every step.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-2xl glass p-8 sm:p-10 group hover:border-[#7c3aed]/30 transition-all duration-500"
              >
                <span className="text-8xl font-black text-white/[0.03] absolute top-4 right-6 select-none">
                  {item.step}
                </span>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0a5530] to-[#0d6b3e] border border-[#00e676]/25 flex items-center justify-center shrink-0">
                    <item.icon className="w-7 h-7 text-[#00e676]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                    <p className="text-base text-white/60 mb-3">{item.desc}</p>
                    <p className="text-sm text-white/35 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <ArrowRight className="w-5 h-5 text-[#7c3aed]/50 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <a
              href="/dashboard"
              className="btn-green-glow inline-flex items-center gap-2 group"
            >
              Try It Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
