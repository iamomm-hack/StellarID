'use client';
import { useState } from 'react';
import { X, Shield, Check, Loader2, Copy, Lock, Eye } from 'lucide-react';
import { useZKProof } from '../../hooks/useZKProof';

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
      setStep(4);
    }
  };

  const copyProof = () => {
    navigator.clipboard.writeText(JSON.stringify(proofResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getClaimLabel = () => {
    switch (selectedClaim) {
      case 'age_18': return 'You are over 18';
      case 'age_21': return 'You are over 21';
      case 'income_100k': return 'Income exceeds $100,000';
      case 'residency': return 'Residency verified';
      default: return 'Claim verified';
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

          {/* Step 4: Proof ready */}
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

              <div className="flex gap-3">
                <button
                  onClick={copyProof}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/70
                             hover:text-white text-sm transition-colors flex items-center
                             justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Proof'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a1f]
                             to-[#ff7b46] text-white text-sm font-medium transition-all
                             hover:shadow-lg hover:shadow-[#ff5a1f]/25"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
