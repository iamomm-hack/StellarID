'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Download, Copy, Check, ExternalLink,
  ShieldCheck, Fingerprint, Globe, Lock, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1';

interface ShareableProofProps {
  publicToken: string;
  shareUrl: string;
  circuitType: string;
  claimType: string;
  onClose: () => void;
}

export default function ShareableProof({ publicToken, shareUrl, circuitType, claimType, onClose }: ShareableProofProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Proof link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-md" 
        style={{ background: 'hsla(260, 87%, 3%, 0.9)' }}
        onClick={onClose} 
      />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative max-w-sm w-full will-change-transform"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl flex flex-col" style={{ background: 'var(--surface)' }}>
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-accent-indigo" />
              <span className="text-[10px] font-mono text-muted tracking-wider">ID: {publicToken.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-accent-indigo animate-pulse" />
              <span className="text-[10px] font-mono text-accent-indigo">Valid</span>
            </div>
          </div>

          {/* Verification Center */}
          <div className="p-10 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-[-16px] border border-accent-indigo/30 rounded-full"
              />
              <div className="relative w-20 h-20 bg-accent-indigo/10 border border-accent-indigo/30 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-accent-indigo" />
              </div>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-foreground mb-1">Proof Verified</h3>
            <p className="text-[11px] font-mono text-muted tracking-wider">Cryptographic truth established</p>
          </div>

          {/* Data */}
          <div className="px-8 space-y-3 mb-8">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-mono text-muted uppercase">Claim Type</span>
                <Lock className="w-3 h-3 text-muted/50" />
              </div>
              <p className="text-[12px] font-bold text-foreground">{claimType || circuitType}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-muted" />
                  <span className="text-[9px] font-mono text-muted uppercase">Verification Link</span>
                </div>
              </div>
              <p className="text-[10px] font-mono text-accent-indigo truncate">{shareUrl}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-white/[0.06] space-y-3">
            <button onClick={handleCopy} className="btn-stellar w-full !py-3.5 justify-center">
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Proof Link</>}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`${API}/proofs/${publicToken}/pdf`, '_blank')}
                className="btn-stellar-ghost !py-3 !text-[10px] justify-center"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => window.open(shareUrl, '_blank')}
                className="btn-stellar-ghost !py-3 !text-[10px] justify-center"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View
              </button>
            </div>
          </div>
        </div>

        {/* Close */}
        <button 
          onClick={onClose} 
          className="w-full mt-6 text-[10px] font-mono text-muted hover:text-foreground transition-colors text-center tracking-wider"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}