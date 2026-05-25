'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../store/walletStore';
import { useWallet } from '../../hooks/useWallet';
import { reputationApi } from '../../lib/api';
import ConnectWallet from '../../components/wallet/ConnectWallet';

// Icons
import {
  Shield, CheckCircle2, AlertCircle, Loader2,
  Lock, Terminal, Cpu, ArrowRight, Sparkles
} from 'lucide-react';

function VerifyDiscordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { address, isConnected } = useWalletStore();
  const { connect: connectWallet, loading: connectLoading } = useWallet();

  // State
  const [loading, setLoading] = useState(true);
  const [discordUser, setDiscordUser] = useState<{ id: string; username: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch token metadata on load
  useEffect(() => {
    if (!token) {
      setError('Missing verification token. Please start the link process in Discord using the /verify command.');
      setLoading(false);
      return;
    }

    reputationApi.getDiscordTokenData(token)
      .then((res) => {
        setDiscordUser({
          id: res.data.discord_id,
          username: res.data.discord_username
        });
      })
      .catch((err) => {
        console.error('Token fetch error:', err);
        setError('Invalid or expired verification token. Please generate a new link in Discord.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleLinkDiscord = async () => {
    if (!token || !discordUser || !address) return;
    setIsLinking(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const freighter = await import('@stellar/freighter-api');
      
      const message = `StellarID: Link my Discord account ${discordUser.username} (${discordUser.id}) to wallet ${address}`;
      const blob = btoa(message);

      let signatureResult: any;
      try {
        signatureResult = await freighter.signBlob(blob, { accountToSign: address });
      } catch (signErr: any) {
        throw new Error(`Signature rejected: ${signErr?.message || 'Transaction signing cancelled'}`);
      }

      const signature = typeof signatureResult === 'string'
        ? signatureResult
        : signatureResult?.signature || signatureResult?.signedXDR || signatureResult;

      if (!signature) {
        throw new Error('Signature was not returned by wallet');
      }

      await reputationApi.linkDiscord({
        token,
        stellar_address: address,
        signature,
        message
      });

      setSuccess(true);
    } catch (err: any) {
      console.error('Linking error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to verify signature');
    } finally {
      setIsLinking(false);
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-indigo mx-auto" />
          <p className="font-mono text-xs text-muted tracking-wider">RESOLVING DISCORD HANDSHAKE...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error && !discordUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="protocol-panel max-w-md w-full p-8 text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-xl font-bold mb-3">Verification Failed</h1>
          <p className="text-muted text-xs leading-relaxed mb-6 font-mono">
            {error}
          </p>
          <div className="flex justify-center">
            <Link href="/" className="btn-stellar-ghost !py-2 !px-4 !text-[10px]">
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="verify-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="protocol-panel max-w-lg w-full p-8 lg:p-10 relative overflow-hidden"
          >
            {/* Cyberpunk grid background element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-indigo/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-indigo" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent-indigo uppercase tracking-widest font-bold">Secure Gateway</span>
                <h1 className="text-xl font-bold">Discord Verification</h1>
              </div>
            </div>

            <div className="space-y-6">
              {/* Discord Account Details */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-1">Target Account</p>
                  <p className="text-sm font-bold text-foreground">@{discordUser?.username}</p>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                  <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider">Discord Ready</span>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-mono text-muted uppercase tracking-wider">Linking Wallet</p>
                  {isConnected && (
                    <span className="tag-orange !py-0.5 !px-2 !text-[8px] font-mono">Connected</span>
                  )}
                </div>
                
                {isConnected ? (
                  <p className="text-xs font-mono text-foreground truncate select-all bg-white/[0.01] px-2 py-1.5 rounded border border-white/[0.04]">
                    {address}
                  </p>
                ) : (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[11px] text-muted font-sans mr-4">
                      Please connect your Stellar wallet to complete the link.
                    </p>
                    <button
                      onClick={connectWallet}
                      disabled={connectLoading}
                      className="btn-stellar !py-2 !px-4 !text-[10px] shrink-0"
                    >
                      {connectLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Connecting...</>
                      ) : (
                        'Connect Wallet'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Steps / Disclaimer */}
              <div className="space-y-3 font-sans text-xs text-muted leading-relaxed p-1 bg-white/[0.01] rounded-lg">
                <div className="flex items-start gap-2.5">
                  <Terminal className="w-4 h-4 text-accent-indigo mt-0.5 shrink-0" />
                  <p>
                    We require a cryptographic signature verification to link your Discord account with your Stellar address. This action is gasless and doesn&apos;t cost any network fees.
                  </p>
                </div>
              </div>

              {/* Error warning block */}
              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] font-mono text-red-400 leading-normal">{error}</p>
                </div>
              )}

              {/* Action Button */}
              {isConnected && (
                <button
                  onClick={handleLinkDiscord}
                  disabled={isLinking || !discordUser}
                  className="w-full btn-stellar flex items-center justify-center gap-2 group !py-3.5"
                >
                  {isLinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Signature...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Confirm &amp; Sign Message</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: 'spring', damping: 25 }}
            className="protocol-panel max-w-md w-full p-8 lg:p-10 text-center relative overflow-hidden"
          >
            {/* Ambient glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold block mb-1">Handshake Completed</span>
            <h1 className="text-2xl font-bold mb-4">Discord Account Linked</h1>
            
            <p className="text-muted text-xs leading-relaxed mb-8 max-w-sm mx-auto">
              Your Discord account <strong className="text-foreground">@{discordUser?.username}</strong> has been successfully linked to your Stellar address. Your server role tiers will be synced shortly.
            </p>

            <div className="flex flex-col gap-2.5">
              <Link href="/dashboard" className="w-full btn-stellar !py-3">
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') window.close();
                }}
                className="w-full btn-stellar-ghost !py-2.5 text-muted hover:text-white"
              >
                Close Window
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VerifyDiscordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent-indigo mx-auto" />
          <p className="font-mono text-xs text-muted tracking-wider">LOADING HANDSHAKE SYSTEM...</p>
        </div>
      </div>
    }>
      <VerifyDiscordContent />
    </Suspense>
  );
}
