'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Clock,
  Zap,
  Check,
  AlertTriangle,
  Loader2,
  Fingerprint,
  Award,
  ExternalLink,
  Mail,
  User,
  Wallet,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '../../../hooks/useWallet';
import api from '../../../lib/api';

interface ClaimClientProps {
  token: string;
}

interface PendingCredential {
  id: string;
  recipientEmail: string;
  recipientWallet: string | null;
  credentialType: string;
  credentialData: any;
  expiresAt: string;
  status: string;
  claimedAt: string | null;
  issuer: {
    name: string;
    logo_url: string;
    verified: boolean;
  };
}

const typeLabels: Record<string, string> = {
  age_verification: 'Age Verification',
  github_developer: 'Developer Identity',
  linkedin_professional: 'Professional Credential',
  income_check: 'Financial Proof',
  student: 'Education Verify',
  us_resident: 'Residency Node',
  accredited_investor: 'Investor Seal',
  stellar_hackathon_winner: 'Stellar Hackathon Winner',
  hackathon_winner: 'Stellar Hackathon Winner',
};

export default function ClaimClient({ token }: ClaimClientProps) {
  const { connect, address, isConnected, loading: walletLoading, error: walletError } = useWallet();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<PendingCredential | null>(null);
  
  // Claiming states
  const [claiming, setClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState<{ txHash: string; credentialId: string } | null>(null);
  const [showWalletHelp, setShowWalletHelp] = useState(false);

  // Fetch pending credential details
  const fetchCredential = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/credentials/claim/${token}`);
      setCredential(data);
    } catch (err: any) {
      console.error('Fetch claim error:', err);
      setError(err.response?.data?.error || 'Failed to load claim invitation details');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCredential();
    }
  }, [token, fetchCredential]);

  // Execute Claim request
  const handleClaim = async () => {
    if (!address) {
      toast.error('Please connect your Freighter wallet first');
      return;
    }
    setClaiming(true);
    try {
      const { data } = await api.post(`/credentials/claim/${token}`, {
        walletAddress: address
      });
      if (data.success) {
        setClaimedData({
          txHash: data.txHash,
          credentialId: data.credentialId
        });
        toast.success('Credential claimed successfully!');
      } else {
        throw new Error(data.error || 'Failed to claim credential');
      }
    } catch (err: any) {
      console.error('Claim error:', err);
      toast.error(err.response?.data?.error || err.message || 'Error occurred while claiming');
    } finally {
      setClaiming(false);
    }
  };

  // --- SKELETON LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse mx-auto" />
          <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-8 space-y-6">
            <div className="flex justify-between">
              <div className="h-10 w-10 bg-white/5 rounded-xl animate-pulse" />
              <div className="space-y-2 text-right">
                <div className="h-5 w-32 bg-white/5 rounded animate-pulse ml-auto" />
                <div className="h-3 w-16 bg-white/5 rounded animate-pulse ml-auto" />
              </div>
            </div>
            <div className="space-y-4 pt-4">
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-12 w-full bg-white/5 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  // --- EXPIRED / CLAIMED STATE FROM API (before local claiming) ---
  if (error || !credential) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="protocol-panel max-w-md w-full p-8 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-foreground mb-3">Claim Invitation Error</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            {error || 'This claim token is either invalid, already claimed, or has expired.'}
          </p>
          <div className="space-y-3">
            <button onClick={fetchCredential} className="btn-stellar w-full">
              Retry Load
            </button>
            <a href="/" className="btn-stellar-ghost w-full block">
              Return Home
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check if status is already claimed
  const isAlreadyClaimed = credential.status === 'claimed' || claimedData !== null;
  const isExpired = credential.status === 'expired';

  // --- EXPIRED VIEW ---
  if (isExpired) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="protocol-panel max-w-md w-full p-8 text-center"
        >
          <Clock className="w-12 h-12 text-amber-400 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-foreground mb-3">Invitation Expired</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            This invitation link expired on {new Date(credential.expiresAt).toLocaleDateString()}. Please contact the issuer to request a new credential.
          </p>
          <a href="/" className="btn-stellar-ghost w-full block">
            Return Home
          </a>
        </motion.div>
      </div>
    );
  }

  // --- CLAIM SUCCESSFUL / CELEBRATION VIEW ---
  if (isAlreadyClaimed) {
    const finalTxHash = claimedData?.txHash || '';
    const displayTxHash = finalTxHash ? `${finalTxHash.slice(0, 10)}...${finalTxHash.slice(-8)}` : 'On-Chain Minted';

    return (
      <div className="min-h-[90vh] relative overflow-hidden flex flex-col items-center justify-center p-6">
        {/* Confetti Particles (Framer Motion) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const size = Math.random() * 8 + 4;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: ['#6366f1', '#a855f7', '#fcd34d', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)],
                  left: `${Math.random() * 100}%`,
                  bottom: '0%'
                }}
                animate={{
                  y: ['0vh', `-${Math.random() * 60 + 40}vh`],
                  x: [`0px`, `${(Math.random() - 0.5) * 200}px`],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 1, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                  ease: 'easeOut'
                }}
              />
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative z-10 max-w-md w-full space-y-8 text-center"
        >
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
            <div className="w-16 h-16 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-display text-emerald-400">
              Claim Complete!
            </h1>
            <p className="text-muted text-sm max-w-xs mx-auto">
              Your credential is now secure and minted on the Stellar ledger.
            </p>
          </div>

          {/* Claimed Credential Card */}
          <div className="protocol-panel text-left p-6 space-y-6 relative overflow-hidden border-emerald-500/20 bg-white/[0.01]">
            <div className="absolute top-3 right-3">
              <span className="tag-green !py-0.5 !px-2 !text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Claimed
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-accent-indigo">
                <Award className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h3 className="text-sm font-bold text-foreground">
                  {typeLabels[credential.credentialType] || credential.credentialType.replace(/_/g, ' ')}
                </h3>
                <span className="text-[9px] font-mono text-muted">StellarID Credential</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <span className="text-[9px] font-mono text-muted block mb-1">Issuer</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{credential.issuer.name}</span>
                  {credential.issuer.verified && <ShieldCheck className="w-3.5 h-3.5 text-accent-indigo" />}
                </div>
              </div>

              {finalTxHash && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-mono text-muted block mb-0.5">Stellar Ledger TX</span>
                    <span className="text-[10px] font-mono text-foreground/80">{displayTxHash}</span>
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${finalTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-muted hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <a href="/dashboard" className="btn-stellar w-full flex items-center justify-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- ACTIVE VALID CLAIM FORM VIEW ---
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent-indigo/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-indigo/20 bg-accent-indigo/5">
            <Shield className="w-3.5 h-3.5 text-accent-indigo" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-accent-indigo">
              Claim Invitation
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            Claim Your Credential
          </h1>
          <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
            You received a secure credential from <span className="text-foreground font-semibold">{credential.issuer.name}</span>. Connect your wallet to claim it.
          </p>
        </div>

        {/* Dynamic Card Preview */}
        <div className="protocol-panel p-6 space-y-6 bg-white/[0.01]">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-accent-indigo">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-right">
              <h3 className="text-sm font-bold text-foreground">
                {typeLabels[credential.credentialType] || credential.credentialType.replace(/_/g, ' ')}
              </h3>
              <span className="text-[9px] font-mono text-muted">Claim Preview</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono text-muted block mb-0.5">Issuer</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-foreground">{credential.issuer.name}</span>
                  {credential.issuer.verified && <ShieldCheck className="w-3.5 h-3.5 text-accent-indigo" />}
                </div>
              </div>
              <span className="tag-orange !py-0.5 !px-2 !text-[8px]">
                Pending
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <span className="text-[9px] font-mono text-muted block mb-0.5">Expires</span>
                <span className="text-[11px] font-mono text-amber-400">
                  {new Date(credential.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <span className="text-[9px] font-mono text-muted block mb-0.5">Recipient</span>
                <span className="text-[11px] font-mono text-foreground/85 truncate block">
                  {credential.recipientEmail}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
          {!isConnected ? (
            <div className="space-y-3">
              <button
                onClick={connect}
                disabled={walletLoading}
                className="btn-stellar w-full py-4 text-xs flex items-center justify-center gap-2"
              >
                {walletLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Freighter Wallet
                  </>
                )}
              </button>

              {walletError && (
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl text-center">
                  <p className="text-[10px] font-mono text-red-400">
                    {walletError.includes('Freighter') ? (
                      <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Freighter extension not found. Click to install.
                      </a>
                    ) : walletError}
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowWalletHelp(!showWalletHelp)}
                className="w-full text-center text-[10px] font-mono uppercase tracking-wider text-muted hover:text-accent-indigo transition-colors"
              >
                I don&apos;t have a wallet
              </button>

              <AnimatePresence>
                {showWalletHelp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-[11px] text-muted leading-relaxed space-y-2">
                      <p>
                        StellarID credentials are secure, self-sovereign tokens stored directly on the Stellar blockchain.
                      </p>
                      <p>
                        To own and use them, you need a Stellar wallet. We recommend **Freighter** (the official browser extension wallet from the Stellar Development Foundation).
                      </p>
                      <a
                        href="https://www.freighter.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent-indigo font-semibold hover:underline"
                      >
                        Get Freighter Wallet <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-accent-indigo animate-pulse" />
                  <div className="text-left">
                    <span className="text-[9px] font-mono text-muted block leading-none">Connected wallet</span>
                    <span className="text-[11px] font-mono text-foreground font-semibold">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                    </span>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className="btn-stellar w-full py-4 text-xs flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Minting on Stellar Ledger...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirm & Claim Credential
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
