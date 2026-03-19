'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, ShieldCheck, ShieldX, Clock, Zap,
  ExternalLink, Download, CheckCircle2, XCircle,
  Loader2, AlertCircle, Copy, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

    // Demo mode — show sample data without hitting API
    if (proofId === 'demo') {
      setProof({
        id: 'demo-uuid-4f8a-9b2c-1234567890ab',
        circuitType: 'age_check',
        claimType: 'Age Over 18',
        status: 'verified',
        createdAt: new Date().toISOString(),
        proofTimeMs: 870,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setLoading(false);
      return;
    }

    fetch(`${API}/proofs/${proofId}`)
      .then(r => {
        if (!r.ok) throw new Error('Proof not found');
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
    toast.success('Verification link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    window.open(`${API}/proofs/${proofId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}>
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}>
        <div className="max-w-md text-center rounded-2xl glass p-8 border border-white/10">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Proof Not Found</h1>
          <p className="text-white/50 text-sm mb-4">{error || 'This verification link may be expired or invalid.'}</p>
          <a href="/" className="text-sm text-[#00e676] hover:underline">Back to StellarID</a>
        </div>
      </div>
    );
  }

  const isVerified = proof.status === 'verified';
  const isExpired = proof.status === 'expired';
  const isRevoked = proof.status === 'revoked';

  return (
    <div className="min-h-screen text-white"
         style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}>

      {/* Background orbs */}
      <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-[#7c3aed]/12 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#00e676]/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-16">
        {/* StellarID branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-xs text-white/60 mb-4">
            <Shield className="w-3.5 h-3.5 text-[#00e676]" />
            StellarID Verification
          </div>
        </div>

        {/* Main Card */}
        <div className={`rounded-2xl glass p-8 border ${
          isVerified ? 'border-[#00e676]/25' : isRevoked ? 'border-red-500/25' : 'border-amber-500/25'
        } relative overflow-hidden`}>

          {/* Subtle glow */}
          <div className={`absolute inset-0 pointer-events-none ${
            isVerified ? 'bg-[#00e676]/3' : isRevoked ? 'bg-red-500/3' : 'bg-amber-500/3'
          }`} />

          <div className="relative z-10">
            {/* Status Badge */}
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isVerified ? 'bg-[#00e676]/15' : isRevoked ? 'bg-red-500/15' : 'bg-amber-500/15'
              }`}>
                {isVerified ? (
                  <ShieldCheck className="w-10 h-10 text-[#00e676]" />
                ) : isRevoked ? (
                  <ShieldX className="w-10 h-10 text-red-400" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                )}
              </div>

              <h1 className={`text-2xl font-bold mb-1 ${
                isVerified ? 'text-[#00e676]' : isRevoked ? 'text-red-400' : 'text-amber-400'
              }`}>
                {isVerified ? 'VERIFIED' : isRevoked ? 'REVOKED' : 'EXPIRED'}
              </h1>
              <p className="text-white/40 text-sm">
                {isVerified ? 'This proof has been cryptographically verified' :
                 isRevoked ? 'This proof has been revoked by the issuer' :
                 'This verification link has expired'}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-white/40 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Claim
                </span>
                <span className="text-sm font-medium">{proof.claimType || proof.circuitType}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-white/40 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Circuit
                </span>
                <span className="text-sm font-mono text-white/70">{proof.circuitType}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <span className="text-xs text-white/40 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Verified At
                </span>
                <span className="text-sm text-white/70">
                  {new Date(proof.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </span>
              </div>
              {proof.proofTimeMs && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                  <span className="text-xs text-white/40 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Proof Time
                  </span>
                  <span className="text-sm text-white/70">{(proof.proofTimeMs / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 mb-6">
              <p className="text-[11px] text-white/30 text-center leading-relaxed">
                This verification used zero-knowledge proofs. No personal data was transmitted or stored.
                Only the YES/NO verification result is displayed.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Proof ID */}
        <p className="text-center text-[10px] text-white/15 mt-6 font-mono">
          Proof ID: {proof.id}
        </p>
      </div>
    </div>
  );
}
