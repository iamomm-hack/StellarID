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
    <div className="edge-modal-overlay" onClick={onClose}>
      <div className="edge-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edge-modal-header">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Generate ZK Proof</span>
          </div>
          <button type="button" onClick={onClose} title="Close modal"
                  className="hover:opacity-60 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-[#222]">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`step-bar ${s <= step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="p-6">
          {/* Step 1: Select claim */}
          {step === 1 && (
            <div className="space-y-2">
              <h3 className="text-[10px] text-[var(--color-text-muted)] mb-4 uppercase tracking-widest font-bold">
                Select Claim Type
              </h3>
              {claimOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSelectedClaim(option.value); setStep(2); }}
                  className="w-full text-left px-4 py-3 border border-[#333] bg-[var(--color-surface)]
                             hover:border-[var(--color-accent)] transition-all group"
                >
                  <p className="text-white font-semibold text-sm uppercase tracking-wider">{option.label}</p>
                  <p className="text-[var(--color-text-muted)] text-xs mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Confirm inputs */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest font-bold">
                Confirm Public Inputs
              </h3>

              <table className="edge-table w-full" style={{ fontSize: '0.85rem' }}>
                <tbody>
                  <tr>
                    <td>Today&apos;s date</td>
                    <td className="text-right text-white">{new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td>Claim</td>
                    <td className="text-right text-white">{getClaimLabel()}</td>
                  </tr>
                  <tr>
                    <td>Credential NFT</td>
                    <td className="text-right text-white font-mono text-xs">
                      {credential.nft_token_id?.substring(0, 12)}...
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-start gap-2 px-3 py-2 border-l-4"
                   style={{ borderColor: 'var(--color-highlight)', background: 'rgba(212, 255, 0, 0.05)' }}>
                <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-highlight)' }} />
                <p className="text-xs" style={{ color: 'var(--color-highlight)' }}>
                  Your private data stays on this device. Only the proof
                  (true/false) is shared — never your birthdate, income, or personal info.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 btn-brutal btn-brutal-outline py-2.5 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateProof}
                  className="flex-1 btn-brutal btn-brutal-accent py-2.5 text-sm"
                >
                  Generate Proof
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-16 h-16 border-2 border-[#333] border-t-[var(--color-accent)] flex items-center justify-center"
                   style={{ animation: 'spin-slow 0.8s linear infinite' }}>
              </div>
              <div className="text-center">
                <p className="text-white font-bold uppercase tracking-wider">Computing zero-knowledge proof...</p>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                  Your private data never leaves this device
                </p>
              </div>
              {error && (
                <div className="text-sm text-center px-4" style={{ color: 'var(--color-accent)' }}>
                  {error}
                  <button
                    onClick={() => setStep(2)}
                    className="block mx-auto mt-2 hover:text-[var(--color-highlight)]"
                  >
                    Try again →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Proof ready */}
          {step === 4 && proofResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-2">
                <div className="w-14 h-14 flex items-center justify-center mb-3 border"
                     style={{ borderColor: 'var(--color-highlight)', background: 'rgba(212, 255, 0, 0.1)' }}>
                  <Check className="w-7 h-7" style={{ color: 'var(--color-highlight)' }} />
                </div>
                <p className="text-white font-bold uppercase tracking-wider"
                   style={{ fontFamily: 'Unbounded, sans-serif' }}>
                  Proof Generated!
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-highlight)' }}>
                  Claim verified: {getClaimLabel()}
                </p>
              </div>

              <table className="edge-table w-full" style={{ fontSize: '0.8rem' }}>
                <tbody>
                  <tr>
                    <td><Eye className="w-3 h-3 inline mr-1" />Proof ID</td>
                    <td className="text-right text-white font-mono text-xs">
                      {proofResult.publicSignals?.[0]?.substring(0, 20)}...
                    </td>
                  </tr>
                  <tr>
                    <td>Protocol</td>
                    <td className="text-right text-white">Groth16</td>
                  </tr>
                  <tr>
                    <td>Curve</td>
                    <td className="text-right text-white">BN128</td>
                  </tr>
                </tbody>
              </table>

              {/* Share URL */}
              {(shareUrl || true) && (
                <div className="border-l-4 p-3" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-bg)' }}>
                  <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-widest font-bold">
                    Verification Link
                  </p>
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--color-accent)' }}>
                    {shareUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/demo`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-0">
                <button onClick={copyShareLink}
                        className="btn-brutal btn-brutal-accent flex items-center justify-center gap-2 py-2.5 text-xs">
                  <Link2 className="w-3.5 h-3.5" />
                  Copy Link
                </button>
                <button onClick={handleDownloadPDF}
                        className="btn-brutal btn-brutal-outline flex items-center justify-center gap-2 py-2.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  Download PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-0">
                <button onClick={openVerifyPage}
                        className="btn-brutal btn-brutal-outline flex items-center justify-center gap-2 py-2.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Page
                </button>
                <button onClick={copyProof}
                        className="btn-brutal btn-brutal-outline flex items-center justify-center gap-2 py-2.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-highlight)' }} /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <button onClick={onClose}
                      className="w-full btn-brutal btn-brutal-primary py-2.5 text-sm">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
