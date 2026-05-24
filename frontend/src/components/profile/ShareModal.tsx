'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, Twitter, Linkedin, Copy, Check, Download, Share2 } from 'lucide-react';
import { profileApi } from '../../lib/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  displayName: string;
}

interface ShareData {
  profile_url: string;
  twitter_intent: string;
  linkedin_share: string;
  og_image_url: string;
}

export default function ShareModal({ isOpen, onClose, walletAddress, displayName }: ShareModalProps) {
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && walletAddress) {
      setLoading(true);
      profileApi.getShareUrls(walletAddress)
        .then((res) => {
          setShareData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to fetch share URLs', err);
          setLoading(false);
        });
    }
  }, [isOpen, walletAddress]);

  const handleCopyLink = () => {
    if (!shareData) return;
    navigator.clipboard.writeText(shareData.profile_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!shareData) return;
    try {
      const response = await fetch(shareData.og_image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${displayName}_StellarID.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      // Fallback: open in new tab
      window.open(shareData.og_image_url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[500px] rounded-3xl border border-white/[0.08] bg-[#0b081c] p-6 shadow-2xl overflow-hidden text-foreground z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/[0.05] transition-colors text-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-black tracking-tight mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" /> Share Developer Card
          </h3>

          {/* OG Image Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 aspect-[1200/630] mb-6 flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-muted font-mono">Generating Card Image...</span>
              </div>
            ) : shareData ? (
              <Image
                src={shareData.og_image_url}
                alt="StellarID Card Preview"
                className="w-full h-full object-cover"
                width={1200}
                height={630}
                unoptimized
              />
            ) : (
              <span className="text-xs text-muted font-mono">Failed to load preview</span>
            )}
          </div>

          {/* Share links & Download */}
          <div className="space-y-4">
            <button
              onClick={handleDownload}
              disabled={loading || !shareData}
              className="w-full btn-stellar flex items-center justify-center gap-2 py-3 rounded-2xl font-bold tracking-wide disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Download Card PNG
            </button>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={shareData?.twitter_intent || '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.06] bg-[#1d9bf0]/10 hover:bg-[#1d9bf0]/20 text-[#1d9bf0] font-bold text-sm transition-colors ${
                  !shareData ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <Twitter className="w-4 h-4 fill-current" /> Twitter / X
              </a>

              <a
                href={shareData?.linkedin_share || '#'}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.06] bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] font-bold text-sm transition-colors ${
                  !shareData ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <Linkedin className="w-4 h-4 fill-current" /> LinkedIn
              </a>
            </div>

            {/* Profile Link Input */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-muted truncate flex-1 select-all">
                {shareData?.profile_url || 'Generating profile link...'}
              </span>
              <button
                onClick={handleCopyLink}
                disabled={loading || !shareData}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
