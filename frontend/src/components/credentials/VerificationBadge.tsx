'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Award, AlertCircle, Check } from 'lucide-react';

interface VerificationBadgeProps {
  status?: 'official_verified' | 'community_verified' | 'unverified';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function VerificationBadge({ status = 'unverified', size = 'sm', showText = false }: VerificationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const config = {
    official_verified: {
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/30',
      icon: Award,
      text: 'Official Verified',
      tooltip: 'Official Verified: Domain verified & audited by StellarID.',
    },
    community_verified: {
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400/10',
      borderColor: 'border-indigo-400/30',
      icon: ShieldCheck,
      text: 'Community Verified',
      tooltip: 'Community Verified: Endorsed by 5+ verified peer issuers.',
    },
    unverified: {
      color: 'text-zinc-500',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
      icon: AlertCircle,
      text: 'Unverified',
      tooltip: 'Unverified Profile: Wallet address registered but domain not verified.',
    },
  };

  const current = config[status] || config.unverified;
  const IconComp = current.icon;

  const sizeClasses = {
    sm: 'p-1 text-[10px] gap-1',
    md: 'p-1.5 text-xs gap-1.5',
    lg: 'p-2 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center justify-center rounded-lg border font-mono font-medium transition-colors ${current.bgColor} ${current.borderColor} ${current.color} ${sizeClasses[size]}`}
      >
        <IconComp className={iconSizes[size]} />
        {showText && <span>{current.text}</span>}
      </motion.div>

      {/* Premium Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 p-3 bg-zinc-950 border border-white/[0.08] shadow-xl shadow-black/40 rounded-xl text-center pointer-events-none"
          >
            <p className="text-[10px] leading-relaxed text-zinc-300 font-mono">
              {current.tooltip}
            </p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-950" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
