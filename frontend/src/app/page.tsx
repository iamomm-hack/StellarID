'use client';

import {
  Shield, ArrowRight, Fingerprint, Lock, CheckCircle2,
  Coins, Users, ShoppingBag, Building2, User, Briefcase,
  AlertTriangle, ShieldCheck, Zap
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                          bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px]
                          bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass
                            text-xs text-indigo-300 mb-8">
              <Zap className="w-3 h-3" />
              Powered by Stellar Blockchain & Zero-Knowledge Proofs
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
              Prove who you are.{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400
                               bg-clip-text text-transparent">
                Reveal nothing.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              Verify once. Use everywhere. Your data never leaves your device.
              StellarID uses zero-knowledge proofs to prove claims about your identity
              without revealing the underlying data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/dashboard"
                className="group flex items-center gap-2 px-8 py-3.5 rounded-xl
                           bg-gradient-to-r from-indigo-600 to-purple-600
                           hover:from-indigo-500 hover:to-purple-500
                           text-white font-semibold transition-all duration-300
                           hover:shadow-xl hover:shadow-indigo-500/25 hover:scale-[1.02]
                           active:scale-95"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl glass glass-hover
                           text-white/80 font-medium transition-all duration-300"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Floating cards animation */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-3xl mx-auto opacity-60">
            <div className="rounded-xl glass p-4 animate-float" style={{ animationDelay: '0s' }}>
              <Shield className="w-6 h-6 text-indigo-400 mb-2" />
              <p className="text-xs text-white/60">ZK Proof Generated</p>
              <p className="text-sm text-white font-medium mt-1">Age ≥ 21 ✓</p>
            </div>
            <div className="rounded-xl glass p-4 animate-float" style={{ animationDelay: '0.5s' }}>
              <Fingerprint className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-xs text-white/60">Credential Minted</p>
              <p className="text-sm text-white font-medium mt-1">NFT #4829</p>
            </div>
            <div className="rounded-xl glass p-4 animate-float" style={{ animationDelay: '1s' }}>
              <Lock className="w-6 h-6 text-emerald-400 mb-2" />
              <p className="text-xs text-white/60">Zero Data Leaked</p>
              <p className="text-sm text-white font-medium mt-1">0 bytes sent</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Identity verification is{' '}
              <span className="text-red-400">broken</span>
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Traditional KYC requires uploading sensitive documents to every service.
              StellarID fixes this.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl glass p-6 border-red-500/20 border">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-red-300">Before StellarID</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li>📄 Upload passport 10+ times</li>
                <li>🔓 Data breaches everywhere</li>
                <li>🚫 Zero control over your data</li>
                <li>⏳ Days for verification</li>
              </ul>
            </div>

            <div className="rounded-2xl flex items-center justify-center">
              <ArrowRight className="w-10 h-10 text-indigo-400 hidden md:block" />
              <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent
                              via-indigo-500/50 to-transparent" />
            </div>

            <div className="rounded-2xl glass p-6 border-emerald-500/20 border">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="font-semibold text-lg mb-2 text-emerald-300">After StellarID</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li>✅ Verify once, prove everywhere</li>
                <li>🔒 Zero-knowledge proofs</li>
                <li>🎮 Full control of your data</li>
                <li>⚡ Instant verification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-white/50 max-w-xl mx-auto">Three simple steps to private identity verification</p>
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
              <div key={item.step} className="relative rounded-2xl glass p-6 group
                                             hover:border-indigo-500/20 transition-all duration-500">
                <span className="text-6xl font-bold text-white/5 absolute top-4 right-6">
                  {item.step}
                </span>
                <item.icon className="w-10 h-10 text-indigo-400 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for every use case</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              From DeFi to DAOs, StellarID enables private verification everywhere
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-2xl glass p-6 hover:border-indigo-500/20
                           transition-all duration-300 group cursor-default"
              >
                <useCase.icon className="w-8 h-8 text-indigo-400 mb-3
                                        group-hover:text-purple-400 transition-colors" />
                <h3 className="font-semibold mb-1.5">{useCase.title}</h3>
                <p className="text-sm text-white/50">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl glass p-8 text-center border-red-500/10 border">
              <p className="text-4xl font-bold text-red-400 mb-2">147M</p>
              <p className="text-white/50 text-sm">Records leaked in the Equifax breach alone</p>
            </div>
            <div className="rounded-2xl glass p-8 text-center border-emerald-500/10 border">
              <p className="text-4xl font-bold text-emerald-400 mb-2">0</p>
              <p className="text-white/50 text-sm">Personal data stored by StellarID</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stop uploading your passport to strangers
          </h2>
          <p className="text-white/50 mb-8 text-lg">
            Verify once. Prove everywhere. Your data never leaves your device.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
                       bg-gradient-to-r from-indigo-600 to-purple-600
                       hover:from-indigo-500 hover:to-purple-500
                       text-white font-semibold transition-all duration-300
                       hover:shadow-xl hover:shadow-indigo-500/25"
          >
            Launch App <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center
                        justify-between text-xs text-white/30">
          <p>© 2024 StellarID. Built on Stellar.</p>
          <p>Zero-knowledge proofs. Maximum privacy.</p>
        </div>
      </footer>
    </div>
  );
}
