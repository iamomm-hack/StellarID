'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, ShieldCheck, ShieldX, Clock, Zap,
  Download, AlertCircle, Copy, Check,
  Loader2,
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
    if (proofId === 'demo') {
      toast('PDF download is available with real proofs. This is a demo preview.', { icon: 'ℹ️' });
      return;
    }
    window.open(`${API}/proofs/${proofId}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--color-bg)' }}>
        <div className="w-12 h-12 border-2 border-[#333] border-t-[var(--color-accent)]"
             style={{ animation: 'spin-slow 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
           style={{ background: 'var(--color-bg)' }}>
        <div className="brutal-card max-w-md w-full">
          <div className="card-header-brutal">
            <span>Error</span>
            <span>[NOT_FOUND]</span>
          </div>
          <div className="card-body-brutal text-center py-12">
            <AlertCircle className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--color-accent)' }} />
            <h1 className="text-xl font-bold mb-2 uppercase"
                style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
              Proof Not Found
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-4">
              {error || 'This verification link may be expired or invalid.'}
            </p>
            <a href="/" className="text-sm hover:underline" style={{ color: 'var(--color-accent)' }}>
              Back to StellarID →
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isVerified = proof.status === 'verified';
  const isRevoked = proof.status === 'revoked';

  const getHeaderStyle = () => {
    if (isVerified) return { background: 'var(--color-highlight)', color: 'var(--color-bg)' };
    if (isRevoked) return { background: 'var(--color-accent)', color: '#fff' };
    return { background: '#888', color: 'var(--color-bg)' };
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="relative z-10 max-w-lg mx-auto px-6 py-16">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--color-accent)' }}>
            // StellarID Verification
          </span>
        </div>

        {/* Main Card */}
        <div className="brutal-card">
          <div className="card-header-brutal" style={getHeaderStyle()}>
            <span>Proof Verification</span>
            <span>[{isVerified ? 'VERIFIED' : isRevoked ? 'REVOKED' : 'EXPIRED'}]</span>
          </div>

          <div className="card-body-brutal">
            {/* Status */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto flex items-center justify-center mb-4 border"
                   style={{
                     borderColor: isVerified ? 'var(--color-highlight)' : isRevoked ? 'var(--color-accent)' : '#888',
                     background: isVerified ? 'rgba(212, 255, 0, 0.1)' : isRevoked ? 'rgba(255, 60, 0, 0.1)' : 'rgba(136, 136, 136, 0.1)'
                   }}>
                {isVerified ? (
                  <ShieldCheck className="w-8 h-8" style={{ color: 'var(--color-highlight)' }} />
                ) : isRevoked ? (
                  <ShieldX className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                ) : (
                  <AlertCircle className="w-8 h-8 text-[#888]" />
                )}
              </div>

              <h1 className="text-2xl font-bold mb-1 uppercase tracking-wider"
                  style={{
                    fontFamily: 'Unbounded, sans-serif',
                    color: isVerified ? 'var(--color-highlight)' : isRevoked ? 'var(--color-accent)' : '#888'
                  }}>
                {isVerified ? 'VERIFIED' : isRevoked ? 'REVOKED' : 'EXPIRED'}
              </h1>
              <p className="text-[var(--color-text-muted)] text-sm">
                {isVerified ? 'This proof has been cryptographically verified' :
                 isRevoked ? 'This proof has been revoked by the issuer' :
                 'This verification link has expired'}
              </p>
            </div>

            {/* Details - Edge Table */}
            <table className="edge-table w-full mb-6" style={{ fontSize: '0.85rem' }}>
              <tbody>
                <tr>
                  <td><Zap className="w-3.5 h-3.5 inline mr-1" />Claim</td>
                  <td className="text-right text-white font-bold">{proof.claimType || proof.circuitType}</td>
                </tr>
                <tr>
                  <td><Shield className="w-3.5 h-3.5 inline mr-1" />Circuit</td>
                  <td className="text-right text-white font-mono text-xs">{proof.circuitType}</td>
                </tr>
                <tr>
                  <td><Clock className="w-3.5 h-3.5 inline mr-1" />Verified At</td>
                  <td className="text-right text-white">
                    {new Date(proof.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </td>
                </tr>
                {proof.proofTimeMs && (
                  <tr>
                    <td><Zap className="w-3.5 h-3.5 inline mr-1" />Proof Time</td>
                    <td className="text-right text-white">{(proof.proofTimeMs / 1000).toFixed(2)}s</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Privacy notice */}
            <div className="border-l-4 p-3 mb-6"
                 style={{ borderColor: 'var(--color-highlight)', background: 'var(--color-bg)' }}>
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                This verification used zero-knowledge proofs. No personal data was transmitted or stored.
                Only the YES/NO verification result is displayed.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-0">
              <button onClick={handleDownloadPDF}
                      className="btn-brutal btn-brutal-outline flex items-center justify-center gap-2 text-sm py-2.5">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button onClick={handleCopyLink}
                      className="btn-brutal btn-brutal-accent flex items-center justify-center gap-2 text-sm py-2.5">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Proof ID */}
        <p className="text-center text-[10px] mt-6 font-mono" style={{ color: '#333' }}>
          Proof ID: {proof.id}
        </p>
      </div>
    </div>
  );
}
