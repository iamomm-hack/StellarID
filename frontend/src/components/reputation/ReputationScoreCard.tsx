'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Shield, Sparkles, Award } from 'lucide-react';

interface ReputationScoreCardProps {
  score: number;
  tier: string;
  credentialCount: number;
  onRecalculate: () => Promise<void>;
  isRecalculating: boolean;
}

export default function ReputationScoreCard({
  score,
  tier,
  credentialCount,
  onRecalculate,
  isRecalculating
}: ReputationScoreCardProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayScore(Math.round(latest))
    });
    return controls.stop;
  }, [score, count]);

  // Circular progress ring math
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Score is clamped between 0 and 1000. So percentage is score / 10
  const percentage = Math.min(Math.max(score, 0), 1000) / 10;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getTierColor = (t: string) => {
    switch (t) {
      case 'Elite Builder':
        return 'from-purple-500 to-indigo-500 shadow-purple-500/20';
      case 'Proven':
        return 'from-blue-500 to-cyan-500 shadow-blue-500/20';
      default:
        return 'from-emerald-500 to-teal-500 shadow-emerald-500/20';
    }
  };

  const getTierBadgeBorder = (t: string) => {
    switch (t) {
      case 'Elite Builder':
        return 'border-purple-500/30 text-purple-400 bg-purple-500/10';
      case 'Proven':
        return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
      default:
        return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-md flex flex-col items-center justify-center text-center group"
    >
      {/* Decorative gradient radial glow */}
      <div className="absolute -right-32 -top-32 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none group-hover:bg-indigo-500/15 transition-all duration-700" />
      <div className="absolute -left-32 -bottom-32 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] pointer-events-none group-hover:bg-purple-500/15 transition-all duration-700" />

      {/* Title */}
      <div className="flex items-center gap-2 mb-6 text-[10px] font-mono tracking-[0.2em] text-muted uppercase">
        <Shield className="w-3.5 h-3.5 text-indigo-400" />
        Reputation Rating
      </div>

      {/* Circular Progress Ring container */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <svg className="w-full h-full transform -rotate-90">
          {/* Base track */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            className="stroke-white/[0.04]"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Filled progress */}
          <motion.circle
            cx="96"
            cy="96"
            r={radius}
            className="stroke-indigo-500"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Scoring labels in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70"
          >
            {displayScore}
          </motion.span>
          <span className="text-[10px] font-mono text-muted tracking-wider uppercase mt-1">
            out of 1000
          </span>
        </div>
      </div>

      {/* Current Tier Badge */}
      <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold tracking-wide flex items-center gap-1.5 mb-6 ${getTierBadgeBorder(tier)}`}>
        {tier === 'Elite Builder' ? (
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        ) : (
          <Award className="w-3.5 h-3.5 text-current" />
        )}
        {tier}
      </div>

      {/* Recalculate button */}
      <button
        onClick={onRecalculate}
        disabled={isRecalculating}
        className="w-full py-3 px-6 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-mono uppercase tracking-[0.1em] text-foreground hover:bg-white/[0.06] active:bg-white/[0.1] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden relative group"
      >
        <span className="relative z-10 flex items-center gap-2">
          {isRecalculating ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Recalculating...
            </>
          ) : (
            'Recalculate Rating'
          )}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </button>

      {/* Footnote */}
      <div className="mt-4 text-[9px] font-mono text-muted">
        {credentialCount} verified credentials evaluated
      </div>
    </motion.div>
  );
}
