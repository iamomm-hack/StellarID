'use client';

import { useState } from 'react';
import { Download, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
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

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    window.open(`${API}/proofs/${publicToken}/pdf`, '_blank');
    toast.success('PDF download started');
  };

  const handleOpenVerify = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative rounded-2xl glass p-7 border border-[#00e676]/20 max-w-md w-full">
        {/* Glow */}
        <div className="absolute inset-0 bg-[#00e676]/3 rounded-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="text-center mb-5">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#00e676]/15 flex items-center justify-center">
              <Share2 className="w-7 h-7 text-[#00e676]" />
            </div>
            <h3 className="text-lg font-bold">Proof Generated</h3>
            <p className="text-xs text-white/40 mt-1">Your ZK proof is ready to share</p>
          </div>

          {/* Proof info */}
          <div className="rounded-xl bg-white/[0.03] p-4 mb-5 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Claim</span>
              <span className="font-medium">{claimType || circuitType}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/40">Status</span>
              <span className="text-[#00e676] font-medium">Verified</span>
            </div>
          </div>

          {/* Share URL */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 mb-5">
            <p className="text-[10px] text-white/30 mb-1">VERIFICATION LINK</p>
            <p className="text-xs font-mono text-[#7c3aed] truncate">{shareUrl}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Share Link'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={handleOpenVerify}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 text-white/60 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Open Page
              </button>
            </div>
          </div>

          <button onClick={onClose} className="w-full mt-4 text-xs text-white/30 hover:text-white/50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
