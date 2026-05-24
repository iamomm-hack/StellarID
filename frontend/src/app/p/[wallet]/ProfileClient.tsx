'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Loader2, ShieldAlert, Cpu, CheckCircle2, Activity } from 'lucide-react';
import Link from 'next/link';
import { profileApi } from '../../../lib/api';
import StellarIDCard from '../../../components/profile/StellarIDCard';
import ShareModal from '../../../components/profile/ShareModal';

interface ProfileClientProps {
  wallet: string;
}

export default function ProfileClient({ wallet }: ProfileClientProps) {
  const [cardData, setCardData] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!wallet) return;

    setLoading(true);
    setError(null);

    Promise.all([
      profileApi.getCardData(wallet),
      profileApi.getCredentials(wallet)
    ])
      .then(([cardRes, credRes]) => {
        setCardData(cardRes.data);
        setCredentials(credRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching public profile details:', err);
        setError('Failed to fetch profile. Make sure the wallet address is correct.');
        setLoading(false);
      });
  }, [wallet]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-sm font-mono text-muted text-center">Retrieving developer profile...</p>
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Profile Error</h3>
          <p className="text-sm text-muted mb-6">{error || 'Profile not found'}</p>
          <Link href="/" className="btn-stellar inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-xs font-bold">
            <ArrowLeft className="w-4 h-4" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden py-12 px-4 md:px-8">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1000px] mx-auto relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-foreground transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to StellarID
          </Link>

          <button
            onClick={() => setIsShareOpen(true)}
            className="btn-stellar flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-bold tracking-wide shadow-lg shadow-purple-500/10 w-full sm:w-auto"
          >
            <Share2 className="w-4 h-4" /> Share Developer Profile
          </button>
        </div>

        {/* Profile Card & Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Section */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <StellarIDCard cardData={cardData} />
          </div>

          {/* Additional details list */}
          <div className="lg:col-span-5 space-y-6 w-full max-w-[640px] mx-auto lg:mx-0">
            
            {/* Credentials timeline list */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-md">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>Verification Activity</span>
              </h3>

              {credentials.length > 0 ? (
                <div className="relative pl-6 border-l border-white/[0.06] space-y-6 ml-2">
                  {credentials.map((cred) => (
                    <div key={cred.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#0c081c] border-2 border-purple-500/60 flex items-center justify-center group-hover:border-purple-400 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      </span>

                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-muted mb-0.5">
                          {new Date(cred.issued_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-xs font-bold text-foreground mb-0.5">
                          {cred.credential_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                        <span className="text-[10px] text-muted font-medium">
                          Verified by {cred.issuer.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted font-mono">
                  No verification activities found.
                </div>
              )}
            </div>

            {/* Verification Stats */}
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.01] p-6 backdrop-blur-md">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-muted mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Identity Integrity</span>
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">On-Chain Security</span>
                  <span className="font-mono text-foreground">ECDSA / Soroban</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">ZKP Compliance</span>
                  <span className="font-mono text-foreground">Groth16 Verifiable</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Revocation Protocol</span>
                  <span className="font-mono text-foreground">Immediate Sync</span>
                </div>
                <div className="h-px bg-white/[0.06] my-2" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Validation Status</span>
                  <span className="font-bold text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographically Valid
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        walletAddress={wallet}
        displayName={cardData.display_name}
      />
    </div>
  );
}
