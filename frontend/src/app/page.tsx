'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Key,
  Activity,
  Crown,
  X,
} from 'lucide-react';

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-bold">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

const pricingTiers = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'For individuals & testing',
    features: ['100 verifications/mo', '2 credential types', 'Community support', 'Testnet only'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    desc: 'For growing platforms',
    features: ['10,000 verifications/mo', 'All credential types', 'Priority support', 'Analytics dashboard', 'Custom branding', 'Mainnet access'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large-scale deployments',
    features: ['Unlimited verifications', 'Dedicated support', 'SLA guarantee', 'On-premise option', 'White-label solution', 'Custom integrations'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen text-white relative overflow-x-hidden"
         style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pb-8">
        {/* Subtle Bokeh */}
        <div className="absolute top-[-60px] left-[15%] w-[300px] h-[300px] rounded-full bg-[#7c3aed]/25 blur-[120px] animate-bokeh pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#9333ea]/20 blur-[100px] animate-bokeh-2 pointer-events-none" />
        <div className="absolute top-[40%] left-[-3%] w-[200px] h-[200px] rounded-full bg-[#6d28d9]/20 blur-[90px] animate-bokeh pointer-events-none" style={{ animationDelay: '2s' }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid opacity-20" />

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
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            <div className="feature-badge inline-flex items-center gap-2.5 text-sm text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#00e676] flex-shrink-0" />
              <span>ZK Proofs</span>
              <span className="text-white/20">·</span>
              <span>Stellar Blockchain</span>
              <span className="text-white/20">·</span>
              <span>NFT Credentials</span>
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
            <div className="absolute inset-0 bg-[#00e676]/10 blur-[60px] rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[280px] h-[55px] platform-layer opacity-60"
                 style={{ transform: 'translateX(-50%) rotateX(55deg) rotateZ(-25deg)' }} />
            <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 w-[260px] h-[55px] platform-layer opacity-80 animate-float"
                 style={{ animationDelay: '0.5s', transform: 'translateX(-50%) rotateX(50deg) rotateZ(-25deg)' }}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Key className="w-6 h-6 text-[#00e676]/50" />
              </div>
            </div>
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

      {/* ===== LIVE STATS COUNTER ===== */}
      <section className="py-16 relative border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-1.5">
              <AnimatedCounter target={12847} suffix="+" />
              <p className="text-xs sm:text-sm text-white/40 flex items-center justify-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#00e676]" />
                Verifications
              </p>
            </div>
            <div className="space-y-1.5 border-x border-white/5">
              <AnimatedCounter target={500} suffix="+" />
              <p className="text-xs sm:text-sm text-white/40 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#7c3aed]" />
                Platforms
              </p>
            </div>
            <div className="space-y-1.5">
              <AnimatedCounter target={0} />
              <p className="text-xs sm:text-sm text-white/40 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Data Stored
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Identity verification is <span className="text-red-400">broken</span>
            </h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm">
              Traditional KYC requires uploading sensitive documents to every service. StellarID fixes this.
            </p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10">
            <div className="rounded-2xl glass p-7 border-red-500/20 border">
              <AlertTriangle className="w-7 h-7 text-red-400 mb-3" />
              <h3 className="font-semibold text-base mb-2 text-red-300">Before StellarID</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Upload passport 10+ times</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Data breaches everywhere</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Zero control over your data</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Days for verification</li>
              </ul>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-[#7c3aed]/60 hidden md:block" />
              <div className="md:hidden h-px w-full bg-gradient-to-r from-transparent via-[#7c3aed]/40 to-transparent" />
            </div>

            <div className="rounded-2xl glass p-7 border-emerald-500/20 border">
              <ShieldCheck className="w-7 h-7 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-base mb-2 text-emerald-300">After StellarID</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verify once, prove everywhere</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zero-knowledge proofs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Full control of your data</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant verification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-24 relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#7c3aed]/3 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm">Start free. Scale when you need to.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-6 border transition-all duration-300 relative ${
                  tier.highlight
                    ? 'glass border-[#00e676]/30 shadow-lg shadow-[#00e676]/5 scale-[1.03]'
                    : 'glass border-white/10 hover:border-white/20'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#00e676] text-[#0a0a1a] text-xs font-bold">
                      <Crown className="w-3 h-3" /> Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="font-semibold text-lg">{tier.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{tier.desc}</p>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-white/40 text-sm">{tier.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/55">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${tier.highlight ? 'text-[#00e676]' : 'text-[#7c3aed]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-[#00c853] to-[#00e676] text-[#0a0a1a] hover:shadow-lg hover:shadow-[#00e676]/30'
                      : 'border border-white/15 text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
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
