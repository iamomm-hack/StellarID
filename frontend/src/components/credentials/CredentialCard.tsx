'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Shield, ShieldCheck, Copy, Check, Fingerprint,
  Cake, Github, Linkedin, Wallet, GraduationCap,
  Home, BarChart3, KeyRound, Trash2, Zap, Globe, Award
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDeleteCredential } from '../../hooks/useCredentials';
import VerificationBadge from './VerificationBadge';

interface Credential {
  id: string;
  credential_type: string;
  issuer: { 
    name: string; 
    logo_url: string; 
    verified: boolean; 
    verification_status?: 'official_verified' | 'community_verified' | 'unverified';
  };
  issued_at: string;
  expires_at: string;
  revoked: boolean;
  expired: boolean;
  nft_token_id: string;
  valid: boolean;
}

interface CredentialCardProps {
  credential: Credential;
  onGenerateProof: (credential: Credential) => void;
}

const typeIcons: Record<string, LucideIcon> = {
  age_verification: Cake,
  github_developer: Github,
  linkedin_professional: Linkedin,
  income_check: Wallet,
  student: GraduationCap,
  us_resident: Home,
  accredited_investor: BarChart3,
  stellar_hackathon_winner: Award,
};

const typeLabels: Record<string, string> = {
  age_verification: 'Age Verification',
  github_developer: 'Developer Identity',
  linkedin_professional: 'Professional Credential',
  income_check: 'Financial Proof',
  student: 'Education Verify',
  us_resident: 'Residency Node',
  accredited_investor: 'Investor Seal',
  stellar_hackathon_winner: 'Stellar Hackathon Winner',
};

export default function CredentialCard({ credential, onGenerateProof }: CredentialCardProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential();

  // Subtle tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 250, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 250, damping: 30 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const statusColor = credential.revoked ? '#ef4444' : credential.expired ? 'var(--text-muted)' : '#6366f1';
  const IconComp = typeIcons[credential.credential_type] || KeyRound;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, perspective: 1200, transformStyle: 'preserve-3d' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative w-full h-full will-change-transform"
    >
      <div className="relative overflow-hidden rounded-2xl h-full flex flex-col transition-colors duration-300 group-hover:border-white/[0.12]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        
        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[10px] font-mono text-muted">
            #{credential.nft_token_id.slice(-6)}
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
            <span className="text-[10px] font-mono font-bold" style={{ color: statusColor }}>
              {credential.valid ? 'Active' : 'Void'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <IconComp className="w-6 h-6" style={{ color: statusColor }} />
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-foreground mb-1">
                {typeLabels[credential.credential_type] || 'Identity Fragment'}
              </h3>
              <div className="flex items-center justify-end gap-1.5 text-muted">
                <Globe className="w-3 h-3" />
                <span className="text-[9px] font-mono">Verified</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 mb-auto">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
              <span className="text-[9px] font-mono text-muted block mb-1">Issuer</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{credential.issuer.name}</span>
                <VerificationBadge 
                  status={credential.issuer.verification_status || (credential.issuer.verified ? 'official_verified' : 'unverified')} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <span className="text-[9px] font-mono text-muted block mb-1">Issued</span>
                <span className="text-[11px] font-mono text-foreground/70">{new Date(credential.issued_at).toLocaleDateString()}</span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <span className="text-[9px] font-mono text-muted block mb-1">Security</span>
                <span className="text-[11px] font-mono text-foreground/70">ZKP + ECDSA</span>
              </div>
            </div>
          </div>

          {/* Fingerprint */}
          <div className="mt-5 flex items-center justify-between rounded-xl p-3 border border-white/[0.04]" style={{ background: 'hsl(var(--background))' }}>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-muted" />
              <span className="text-[10px] font-mono text-muted truncate w-28">{credential.nft_token_id}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(credential.nft_token_id); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="p-1 hover:bg-white/[0.04] rounded-md transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-accent-indigo" /> : <Copy className="w-3 h-3 text-muted" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 grid grid-cols-2 gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
          {credential.valid ? (
            <button
              onClick={(e) => { e.stopPropagation(); onGenerateProof(credential); }}
              className="btn-stellar !py-2.5 !text-[10px] !rounded-xl"
            >
              <Zap className="w-3 h-3" /> Prove
            </button>
          ) : (
            <div className="flex items-center justify-center text-[10px] font-mono text-muted bg-white/[0.02] rounded-xl">
              Invalid
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this credential?')) deleteCredential(credential.id); }}
            disabled={isDeleting}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/[0.06] text-[10px] font-bold text-muted hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 transition-all disabled:opacity-20"
          >
            <Trash2 className="w-3 h-3" />
            {isDeleting ? 'Deleting...' : 'Remove'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}