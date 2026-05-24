'use client';

import { motion } from 'framer-motion';
import { Award, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CredentialBreakdown {
  credential_id: string;
  credential_type: string;
  points: number;
  base_points: number;
  recency_bonus: number;
  issuer_multiplier: number;
}

interface BonusBreakdown {
  name: string;
  points: number;
  description: string;
}

interface ScoreBreakdownProps {
  breakdown: CredentialBreakdown[];
  bonuses: BonusBreakdown[];
}

export default function ScoreBreakdown({ breakdown, bonuses }: ScoreBreakdownProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Credentials Points Breakdown */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md flex flex-col"
      >
        <h3 className="text-xs font-mono tracking-[0.2em] text-muted uppercase mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" />
          Credentials Contribution
        </h3>

        {breakdown.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
            <p className="text-xs font-mono text-muted">No credentials found contributing to score.</p>
            <p className="text-[10px] text-muted/60 mt-1 max-w-[250px]">Claim credentials to begin building your reputation points.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
            {breakdown.map((item, idx) => (
              <motion.div
                key={item.credential_id || idx}
                variants={itemVariants}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="flex flex-col gap-1 max-w-[70%]">
                  <span className="text-xs font-bold text-foreground truncate block">
                    {item.credential_type}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono text-muted bg-white/[0.04] px-1.5 py-0.5 rounded">
                      Base: {item.base_points}
                    </span>
                    {item.recency_bonus > 0 && (
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />
                        Recency: +{item.recency_bonus}
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                      Mult: {Number(item.issuer_multiplier).toFixed(2)}x
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold font-mono text-foreground">
                    +{Math.round(item.points)}
                  </span>
                  <span className="text-[9px] font-mono text-muted">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Platform Bonuses */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md flex flex-col"
      >
        <h3 className="text-xs font-mono tracking-[0.2em] text-muted uppercase mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          Special Bonuses
        </h3>

        {bonuses.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01]">
            <p className="text-xs font-mono text-muted">No active platform bonuses.</p>
            <p className="text-[10px] text-muted/60 mt-1 max-w-[250px]">Link GitHub or build continuous streaks to unlock bonuses.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1">
            {bonuses.map((bonus, idx) => (
              <motion.div
                key={bonus.name || idx}
                variants={itemVariants}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300 relative overflow-hidden group"
              >
                {/* Neon vertical status line */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500" />

                <div className="flex flex-col gap-1 max-w-[70%] pl-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                    {bonus.name}
                  </span>
                  <span className="text-[10px] text-muted leading-relaxed">
                    {bonus.description}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold font-mono text-indigo-400">
                    +{bonus.points}
                  </span>
                  <span className="text-[9px] font-mono text-muted">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
