'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldX, Clock, Zap,
  Download, AlertCircle, Copy, Check,
  Loader2, Fingerprint, Globe, Cpu, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1';

interface ProofData {
  id: string;
  circuitType: string;
  claimType: string;
  status: string;
  createdAt: string;
  proofTimeMs: number | null;
  expiresAt: string | null;
}

export default function VerifyPage() {
  const params = useParams();
  const proofId = params.proofId as string;
  const [proof, setProof] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!proofId) return;

    if (proofId === 'demo') {
      setTimeout(() => {
        setProof({
          id: 'demo-uuid-4f8a-9b2c-1234567890ab',
          circuitType: 'age_check',
          claimType: 'Age_Over_18_Verification',
          status: 'verified',
          createdAt: new Date().toISOString(),
          proofTimeMs: 870,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
        setLoading(false);
      }, 1500);
      return;
    }

    fetch(`${API}/proofs/${proofId}`)
      .then(r => {
        if (!r.ok) throw new Error('Protocol_Artifact_Not_Found');
        return r.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setProof(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [proofId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('GATEWAY_LINK_COPIED');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (proofId === 'demo') {
      toast('PDF export requires live protocol link.', { icon: 'ℹ️' });
      return;
    }
    window.open(`${API}/proofs/${proofId}/pdf`, '_blank');
  };

  // --- CINEMATIC LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-2 border-white/[0.06] border-t-accent-indigo rounded-full mb-8"
          />
          <span className="text-[11px] font-mono text-accent-indigo animate-pulse tracking-wider">
            Verifying proof...
          </span>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error || !proof) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'hsl(var(--background))' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="protocol-panel max-w-md w-full p-12 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-3">Verification Failed</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            {error || 'The requested proof has expired or is cryptographically invalid.'}
          </p>
          <a href="/" className="btn-stellar-ghost block w-full">Return Home</a>
        </motion.div>
      </div>
    );
  }

  const isVerified = proof.status === 'verified';
  const isRevoked = proof.status === 'revoked';
  const statusColor = isVerified ? '#6366f1' : isRevoked ? '#ef4444' : 'var(--text-muted)';

  return (
    <div className="min-h-screen overflow-hidden relative" style={{ background: 'hsl(var(--background))' }}>
      {/* Ambient glow */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${statusColor}, transparent 70%)` }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-24">
        {/* Verification Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mb-6">
            <Cpu className="w-3.5 h-3.5 text-muted" />
            <span className="text-[10px] font-mono tracking-wider text-muted uppercase">
              StellarID Verification Gateway
            </span>
          </div>
          <p className="text-[11px] font-mono text-muted tracking-wider">ID: {proof.id.slice(0, 18)}...</p>
        </motion.div>

        {/* Massive Status Moment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-20"
        >
          {/* Holographic Badge */}
          <div className="relative flex justify-center mb-12">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="relative w-28 h-28 rounded-3xl border-2 flex items-center justify-center bg-white/[0.02]"
              style={{ borderColor: `${statusColor}44` }}
            >
              {isVerified ? (
                <ShieldCheck className="w-16 h-16" style={{ color: statusColor }} />
              ) : isRevoked ? (
                <ShieldX className="w-16 h-16" style={{ color: statusColor }} />
              ) : (
                <AlertCircle className="w-16 h-16 text-zinc-500" />
              )}
            </motion.div>
          </div>

          <div className="text-center">
            <motion.h1 
              initial={{ letterSpacing: "1em", opacity: 0 }}
              animate={{ letterSpacing: "0.2em", opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-3 font-display"
              style={{ color: statusColor }}
            >
              {isVerified ? 'VERIFIED' : isRevoked ? 'REVOKED' : 'EXPIRED'}
            </motion.h1>
            <p className="text-muted font-mono text-xs tracking-wider">
              {isVerified ? 'Cryptographic integrity confirmed on-chain' : 'Authentication credentials voided'}
            </p>
          </div>
        </motion.div>

        {/* Protocol Manifest */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="protocol-panel overflow-hidden mb-12"
        >
          <div className="px-8 py-4 border-b border-white/[0.06] flex justify-between">
            <span className="text-[10px] font-mono text-muted tracking-wider uppercase">Proof Manifest</span>
            <Globe className="w-4 h-4 text-muted/50" />
          </div>
          
          <div className="p-8 space-y-6">
            <ManifestRow label="Verified_Claim" value={proof.claimType} highlight />
            <ManifestRow label="Logic_Circuit" value={proof.circuitType} />
            <ManifestRow label="Timestamp" value={new Date(proof.createdAt).toLocaleString()} />
            {proof.proofTimeMs && (
              <ManifestRow label="Computation_Time" value={`${(proof.proofTimeMs / 1000).toFixed(2)}s`} />
            )}
          </div>

          <div className="p-6 bg-white/[0.01] border-t border-white/[0.06] flex items-start gap-4">
            <Lock className="w-5 h-5 text-accent-indigo shrink-0" />
            <p className="text-[11px] text-muted leading-relaxed">
              This verification uses Groth16 zero-knowledge proofs. Your private data was never 
              decrypted or transmitted — only the mathematical truth was shared.
            </p>
          </div>
        </motion.div>

        {/* Interaction Dock */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 gap-4"
        >
          <button 
            onClick={handleDownloadPDF}
            className="btn-stellar-ghost flex items-center justify-center gap-3 py-5"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={handleCopyLink}
            className="btn-stellar flex items-center justify-center gap-3 py-4"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </motion.div>

        {/* Footer Identity */}
        <div className="mt-24 text-center">
          <div className="h-px w-12 bg-white/[0.06] mx-auto mb-6" />
          <p className="text-muted/40 font-mono text-[9px] uppercase tracking-widest">
            Built on Stellar Network • Zero Knowledge Identity
          </p>
        </div>
      </div>
    </div>
  );
}

function ManifestRow({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) {
  return (
    <div className="flex justify-between items-end border-b border-white/[0.04] pb-3">
      <span className="text-[10px] font-mono text-muted uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-foreground' : 'text-foreground/70'}`}>
        {value}
      </span>
    </div>
  );
}