'use client';

import {
  Shield,
  ArrowRight,
  Fingerprint,
  Lock,
  CheckCircle2,
  Coins,
  Users,
  ShoppingBag,
  Building2,
  User,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers,
  Eye,
  Key,
} from 'lucide-react';

const useCases = [
  { icon: Coins, title: 'DeFi Protocols', desc: 'KYC-compliant lending without exposing identity documents' },
  { icon: Users, title: 'DAO Governance', desc: 'Prove membership tier for weighted voting rights' },
  { icon: ShoppingBag, title: 'NFT Marketplace', desc: 'Age-gate premium collections with ZK proofs' },
  { icon: Building2, title: 'Crypto Exchange', desc: 'Verify accredited investor status privately' },
  { icon: User, title: 'Age-gated Services', desc: 'Prove 18+ or 21+ without sharing birthdate' },
  { icon: Briefcase, title: 'Freelance Platforms', desc: 'Verify skills and credentials to win contracts' },
];

export default function Home() {
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden"
         style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pb-8">
        {/* Purple Bokeh Background Orbs */}
        <div className="absolute top-[-80px] left-[10%] w-[320px] h-[320px] rounded-full bg-[#7c3aed]/30 blur-[100px] animate-bokeh pointer-events-none" />
        <div className="absolute top-[15%] right-[5%] w-[250px] h-[250px] rounded-full bg-[#9333ea]/25 blur-[90px] animate-bokeh-2 pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-5%] w-[280px] h-[280px] rounded-full bg-[#6d28d9]/30 blur-[110px] animate-bokeh pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[50%] right-[15%] w-[200px] h-[200px] rounded-full bg-[#a855f7]/20 blur-[80px] animate-bokeh-2 pointer-events-none" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-[-50px] right-[30%] w-[350px] h-[350px] rounded-full bg-[#7c3aed]/20 blur-[120px] animate-bokeh pointer-events-none" style={{ animationDelay: '1s' }} />
        {/* Small bokeh dots */}
        <div className="absolute top-[30%] left-[30%] w-[80px] h-[80px] rounded-full bg-[#a855f7]/35 blur-[40px] animate-bokeh-2 pointer-events-none" />
        <div className="absolute top-[20%] right-[25%] w-[60px] h-[60px] rounded-full bg-[#7c3aed]/40 blur-[30px] animate-bokeh pointer-events-none" style={{ animationDelay: '4s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid opacity-30" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-sm text-white/80 mb-10 backdrop-blur-sm">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#00e676] flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium">StellarID Protocol</span>
            <span className="text-[#00e676] font-semibold ml-1">Certified</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.05] mb-6 text-white">
            Decentralized<br />
            <span className="bg-gradient-to-r from-[#00e676] via-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">Identity</span>{' '}
            Verification
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/55 max-w-2xl mx-auto mb-10 font-medium">
            Designed for Privacy-First Applications
          </p>

          {/* Feature badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 max-w-3xl mx-auto flex-wrap">
            <div className="feature-badge inline-flex items-center gap-2.5 text-sm text-white/80">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#00e676] flex-shrink-0" />
              <span>Zero-Knowledge Proofs</span>
              <span className="text-white/30">|</span>
              <span>Stellar Blockchain</span>
              <span className="text-white/30">|</span>
              <span>NFT Credentials + 10 more</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 max-w-3xl mx-auto flex-wrap">
            <div className="feature-badge inline-flex items-center gap-2.5 text-sm text-white/80">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#00e676] flex-shrink-0" />
              <span>Trusted by 500+ platforms for private identity verification</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <a
              href="/dashboard"
              className="btn-green-glow inline-flex items-center gap-2 group"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Tagline */}
          <p className="text-[#00e676] text-base italic font-medium">
            New era of privacy starting now
          </p>
        </div>

        {/* 3D Platform Stack Decoration */}
        <div className="relative z-10 w-full max-w-lg mx-auto mt-4 mb-0 px-8">
          <div className="platform-stack relative mx-auto" style={{ height: '220px' }}>
            {/* Glow behind */}
            <div className="absolute inset-0 bg-[#00e676]/10 blur-[60px] rounded-full" />

            {/* Bottom Layer */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[55px] platform-layer opacity-60"
                 style={{ transform: 'translateX(-50%) rotateX(55deg) rotateZ(-25deg)' }} />

            {/* Middle Layer */}
            <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-[260px] h-[55px] platform-layer opacity-80 animate-float"
                 style={{ animationDelay: '0.5s', transform: 'translateX(-50%) rotateX(50deg) rotateZ(-25deg)' }}>
              {/* Chain link decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Key className="w-6 h-6 text-[#00e676]/50" />
              </div>
            </div>

            {/* Top Layer with icon */}
            <div className="absolute bottom-[60px] left-1/2 -translate-x-1/2 w-[240px] h-[55px] platform-layer animate-float animate-glow-pulse"
                 style={{ transform: 'translateX(-50%) rotateX(45deg) rotateZ(-25deg)' }}>
              <div className="absolute top-[-28px] left-1/2 -translate-x-1/2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0a5530] to-[#0d6b3e] border border-[#00e676]/30 flex items-center justify-center shadow-lg shadow-[#00e676]/20">
                  <Shield className="w-7 h-7 text-[#00e676]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="py-24 relative">
        <div className="absolute top-0 left-[20%] w-[200px] h-[200px] rounded-full bg-[#7c3aed]/15 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Identity verification is <span className="text-red-400">broken</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Traditional KYC requires uploading sensitive documents to every service.
              StellarID fixes this.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl glass p-6 border-red-500/20 border">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-red-300">Before StellarID</h3>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Upload passport 10+ times</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Data breaches everywhere</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Zero control over your data</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Days for verification</li>
              </ul>
            </div>

            <div className="rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-10 h-10 text-[#7c3aed] hidden md:block" />
              <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-[#7c3aed]/50 to-transparent" />
            </div>

            <div className="rounded-2xl glass p-6 border-emerald-500/20 border">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-emerald-300">After StellarID</h3>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verify once, prove everywhere</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero-knowledge proofs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full control of your data</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant verification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 relative border-t border-white/5">
        <div className="absolute bottom-0 right-[10%] w-[250px] h-[250px] rounded-full bg-[#9333ea]/15 blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-white/40 max-w-xl mx-auto">Three simple steps to private identity verification</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: CheckCircle2,
                title: 'Get Verified',
                desc: 'Connect your wallet and get verified by a trusted issuer like GitHub, a university, or a KYC provider.',
              },
              {
                step: '02',
                icon: Fingerprint,
                title: 'Receive NFT Credential',
                desc: 'Your verified claim is minted as an NFT on Stellar. The underlying data stays encrypted and private.',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Prove with ZK Proofs',
                desc: 'Generate zero-knowledge proofs to prove claims to any platform. They learn YES/NO — nothing else.',
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl glass p-6 group hover:border-[#7c3aed]/30 transition-all duration-500">
                <span className="text-6xl font-bold text-white/[0.03] absolute top-4 right-6">{item.step}</span>
                <item.icon className="w-10 h-10 text-[#00e676] mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== USE CASES ===== */}
      <section id="use-cases" className="py-24 relative border-t border-white/5">
        <div className="absolute top-[30%] left-[5%] w-[180px] h-[180px] rounded-full bg-[#7c3aed]/12 blur-[70px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for every use case</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              From DeFi to DAOs, StellarID enables private verification everywhere
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-2xl glass p-6 hover:border-[#7c3aed]/25 transition-all duration-300 group cursor-default"
              >
                <useCase.icon className="w-8 h-8 text-[#00e676] mb-3 group-hover:text-[#4ade80] transition-colors" />
                <h3 className="font-semibold mb-1.5">{useCase.title}</h3>
                <p className="text-sm text-white/40">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-24 relative border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl glass p-8 text-center border-red-500/10 border">
              <p className="text-4xl font-bold text-red-400 mb-2">147M</p>
              <p className="text-white/40 text-sm">Records leaked in the Equifax breach alone</p>
            </div>
            <div className="rounded-2xl glass p-8 text-center border-emerald-500/10 border">
              <p className="text-4xl font-bold text-emerald-400 mb-2">0</p>
              <p className="text-white/40 text-sm">Personal data stored by StellarID</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[#7c3aed]/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Stop uploading your passport to strangers</h2>
          <p className="text-white/40 mb-8 text-lg">
            Verify once. Prove everywhere. Your data never leaves your device.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                       bg-gradient-to-r from-[#7c3aed] to-[#9333ea]
                       text-white font-semibold transition-all duration-300
                       hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
          >
            Launch App <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-white/25">
          <p>© 2026 StellarID. Built on Stellar.</p>
          <p>Zero-knowledge proofs. Maximum privacy.</p>
        </div>
      </footer>
    </div>
  );
}
