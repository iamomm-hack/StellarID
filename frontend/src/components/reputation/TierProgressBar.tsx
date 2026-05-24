'use client';

import { motion } from 'framer-motion';
import { ShieldAlert, Award, Star } from 'lucide-react';

interface TierProgressBarProps {
  score: number;
}

export default function TierProgressBar({ score }: TierProgressBarProps) {
  // Determine tier, progress, and labels
  let currentTier = 'Verified';
  let nextTier = 'Proven';
  let progress = 0; // percentage inside current tier
  let pointsNeeded = 0;

  if (score < 200) {
    currentTier = 'Verified';
    nextTier = 'Proven';
    progress = (score / 200) * 100;
    pointsNeeded = 200 - score;
  } else if (score < 500) {
    currentTier = 'Proven';
    nextTier = 'Elite Builder';
    progress = ((score - 200) / 300) * 100;
    pointsNeeded = 500 - score;
  } else {
    currentTier = 'Elite Builder';
    nextTier = 'Apex Creator';
    progress = ((score - 500) / 500) * 100;
    pointsNeeded = 1000 - score;
  }

  // Cap progress to 100%
  progress = Math.min(Math.max(progress, 0), 100);

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Elite Builder':
        return <Star className="w-4 h-4 text-purple-400" />;
      case 'Proven':
        return <Award className="w-4 h-4 text-blue-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md flex flex-col w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-xs font-mono tracking-[0.2em] text-muted uppercase">Tier Progression</h4>
          <p className="text-sm font-bold text-foreground mt-1">
            {score >= 1000 ? (
              <span className="text-purple-400">Maximum Reputation Level Achieved!</span>
            ) : (
              <>
                Build <span className="text-indigo-400 font-mono font-extrabold">{pointsNeeded}</span> more points to reach <span className="text-indigo-400">{nextTier}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
            Verified (0+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20" />
            Proven (200+)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/20" />
            Elite (500+)
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative h-2.5 w-full bg-white/[0.03] rounded-full border border-white/[0.05] overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
        />
      </div>

      {/* Steps indicators */}
      <div className="flex justify-between items-center text-[10px] font-mono text-muted px-1">
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold text-foreground flex items-center gap-1">
            {getTierIcon('Verified')} Verified
          </span>
          <span>0 pts</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className={`font-semibold flex items-center gap-1 ${score >= 200 ? 'text-foreground' : ''}`}>
            {getTierIcon('Proven')} Proven
          </span>
          <span>200 pts</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`font-semibold flex items-center gap-1 ${score >= 500 ? 'text-foreground' : ''}`}>
            {getTierIcon('Elite Builder')} Elite Builder
          </span>
          <span>500 pts</span>
        </div>
      </div>
    </div>
  );
}
