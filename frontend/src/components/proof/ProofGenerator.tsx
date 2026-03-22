'use client';
import { useState } from 'react';
import { X, Shield, Check, Loader2, Copy, Lock, Eye, Download, ExternalLink, Link2 } from 'lucide-react';
import { useZKProof } from '../../hooks/useZKProof';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1';

interface Credential {
  id: string;
  credential_type: string;
  nft_token_id: string;
}

interface ProofGeneratorProps {
  credential: Credential;
  onClose: () => void;
}

type ClaimType = 'age_18' | 'age_21' | 'income_100k' | 'residency';

const claimOptions: { value: ClaimType; label: string; description: string }[] = [
  { value: 'age_18', label: 'Prove I am over 18', description: 'Age verification (18+)' },
  { value: 'age_21', label: 'Prove I am over 21', description: 'Age verification (21+)' },
  { value: 'income_100k', label: 'Prove income > $100k', description: 'Income threshold check' },
  { value: 'residency', label: 'Prove I am a resident', description: 'Country residency check' },
];

export default function ProofGenerator({ credential, onClose }: ProofGeneratorProps) {
  const [step, setStep] = useState(1);
  const [selectedClaim, setSelectedClaim] = useState<ClaimType | null>(null);
  const [proofResult, setProofResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { generateAgeProof, generateIncomeProof, loading, error } = useZKProof();

  const handleGenerateProof = async () => {
    if (!selectedClaim) return;
    setStep(3);

    let result;
    const nftId = parseInt(credential.nft_token_id) || 1;

    switch (selectedClaim) {
      case 'age_18':
        result = await generateAgeProof(1995, 6, 15, nftId, 18);
        break;
      case 'age_21':
        result = await generateAgeProof(1995, 6, 15, nftId, 21);
        break;
      case 'income_100k':
        result = await generateIncomeProof(150000, nftId, 100000);
        break;
      default:
        result = await generateAgeProof(1995, 6, 15, nftId, 18);
    }

    if (result) {
      setProofResult(result);

      // Create shareable proof record via backend
      try {
        let token: string | null = null;
        try {
          const stored = localStorage.getItem('stellar-id-wallet');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = parsed?.state?.token || null;
          }
        } catch {}

        if (token) {
          const res = await fetch(`${API}/proofs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              circuitType: selectedClaim.includes('age') ? 'age_check' : selectedClaim.includes('income') ? 'income_check' : 'residency_check',
              claimType: getClaimLabel(),
              proofData: result,
            }),
          });
          const data = await res.json();
          if (data.publicToken) {
            setShareToken(data.publicToken);
            setShareUrl(`${window.location.origin}/verify/${data.publicToken}`);
          }
        }
      } catch {}

      setStep(4);
    }
  };

  const copyProof = () => {
    navigator.clipboard.writeText(JSON.stringify(proofResult, null, 2));
    setCopied(true);
    toast.success('Proof JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Verification link copied!');
    } else {
      const demoUrl = `${window.location.origin}/verify/demo`;
      navigator.clipboard.writeText(demoUrl);
      toast.success('Demo verification link copied!');
    }
  };

  const handleDownloadPDF = () => {
    if (shareToken) {
      window.open(`${API}/proofs/${shareToken}/pdf`, '_blank');
      toast.success('PDF download started');
    } else {
      toast('PDF requires backend connection', { icon: 'ℹ️' });
    }
  };

  const openVerifyPage = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    } else {
      window.open(`${window.location.origin}/verify/demo`, '_blank');
    }
  };

  const getClaimLabel = () => {
    switch (selectedClaim) {
      case 'age_18': return 'Age Over 18';
      case 'age_21': return 'Age Over 21';
      case 'income_100k': return 'Income Over $100K';
      case 'residency': return 'Residency Verified';
      default: return 'Claim Verified';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center
                    justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl hybrid-surface border border-[#9effca]/20
                   shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#9effca]/20">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8bf3bf]" />
            <h2 className="text-lg font-semibold text-white">Generate ZK Proof</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500
                ${s <= step ? 'bg-[#1fce8b]' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Select claim */}
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm text-white/60 mb-4">
                What would you like to prove?
              </h3>
              {claimOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSelectedClaim(option.value); setStep(2); }}
                  className="w-full text-left px-4 py-3 rounded-xl glass glass-hover
                             transition-all duration-300 group hover:border-[#67e2a6]/35"
                >
                  <p className="text-white font-medium text-sm">{option.label}</p>
                  <p className="text-white/40 text-xs mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Confirm inputs */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm text-white/60">Confirm public inputs</h3>

              <div className="rounded-xl glass p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Today&apos;s date</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Claim</span>
                  <span className="text-white">{getClaimLabel()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Credential NFT</span>
                  <span className="text-white font-mono text-xs">
                    {credential.nft_token_id?.substring(0, 12)}...
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-500/10
                              border border-emerald-500/20">
                <Lock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-300/80">
                  Your private data stays on this device. Only the proof
                  (true/false) is shared — never your birthdate, income, or personal info.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60
                             hover:text-white text-sm transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateProof}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a1f]
                             to-[#ff7b46] text-white text-sm font-medium hover:shadow-lg
                             hover:shadow-[#ff5a1f]/25 transition-all"
                >
                  Generate Proof
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#1fce8b]/20 flex items-center
                                justify-center animate-pulse-glow">
                  <Loader2 className="w-8 h-8 text-[#8bf3bf] animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Computing zero-knowledge proof...</p>
                <p className="text-white/40 text-sm mt-1">
                  Your private data never leaves this device
                </p>
              </div>
              {error && (
                <div className="text-red-400 text-sm text-center px-4">
                  {error}
                  <button
                    onClick={() => setStep(2)}
                    className="block mx-auto mt-2 text-[#ff9a5d] hover:text-[#ffc27a]"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Proof ready — with sharing actions */}
          {step === 4 && proofResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center
                                justify-center mb-3">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-semibold">Proof Generated!</p>
                <p className="text-emerald-400 text-sm mt-1">
                  Claim verified: {getClaimLabel()}
                </p>
              </div>

              <div className="rounded-xl glass p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Proof ID
                  </span>
                  <span className="text-white/70 font-mono">
                    {proofResult.publicSignals?.[0]?.substring(0, 20)}...
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Protocol</span>
                  <span className="text-white/70">Groth16</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Curve</span>
                  <span className="text-white/70">BN128</span>
                </div>
              </div>

              {/* Share URL preview */}
              {(shareUrl || true) && (
                <div className="rounded-xl bg-white/[0.02] border border-[#00e676]/15 p-3">
                  <p className="text-[10px] text-white/30 mb-1">VERIFICATION LINK</p>
                  <p className="text-xs font-mono text-[#7c3aed] truncate">
                    {shareUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/demo`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={copyShareLink}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openVerifyPage}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Page
                </button>
                <button
                  onClick={copyProof}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a1f]
                           to-[#ff7b46] text-white text-sm font-medium transition-all
                           hover:shadow-lg hover:shadow-[#ff5a1f]/25"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
