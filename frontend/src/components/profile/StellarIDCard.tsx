'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import Image from 'next/image';
import { ShieldCheck, Fingerprint, Copy, Check, Calendar, Award } from 'lucide-react';

interface TopCredential {
  name: string;
  issuer: string;
  date: string;
}

interface CardData {
  wallet_address: string;
  display_name: string;
  avatar_url: string | null;
  reputation_score: number;
  tier: 'Verified' | 'Proven' | 'Elite Builder';
  credential_count: number;
  top_credentials: TopCredential[];
  badges: string[];
  member_since: string;
  stellar_network: string;
}

interface StellarIDCardProps {
  cardData: CardData;
}

export default function StellarIDCard({ cardData }: StellarIDCardProps) {
  const [copied, setCopied] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const controls = animate(0, cardData.reputation_score, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (value) => setAnimatedScore(Math.round(value)),
    });
    return () => controls.stop();
  }, [cardData.reputation_score]);

  const truncatedWallet = cardData.wallet_address.length > 12
    ? `${cardData.wallet_address.slice(0, 6)}...${cardData.wallet_address.slice(-6)}`
    : cardData.wallet_address;

  const copyAddress = () => {
    navigator.clipboard.writeText(cardData.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tierColors = {
    'Verified': 'from-gray-400 to-slate-500 shadow-slate-500/10 border-slate-500/30 text-slate-400 bg-slate-500/5',
    'Proven': 'from-blue-400 to-indigo-500 shadow-blue-500/10 border-blue-500/30 text-blue-400 bg-blue-500/5',
    'Elite Builder': 'from-violet-400 to-purple-500 shadow-purple-500/10 border-purple-500/30 text-purple-400 bg-purple-500/5',
  };

  const activeTierStyle = tierColors[cardData.tier] || tierColors['Verified'];

  // Labels for rendering credential names in a prettier way
  const credentialLabels: Record<string, string> = {
    age_verification: 'Age Verification',
    github_developer: 'Developer Identity',
    linkedin_professional: 'Professional Credential',
    income_check: 'Financial Proof',
    student: 'Education Verify',
    us_resident: 'Residency Node',
    accredited_investor: 'Investor Seal',
    stellar_hackathon_winner: 'Stellar Hackathon Winner',
    hackathon_winner: 'Stellar Hackathon Winner',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full max-w-[640px] mx-auto rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl bg-gradient-to-br from-[#0c081f] via-[#05030e] to-[#120726] p-8 text-foreground"
    >
      {/* Decorative Top Glows */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Network Indicator */}
      <div className="flex justify-between items-center mb-8">
        <div className="font-sans font-black tracking-wider text-xl">
          STELLAR<span className="text-purple-400">ID</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest text-purple-300 border border-purple-500/20 bg-purple-950/20">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          {cardData.stellar_network.toUpperCase()}
        </div>
      </div>

      {/* User Info Grid */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        {/* Avatar Area */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-4xl font-extrabold text-purple-300 shadow-inner">
            {cardData.avatar_url ? (
              <Image
                src={cardData.avatar_url}
                alt={cardData.display_name}
                className="w-full h-full rounded-2xl object-cover"
                width={80}
                height={80}
                unoptimized
              />
            ) : (
              cardData.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#0c081f] border border-white/10 rounded-full p-1 shadow-md">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-black tracking-tight mb-1">{cardData.display_name}</h2>
          
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <code className="text-xs text-muted font-mono bg-white/[0.02] border border-white/[0.04] px-2 py-0.5 rounded">
              {truncatedWallet}
            </code>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-white/[0.05] rounded transition-colors text-muted hover:text-foreground"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border ${activeTierStyle}`}>
            {cardData.tier}
          </span>
        </div>
      </div>

      {/* Score and Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative group">
          <div className="text-[10px] font-mono text-muted tracking-wider uppercase mb-1">Reputation Score</div>
          <div className="text-4xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {animatedScore}
          </div>
          <div className="absolute top-4 right-4 text-purple-500/20 group-hover:text-purple-500/40 transition-colors">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative group">
          <div className="text-[10px] font-mono text-muted tracking-wider uppercase mb-1">Credentials</div>
          <div className="text-4xl font-black tracking-tight text-foreground">
            {cardData.credential_count}
          </div>
          <div className="absolute top-4 right-4 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Credentials */}
      <div className="mb-8">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <span>Verified Credentials</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </h3>

        {cardData.top_credentials.length > 0 ? (
          <div className="space-y-2">
            {cardData.top_credentials.slice(0, 3).map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500/60" />
                  <div>
                    <div className="text-xs font-bold text-foreground">{credentialLabels[c.name] || c.name}</div>
                    <div className="text-[10px] text-muted">by {c.issuer}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-muted">{c.date}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-white/[0.06] rounded-xl text-xs text-muted">
            No credentials verified yet.
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="mb-6">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2">
          <span>Earned Badges</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </h3>

        {cardData.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {cardData.badges.map((badge, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold text-foreground border border-purple-500/20 bg-purple-500/[0.05]"
              >
                🏅 {badge}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-white/[0.06] rounded-xl text-xs text-muted">
            No badges unlocked yet.
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] font-mono text-muted border-t border-white/[0.04] pt-4 mt-6">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Member since {cardData.member_since}</span>
        </div>
        <div className="flex items-center gap-1">
          <Fingerprint className="w-3.5 h-3.5" />
          <span>StellarID Cryptographic Protocol</span>
        </div>
      </div>
    </motion.div>
  );
}
