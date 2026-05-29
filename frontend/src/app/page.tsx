'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, Variants, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  Shield, Zap, Eye, Lock, Fingerprint, Globe,
  Cpu, Database, ShieldCheck, ArrowDown, AlertTriangle,
  Github, Linkedin, ArrowRight, RefreshCw, ChevronDown
} from 'lucide-react';

// --- INTERACTIVE CARD WITH SPOTLIGHT AND TILT ---
function InteractiveCard({
  children,
  className = '',
  glowColor = '#6366f1',
  delay = 0,
  yOffset = 20,
  duration = 0.6
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
  yOffset?: number;
  duration?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tilt variables
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for tilt
  const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), { damping: 20, stiffness: 200 });
  const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { damping: 20, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(relativeX);
    mouseY.set(relativeY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, delay, ease: [.23, 1, .32, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: tiltX,
        rotateY: tiltY,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className={`relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/10 ${className}`}
    >
      {/* 3D Glass Light spotlight layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, ${glowColor}1c, transparent 80%)`,
        }}
      />
      {/* Dynamic white shine ring around cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isHovered ? 0.6 : 0,
          background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(255, 255, 255, 0.08), transparent 80%)`,
        }}
      />
      <div style={{ transform: 'translateZ(10px)' }} className="relative z-10 h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}

// --- ANIMATION VARIANTS ---
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [.23, 1, .32, 1] as const }
  })
};

// --- MARQUEE KEYWORDS ---
const protocolKeywords = [
  'Proof Everywhere',
  'NFT Credentials',
  'Privacy-First',
  'Verify Once',
  'Protocol v2.0 Live',
  'DECENTRALIZED IDENTITY',
  'Zero Knowledge Proofs',
  'Stellar Blockchain'
];

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- INTEGRATIONS IDENTITY GRAPH STATE ---
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const integrationSectionRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stellarIdNodeRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const updateConnectionsLayout = useCallback(() => {
    if (!integrationSectionRef.current || !stellarIdNodeRef.current) return;
    const sectionRect = integrationSectionRef.current.getBoundingClientRect();
    const nodeRect = stellarIdNodeRef.current.getBoundingClientRect();
    
    const nodeX = nodeRect.left - sectionRect.left + nodeRect.width / 2;
    const nodeY = nodeRect.top - sectionRect.top;

    const newConnections = cardRefs.current.map((card) => {
      if (!card) return null;
      const cardRect = card.getBoundingClientRect();
      return {
        x1: cardRect.left - sectionRect.left + cardRect.width / 2,
        y1: cardRect.top - sectionRect.top + cardRect.height,
        x2: nodeX,
        y2: nodeY
      };
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number }[];

    setConnections(newConnections);
  }, []);

  useEffect(() => {
    updateConnectionsLayout();
    window.addEventListener('resize', updateConnectionsLayout);
    
    let count = 0;
    const check = () => {
      updateConnectionsLayout();
      if (count++ < 15) {
        requestAnimationFrame(check);
      }
    };
    check();

    return () => window.removeEventListener('resize', updateConnectionsLayout);
  }, [updateConnectionsLayout]);

  // --- VIDEO FADE LOOP LOGIC ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;
    let fadeState: 'in' | 'playing' | 'out' | 'waiting' = 'in';
    let fadeStart = 0;
    const FADE_DURATION = 500; // ms
    const FADE_OUT_OFFSET = 0.5; // seconds before end

    const tick = (now: number) => {
      if (!video) return;

      if (fadeState === 'in') {
        if (!fadeStart) fadeStart = now;
        const progress = Math.min((now - fadeStart) / FADE_DURATION, 1);
        video.style.opacity = String(progress);
        if (progress >= 1) {
          fadeState = 'playing';
          fadeStart = 0;
        }
      } else if (fadeState === 'playing') {
        // Check if we're near the end
        if (video.duration && video.currentTime >= video.duration - FADE_OUT_OFFSET) {
          fadeState = 'out';
          fadeStart = now;
        }
      } else if (fadeState === 'out') {
        if (!fadeStart) fadeStart = now;
        const progress = Math.min((now - fadeStart) / FADE_DURATION, 1);
        video.style.opacity = String(1 - progress);
        if (progress >= 1) {
          fadeState = 'waiting';
          fadeStart = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      video.style.opacity = '0';
      fadeState = 'waiting';
      setTimeout(() => {
        video.currentTime = 0;
        fadeState = 'in';
        fadeStart = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    
    // Start playback
    video.style.opacity = '0';
    video.play().then(() => {
      fadeState = 'in';
      rafId = requestAnimationFrame(tick);
    }).catch(() => {});

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);



  return (
    <div ref={mainRef}>
      
      {/* ===== 1. HERO — FULL SCREEN WITH VIDEO ===== */}
      <section className="relative min-h-screen flex flex-col overflow-hidden -mt-[72px] pt-[72px]">
        {/* Background Video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0 }}
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_065045_c44942da-53c6-4804-b734-f9e07fc22e08.mp4"
            muted
            playsInline
            preload="auto"
          />
        </div>

        {/* Blurred overlay shape */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 984,
            height: 527,
            opacity: 0.9,
            background: 'rgb(3, 7, 18)',
            filter: 'blur(82px)',
          }}
        />

        {/* Hero content — Left Aligned Container */}
        <div className="relative z-10 flex-1 flex items-center" style={{ overflow: 'visible' }}>
          <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-24 w-full py-12 flex flex-col items-start text-left">
            
            {/* Top Status Label */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [.23, 1, .32, 1] }}
              className="flex items-center gap-2 mb-6 text-[11px] font-bold tracking-[0.2em] text-[#ff5500]"
            >
              <span className="w-1.5 h-1.5 bg-[#adff2f] rounded-full flex-shrink-0" />
              {/* <span>{"// SYSTEM READY — PROTOCOL V2.0"}</span> */}
            </motion.div>

            {/* Massive Aggressive Typography Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [.23, 1, .32, 1] }}
              className="font-display font-normal uppercase leading-[1.02] tracking-[-0.024em] text-white flex flex-col mb-8"
              style={{ fontSize: 'clamp(50px, 9vw, 130px)' }}
            >
              <span>DECENTRALIZED</span>
              <span 
                style={{ 
                  WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.85)', 
                  color: 'transparent',
                }}
              >
                IDENTITY
              </span>
            </motion.h1>

            {/* Subtext Paragraph */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [.23, 1, .32, 1] }}
              className="max-w-2xl text-hero-sub text-lg leading-relaxed space-y-4 mb-10 opacity-90"
            >
              <p className="text-white font-medium">This protocol rejects convention.</p>
              <p className="leading-relaxed">
                <span className="text-[#ff5500] font-semibold">Zero-knowledge proofs</span> protect your identity. Raw data stays with you. Prove who you are — reveal nothing else. Built on <span className="text-[#adff2f] font-semibold">Stellar blockchain</span> for speed, security, and sovereignty.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: [.23, 1, .32, 1] }}
              className="flex flex-wrap gap-4 mb-14"
            >
              <a href="/dashboard">
                <button className="btn-stellar px-[29px] py-[20px] text-xs uppercase tracking-wider font-bold">
                  INITIALIZE →
                </button>
              </a>
              <a href="/docs">
                <button className="btn-heroSecondary px-[29px] py-[20px] text-xs uppercase tracking-wider font-bold">
                  READ DOCS
                </button>
              </a>
            </motion.div>

            {/* Premium 3D Feature Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 text-[10px] font-mono tracking-[0.2em] text-neutral-400 font-bold"
            >
              <div className="flex items-center gap-2.5">
                <Image src="/open_source_icon.png" alt="Open Source" width={20} height={20} className="object-contain filter drop-shadow-[0_0_8px_rgba(173,255,47,0.4)]" />
                <span>OPEN SOURCE</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Image src="/gasless_icon.png" alt="Gasless TX" width={20} height={20} className="object-contain filter drop-shadow-[0_0_8px_rgba(173,255,47,0.4)]" />
                <span>GASLESS TX</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Image src="/zk_shield_icon.png" alt="Client-Side ZK" width={20} height={20} className="object-contain filter drop-shadow-[0_0_8px_rgba(173,255,47,0.4)]" />
                <span>CLIENT-SIDE ZK</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Logo Marquee — bottom */}
        <div className="relative z-10 pb-10">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center gap-12">
              {/* Left text */}
              <div className="flex-shrink-0 hidden md:block">
                <p className="text-foreground/50 text-sm leading-relaxed">
                  Protocol features<br />&amp; specifications
                </p>
              </div>

              {/* Marquee */}
              <div className="flex-1 overflow-hidden">
                <div className="flex animate-marquee gap-16" style={{ width: 'max-content' }}>
                  {/* Duplicate for seamless loop */}
                  {[...protocolKeywords, ...protocolKeywords].map((keyword, i) => (
                    <div key={`${keyword}-${i}`} className="flex items-center gap-3 flex-shrink-0">
                      <div className="liquid-glass w-[24px] h-[24px] rounded-lg flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-foreground">{keyword[0]}</span>
                      </div>
                      <span className="text-base font-semibold text-foreground whitespace-nowrap">{keyword}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. THE PROBLEM ===== */}
      <section className="py-24 px-6 border-y relative overflow-hidden bg-black/40" style={{ borderColor: 'var(--border)' }}>
        {/* Futuristic tech grid overlay - slightly more visible */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.025)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

        {/* Volumetric Blue Fade Background - Brighter and More Pronounced (Harder Glow) */}
        {/* Large, intense central blue/indigo glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(29,78,216,0.35)_0%,rgba(37,99,235,0.12)_45%,transparent_70%)] blur-[90px] pointer-events-none mix-blend-screen" />
        
        {/* Left deep blue glow */}
        <div className="absolute -left-1/4 top-1/4 w-[700px] h-[700px] rounded-full bg-blue-600/22 blur-[140px] pointer-events-none mix-blend-screen" />
        
        {/* Right bright cyan glow */}
        <div className="absolute -right-1/4 bottom-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/18 blur-[130px] pointer-events-none mix-blend-screen" />

        {/* Extra central core cyan glow behind the header to make text pop */}
        <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-blue-500/15 blur-[80px] pointer-events-none mix-blend-screen" />

        {/* Smooth top and bottom fades to prevent sharp cuts with adjacent sections */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="mb-16"
          >
            <motion.span variants={fadeUp} custom={0} className="tag-orange mb-4 block w-fit">The Problem</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-h-display text-4xl lg:text-6xl max-w-3xl font-display">
              Identity is now a <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #60a5fa, #06b6d4)' }}>liability.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted text-lg mt-6 max-w-xl leading-relaxed">
              Centralized KYC systems turn your most private data into a target.
              Once you upload, you lose control forever.
            </motion.p>
          </motion.div>

          {/* Problem grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: 'Repeated KYC', d: 'Entering the same sensitive data into every new app you join.', i: RefreshCw, color: '#6366f1' },
              { t: 'Data Breaches', d: 'Millions of identities exposed yearly through centralized storage.', i: AlertTriangle, color: '#f43f5e' },
              { t: 'Fragmentation', d: 'Your reputation is trapped inside walled gardens.', i: Fingerprint, color: '#a855f7' },
              { t: 'Privacy Collapse', d: 'Manual verification leaks everything.', i: Lock, color: '#fcd34d' }
            ].map((item, idx) => (
              <InteractiveCard
                key={idx}
                delay={idx * 0.1}
                glowColor={item.color}
                className="p-8 group"
              >
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none" style={{ background: item.color }} />
                
                <div className="relative z-10 w-12 h-12 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-all duration-300" style={{ borderColor: `${item.color}25` }}>
                  <item.i className="w-5 h-5 transition-colors duration-300" style={{ color: item.color }} />
                </div>
                
                <h3 className="relative z-10 text-lg font-bold text-foreground mb-2">{item.t}</h3>
                <p className="relative z-10 text-[13px] text-muted leading-relaxed">{item.d}</p>
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r group-hover:w-full transition-all duration-500 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, ${item.color}, transparent)` }} />
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. HOW IT WORKS ===== */}
      <section className="py-24 px-6 relative overflow-hidden bg-black/20">
        {/* Tech grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Volumetric Blue Fade Background */}
        <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-[850px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(29,78,216,0.25)_0%,rgba(37,99,235,0.08)_40%,transparent_70%)] blur-[90px] pointer-events-none mix-blend-screen" />
        <div className="absolute top-1/3 right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[130px] pointer-events-none mix-blend-screen" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-20"
          >
            <motion.span variants={fadeUp} custom={0} className="tag-green mb-4 block mx-auto w-fit">Protocol Flow</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-h-display text-4xl lg:text-6xl font-display">
              Three steps to <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #00d2ff)' }}>sovereignty.</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 relative">
            {[
              {
                num: '01',
                title: 'Connect',
                desc: 'Link your Stellar wallet and verify through trusted authorities like GitHub or LinkedIn.',
                icon: Globe,
                color: '#6366f1',
              },
              {
                num: '02',
                title: 'Mint',
                desc: 'Issuers mint non-transferable NFT credentials directly to your wallet. Encrypted & immutable.',
                icon: Database,
                color: '#6366f1',
              },
              {
                num: '03',
                title: 'Prove',
                desc: 'Generate Zero-Knowledge Proofs locally. Share the truth without sharing the data.',
                icon: ShieldCheck,
                color: '#fcd34d',
              },
            ].map((step, idx) => (
              <InteractiveCard
                key={step.num}
                delay={idx * 0.12}
                yOffset={30}
                duration={0.7}
                glowColor={step.color}
                className="p-10 lg:p-12 group"
              >
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.06] transition-all duration-300" style={{ borderColor: `${step.color}30` }}>
                    <step.icon className="w-6 h-6 transition-transform duration-500 group-hover:scale-110" style={{ color: step.color }} />
                  </div>
                  <span className="text-5xl font-extrabold tracking-tighter opacity-10 group-hover:opacity-20 transition-opacity duration-300 font-mono" style={{ color: step.color }}>{step.num}</span>
                </div>

                <h3 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-foreground group-hover:translate-x-1 transition-transform duration-500 font-display">
                  {step.title}<span style={{ color: step.color }}>.</span>
                </h3>

                <p className="text-[15px] text-muted leading-relaxed">
                  {step.desc}
                </p>

                {/* Bottom accent line on hover */}
                <div className="absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${step.color}40, transparent)` }}
                />
              </InteractiveCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. FEATURES ===== */}
      <section className="py-24 px-6 border-y relative overflow-hidden bg-black/30" style={{ borderColor: 'var(--border)' }}>
        {/* Tech grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Volumetric Blue Fade Background */}
        <div className="absolute top-1/2 -right-1/4 -translate-y-1/2 w-[900px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(29,78,216,0.3)_0%,rgba(37,99,235,0.1)_45%,transparent_70%)] blur-[95px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-10%] -left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none mix-blend-screen" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left — title */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.span variants={fadeUp} custom={0} className="tag-blue mb-4 block w-fit">Architecture</motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-h-display text-4xl lg:text-5xl mb-6 font-display">
                Your On-Chain <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #60a5fa, #06b6d4)' }}>Reputation</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted text-lg leading-relaxed max-w-md">
                Sovereign tokens on Stellar that define who you are.
                Privacy-first, user-controlled, mathematically verified.
              </motion.p>
            </motion.div>

            {/* Right — feature cards */}
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { t: 'NFT Credentials', d: 'Non-transferable tokens as identity anchors on Stellar.', i: Database },
                { t: 'Gasless UX', d: 'Zero XLM needed. Protocol sponsors all transactions.', i: Globe },
                { t: 'Local Enclave', d: 'Proof generation happens entirely in your browser.', i: Cpu },
                { t: 'Selective Disclosure', d: 'Reveal only what is necessary. Keep the rest private.', i: Eye },
              ].map((f, idx) => (
                <InteractiveCard
                  key={idx}
                  delay={idx * 0.08}
                  duration={0.5}
                  glowColor="#6366f1"
                  className="p-7 group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-indigo-500/20 pointer-events-none" />
                  
                  <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center mb-5 group-hover:bg-white/[0.06] transition-all duration-300" style={{ borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                    <f.i className="w-5 h-5 text-muted transition-colors duration-300" style={{ color: '#6366f1' }} />
                  </div>
                  
                  <h4 className="text-sm font-bold text-foreground mb-2">{f.t}</h4>
                  <p className="text-[12px] text-muted leading-relaxed">{f.d}</p>
                </InteractiveCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 5. INTEGRATIONS ===== */}
      <section className="py-24 px-6 relative overflow-hidden bg-black/10">
        {/* Tech grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        {/* Volumetric Blue Fade Background */}
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[950px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(29,78,216,0.28)_0%,rgba(37,99,235,0.1)_40%,transparent_70%)] blur-[80px] pointer-events-none mix-blend-screen" />
        
        <div ref={integrationSectionRef} className="max-w-[1400px] mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.span variants={fadeUp} custom={0} className="tag-pink mb-4 block mx-auto w-fit">Integrations</motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-h-display text-4xl lg:text-5xl mb-6 font-display">
              Connect your <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #00d2ff)' }}>identity graph.</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted text-lg max-w-xl mx-auto leading-relaxed mb-16">
              Link trusted platforms to build your verifiable reputation layer.
            </motion.p>
          </motion.div>

          {/* Dynamic Identity Graph Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <linearGradient id="glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {connections.map((conn, idx) => {
              const isHovered = hoveredCardIdx === idx;
              const isAnyHovered = hoveredCardIdx !== null;
              
              const dy = conn.y2 - conn.y1;
              const pathData = `M ${conn.x1} ${conn.y1} C ${conn.x1} ${conn.y1 + dy * 0.45} ${conn.x2} ${conn.y2 - dy * 0.45} ${conn.x2} ${conn.y2}`;
              
              const lineOpacity = isHovered ? 0.5 : (isAnyHovered ? 0.05 : 0.12);
              
              return (
                <g key={idx}>
                  {/* Glowing blur underlay for hovered connection line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={isHovered ? 2 : 0}
                    style={{
                      opacity: isHovered ? 0.25 : 0,
                      filter: 'blur(2px)',
                      transition: 'all 0.4s ease'
                    }}
                  />
                  {/* Ultra-thin 1px connection line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#glow-grad)"
                    strokeWidth={1}
                    style={{
                      opacity: lineOpacity,
                      transition: 'all 0.4s ease'
                    }}
                  />
                  {/* Traveling Particles */}
                  <circle r="1" fill="#60a5fa" style={{ opacity: isHovered ? 0.8 : 0.45 }}>
                    <animateMotion
                      path={pathData}
                      dur={isHovered ? "4s" : "9s"}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="1" fill="#06b6d4" style={{ opacity: isHovered ? 0.7 : 0.35 }}>
                    <animateMotion
                      path={pathData}
                      dur={isHovered ? "4s" : "9s"}
                      begin={isHovered ? "2s" : "4.5s"}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap justify-center gap-6 relative z-10">
            {[
              { name: 'GitHub', icon: Github, desc: 'Developer identity & repos', color: '#ffffff' },
              { name: 'LinkedIn', icon: Linkedin, desc: 'Professional credentials', color: '#0077b5' },
              { name: 'Stellar', icon: Shield, desc: 'On-chain anchoring', color: '#6366f1' },
            ].map((int, idx) => (
              <div
                key={idx}
                ref={(el) => { cardRefs.current[idx] = el; }}
                onMouseEnter={() => setHoveredCardIdx(idx)}
                onMouseLeave={() => setHoveredCardIdx(null)}
                className="relative"
              >
                <InteractiveCard
                  delay={idx * 0.1}
                  duration={0.5}
                  glowColor={int.color}
                  className="w-64 h-48 group text-center"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-400 uppercase tracking-wider pointer-events-none">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </div>
                    
                    <div className="absolute -bottom-10 w-24 h-24 rounded-full blur-[50px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" style={{ background: int.color }} />
                    
                    <int.icon className="w-8 h-8 text-muted group-hover:scale-110 group-hover:text-white transition-all duration-300 mb-4" style={{ color: int.color }} />
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{int.name}</h4>
                      <p className="text-[11px] text-muted">{int.desc}</p>
                    </div>
                  </div>
                </InteractiveCard>
              </div>
            ))}
          </div>

          {/* Central Node: StellarID */}
          <div className="mt-16 flex flex-col items-center relative z-10 pointer-events-none">
            {/* Soft, low-opacity radial glow behind StellarID node */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

            <div
              ref={stellarIdNodeRef}
              className="px-5 py-2.5 rounded-full border border-blue-500/20 bg-blue-950/20 backdrop-blur-md flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.06)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
              <span className="text-[10px] font-mono font-bold tracking-wider text-blue-300 uppercase">StellarID</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 6. FINAL CTA ===== */}
      <section className="py-28 px-6 text-center relative overflow-hidden border-t" style={{ borderColor: 'var(--border)' }}>
        {/* Volumetric spot lights */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 left-[50%] -translate-x-[50%] w-[60%] h-[350px] bg-gradient-to-t from-blue-600/15 to-transparent blur-[110px] pointer-events-none" />
        
        {/* Sci-fi tech grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.025)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [.23,1,.32,1] }}
          >
            <h2 className="text-display text-5xl lg:text-7xl mb-8 font-display">
              Own your<br/>
              <span className="gradient-text" style={{ backgroundImage: 'linear-gradient(to right, #3b82f6, #60a5fa, #06b6d4)' }}>identity.</span>
            </h2>
            <p className="text-xl text-muted font-light mb-10 max-w-lg mx-auto leading-relaxed">
              The identity revolution is not being televised.
              It is being mathematically proven.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/dashboard"><button className="btn-stellar !px-12 !py-5 !text-sm">Launch Protocol</button></a>
              <a href="/docs"><button className="btn-stellar-ghost !px-12 !py-5 !text-sm">Read Docs</button></a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

// --- PROVING TERMINAL (Hero Demo) ---
function ProvingTerminal() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'proving' | 'verified'>('idle');

  const runProof = () => {
    if (status === 'proving') return;
    setStatus('proving');
    setLogs([]);

    const sequence = [
      "Initializing Groth16 Prover...",
      "Fetching witness from local enclave...",
      "Compiling R1CS constraints...",
      "Generating Poseidon Hash commitments...",
      "Computing SNARK proof (BN128 curve)...",
      "Verifying proof integrity...",
      "Identity Artifact Generated."
    ];

    sequence.forEach((text, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, `> ${text}`]);
        if (i === sequence.length - 1) setStatus('verified');
      }, i * 500);
    });
  };

  return (
    <div className="protocol-panel w-full max-w-lg overflow-hidden">
      {/* Terminal header */}
      <div className="px-4 py-3 flex items-center justify-between border-b bg-white/[0.02]" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <span className="text-[10px] font-mono text-muted tracking-wider">zk_prover_v2.sh</span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-xs h-56 overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-1.5"
          >
            <span className="text-accent-indigo mr-2">➜</span>
            <span className="text-muted">{log}</span>
          </motion.div>
        ))}

        {status === 'idle' && (
          <button onClick={runProof} className="text-accent-indigo hover:text-accent-purple transition-colors">
            [ RUN IDENTITY PROOF ]
          </button>
        )}

        {status === 'proving' && (
          <div className="flex items-center gap-2 text-accent-purple mt-2">
            <span className="animate-pulse">●</span>
            <span>Computing proof...</span>
          </div>
        )}

        {status === 'verified' && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 p-4 rounded-xl border border-accent-indigo/20 bg-accent-indigo/5"
          >
            <div className="flex items-center gap-2 text-accent-indigo font-bold mb-1">
              <ShieldCheck size={14} /> VERIFIED
            </div>
            <p className="text-[10px] text-accent-indigo/70">Proof: 0x4f...8a2 | Zero data leaked</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
