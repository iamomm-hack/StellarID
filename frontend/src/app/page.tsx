'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Activity,
  Eye,
  Lock,
  Fingerprint,
  Code2,
  Globe,
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
    <div ref={ref} className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

const features = [
  {
    icon: Fingerprint,
    title: 'NFT Credentials',
    desc: 'Non-transferable NFTs on Stellar. Your identity, on-chain. No raw data stored.',
    tag: 'IDENTITY',
  },
  {
    icon: Shield,
    title: 'ZK Proofs',
    desc: 'Groth16 zero-knowledge proofs generated locally. Your data never leaves your device.',
    tag: 'PRIVACY',
  },
  {
    icon: Eye,
    title: 'Selective Disclosure',
    desc: 'Prove you\'re 18+ without revealing your birthday. Prove income without exact amounts.',
    tag: 'CONTROL',
  },
  {
    icon: Lock,
    title: 'Privacy by Design',
    desc: 'Zero personal data on-chain. Only cryptographic commitments via Poseidon hashing.',
    tag: 'SECURITY',
  },
  {
    icon: Code2,
    title: 'Developer API',
    desc: 'Full REST API. OAuth integrations. Integrate verification into any platform in minutes.',
    tag: 'DEVTOOLS',
  },
  {
    icon: Globe,
    title: 'Fee Sponsorship',
    desc: 'Gasless transactions. Users never pay XLM. StellarID sponsors all minting costs.',
    tag: 'UX',
  },
];

const pricingTiers = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'For individuals & testing',
    features: ['100 verifications/mo', '2 credential types', 'Community support', 'Testnet only'],
    cta: 'Initialize',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/mo',
    desc: 'For growing platforms',
    features: ['10,000 verifications/mo', 'All credential types', 'Priority support', 'Analytics dashboard', 'Custom branding', 'Mainnet access'],
    cta: 'Deploy',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large-scale deployments',
    features: ['Unlimited verifications', 'Dedicated support', 'SLA guarantee', 'On-premise option', 'White-label solution', 'Custom integrations'],
    cta: 'Contact',
    highlight: false,
  },
];

export default function Home() {
  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const hero = document.querySelector('.hero-title') as HTMLElement;
      if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.15}px)`;
        hero.style.opacity = String(Math.max(0, 1 - scrolled / 800));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* ===== HERO SECTION ===== */}
      <section className="relative py-20 sm:py-28 lg:py-36">
        {/* Accent glow effect */}
        <div className="absolute top-[20%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,60,0,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(212,255,0,0.05) 0%, transparent 70%)' }} />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="reveal-wrap">
            <div className="reveal-content delay-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2" style={{ background: 'var(--color-highlight)', animation: 'pulse-accent 2s ease-in-out infinite' }} />
                <span className="text-xs font-bold uppercase tracking-[0.25em]"
                      style={{ color: 'var(--color-accent)' }}>
                  {'// System Ready — Protocol V2.0'}
                </span>
              </div>

              <h1 className="hero-title mb-6"
                  style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(2.8rem, 11vw, 8rem)', lineHeight: 0.85, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
                Decentralized<br />
                <span className="outline-text">Identity</span>
              </h1>

              <div className="max-w-2xl">
                <p className="text-lg sm:text-xl mb-2" style={{ color: 'var(--color-text-main)' }}>
                  This protocol rejects convention.
                </p>
                <p className="mb-8" style={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                  <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Zero-knowledge proofs</span> protect your
                  identity. Raw data stays with you. Prove who you are — reveal nothing else.
                  Built on <span style={{ color: 'var(--color-highlight)' }}>Stellar blockchain</span> for speed, security, and sovereignty.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 mb-8">
                <a href="/dashboard">
                  <button className="btn-brutal btn-brutal-primary inline-flex items-center gap-2">
                    Initialize <ArrowRight className="w-4 h-4" />
                  </button>
                </a>
                <a href="/docs">
                  <button className="btn-brutal btn-brutal-outline inline-flex items-center gap-2">
                    Read Docs
                  </button>
                </a>
              </div>

              <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5" style={{ background: 'var(--color-highlight)' }} />
                  Open Source
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5" style={{ background: 'var(--color-highlight)' }} />
                  Gasless TX
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5" style={{ background: 'var(--color-highlight)' }} />
                  Client-side ZK
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LIVE STATS COUNTER ===== */}
      <section className="py-16 relative border-t border-b border-[#222]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <AnimatedCounter target={12847} suffix="+" />
              <p className="counter-tag flex items-center justify-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Verifications
              </p>
            </div>
            <div className="space-y-2 sm:border-x border-[#222]">
              <AnimatedCounter target={500} suffix="+" />
              <p className="counter-tag flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Platforms
              </p>
            </div>
            <div className="space-y-2">
              <AnimatedCounter target={0} />
              <p className="counter-tag flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Data Stored
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS - 3 STEP ===== */}
      <section className="py-24 relative">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] mb-3 block"
                  style={{ color: 'var(--color-accent)' }}>
              {'// How It Works'}
            </span>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Three Steps to <span style={{ color: 'var(--color-accent)' }}>Privacy</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {[
              { step: '01', title: 'Get Verified', desc: 'Connect wallet. Link GitHub or LinkedIn. Issuer verifies your identity and mints an NFT credential.', icon: CheckCircle2 },
              { step: '02', title: 'Generate Proof', desc: 'Select a claim. ZK proof is generated locally on your device. Your raw data never leaves.', icon: Zap },
              { step: '03', title: 'Share & Verify', desc: 'Share a verification link. Platform gets YES/NO — zero personal data transmitted.', icon: ShieldCheck },
            ].map((item, idx) => (
              <div key={item.step} className="brutal-card">
                <div className="card-header-brutal"
                     style={idx === 2 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>Step {item.step}</span>
                  <span>[{item.title.toUpperCase()}]</span>
                </div>
                <div className="card-body-brutal">
                  <div className="w-12 h-12 flex items-center justify-center border border-[#333] mb-4"
                       style={{ background: 'var(--color-bg)' }}>
                    <item.icon className="w-6 h-6" style={{ color: idx === 2 ? 'var(--color-highlight)' : 'var(--color-accent)' }} />
                  </div>
                  <h3 className="font-bold text-base mb-2 uppercase tracking-wider"
                      style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff', fontSize: '0.9rem' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 relative border-t border-[#222]">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] mb-3 block"
                  style={{ color: 'var(--color-accent)' }}>
              {'// Core Modules'}
            </span>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Built <span className="outline-text">Different</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
            {features.map((feat, idx) => (
              <div key={feat.title} className="brutal-card">
                <div className="card-header-brutal"
                     style={idx % 3 === 1 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>Module: {String(idx + 1).padStart(2, '0')}</span>
                  <span>[{feat.tag}]</span>
                </div>
                <div className="card-body-brutal">
                  <div className="w-10 h-10 flex items-center justify-center border border-[#333] mb-3"
                       style={{ background: 'var(--color-bg)' }}>
                    <feat.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-white">{feat.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="py-24 relative border-t border-[#222]">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] mb-3 block"
                  style={{ color: 'var(--color-accent)' }}>
              {'// The Problem'}
            </span>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Identity is <span style={{ color: 'var(--color-accent)' }}>Broken</span>
            </h2>
            <p className="text-[var(--color-text-muted)] max-w-lg mx-auto text-sm mt-4">
              Traditional KYC requires uploading sensitive documents to every service. StellarID fixes this.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            <div className="brutal-card">
              <div className="card-header-brutal">
                <span>Before StellarID</span>
                <span>[BROKEN]</span>
              </div>
              <div className="card-body-brutal">
                <AlertTriangle className="w-7 h-7 mb-3" style={{ color: 'var(--color-accent)' }} />
                <ul className="styled-list">
                  <li>Upload passport 10+ times to different services</li>
                  <li>Data breaches expose millions of identities yearly</li>
                  <li>Zero control over who has your data</li>
                  <li>Days of waiting for manual verification</li>
                </ul>
              </div>
            </div>
            <div className="brutal-card">
              <div className="card-header-brutal" style={{ background: 'var(--color-highlight)', color: 'var(--color-bg)' }}>
                <span>After StellarID</span>
                <span>[ACTIVE]</span>
              </div>
              <div className="card-body-brutal">
                <ShieldCheck className="w-7 h-7 mb-3" style={{ color: 'var(--color-highlight)' }} />
                <ul className="styled-list">
                  <li>Verify once, prove everywhere with ZK proofs</li>
                  <li>Zero data stored on-chain — only commitments</li>
                  <li>Full control — you choose what to reveal</li>
                  <li>Instant verification in under 1 second</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-24 relative border-t border-[#222]">
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] mb-3 block"
                  style={{ color: 'var(--color-accent)' }}>
              {'// Pricing Grid'}
            </span>
            <h2 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 3.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Pricing
            </h2>
            <p className="text-[var(--color-text-muted)] mt-4 text-sm">Start free. Scale when you need to.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-0">
            {pricingTiers.map((tier) => (
              <div key={tier.name} className="brutal-card">
                <div className="card-header-brutal"
                     style={tier.highlight ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>{tier.name}</span>
                  {tier.highlight && <span>[POPULAR]</span>}
                </div>
                <div className="card-body-brutal">
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                      {tier.price}
                    </span>
                    <span className="text-[var(--color-text-muted)] text-sm">{tier.period}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-4">{tier.desc}</p>
                  <ul className="space-y-2 mb-6">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0"
                                      style={{ color: tier.highlight ? 'var(--color-highlight)' : 'var(--color-accent)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full btn-brutal ${tier.highlight ? 'btn-brutal-accent' : 'btn-brutal-outline'}`}>
                    {tier.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-28 relative border-t border-[#222]">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at center, rgba(255,60,0,0.04) 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="mb-6" style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.8rem, 6vw, 3.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
            Stop uploading<br />your passport<br />to <span style={{ color: 'var(--color-accent)' }}>strangers</span>
          </h2>
          <p className="text-[var(--color-text-muted)] mb-10 text-lg max-w-xl mx-auto">
            Verify once. Prove everywhere. Your data never leaves your device.
            Join the new standard for privacy-preserving identity.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href="/dashboard">
              <button className="btn-brutal btn-brutal-primary inline-flex items-center gap-2 text-lg px-8 py-4">
                Launch App <ArrowRight className="w-5 h-5" />
              </button>
            </a>
            <a href="/docs">
              <button className="btn-brutal btn-brutal-outline inline-flex items-center gap-2">
                Read Docs
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
