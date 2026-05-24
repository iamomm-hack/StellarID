'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import ConnectWallet from '../../../components/wallet/ConnectWallet';
import { reputationApi } from '../../../lib/api';

// Components
import ReputationScoreCard from '../../../components/reputation/ReputationScoreCard';
import ScoreBreakdown from '../../../components/reputation/ScoreBreakdown';
import ReputationHistory from '../../../components/reputation/ReputationHistory';
import TierProgressBar from '../../../components/reputation/TierProgressBar';
import LeaderboardWidget from '../../../components/reputation/LeaderboardWidget';

export default function ReputationDashboard() {
  const { address, isConnected } = useWalletStore();
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const fetchReputationData = async (walletAddress: string) => {
    try {
      setError(null);
      const [repRes, histRes] = await Promise.all([
        reputationApi.getReputation(walletAddress),
        reputationApi.getHistory(walletAddress)
      ]);
      setData(repRes.data);
      setHistory(histRes.data);
    } catch (err: any) {
      console.error('Error fetching reputation details:', err);
      setError(err?.response?.data?.error || 'Failed to sync reputation indexes.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!address) return;
    setIsRecalculating(true);
    try {
      await reputationApi.recalculate(address);
      await fetchReputationData(address);
    } catch (err: any) {
      console.error('Failed to recalculate:', err);
      setError(err?.response?.data?.error || 'Failed to recalculate reputation.');
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchReputationData(address);
    }
  }, [isConnected, address]);

  // Auth Guard
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="protocol-panel max-w-md w-full p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Identity Score Lock</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Connect your Stellar wallet to decrypt reputation scores, streaks, and view the global builder leaderboard.
          </p>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-[1440px] mx-auto px-8 pt-10 relative z-10">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Control Center
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
              Identity Reputation Index
            </h1>
            <p className="text-sm text-muted mt-2 max-w-2xl leading-relaxed">
              Unlock verified builder status. Your rating dynamically scales based on verification count, issuer trust quotients, and network activity streaks.
            </p>
          </div>
          {data && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-5 py-2.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-mono uppercase tracking-wider hover:bg-indigo-500/20 active:bg-indigo-500/30 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate Rating
            </button>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs font-mono text-muted">Synchronising cryptographic score data...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            
            {/* Top row: Circular rating & Progression / Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-1">
                <ReputationScoreCard
                  score={data?.total_score || 0}
                  tier={data?.tier || 'Verified'}
                  credentialCount={data?.credential_count || 0}
                  onRecalculate={handleRecalculate}
                  isRecalculating={isRecalculating}
                />
              </div>
              <div className="lg:col-span-2 flex flex-col gap-6">
                <TierProgressBar score={data?.total_score || 0} />
                <ReputationHistory history={history} />
              </div>
            </div>

            {/* Middle row: Detailed Breakdown */}
            <div className="w-full">
              <ScoreBreakdown
                breakdown={data?.breakdown || []}
                bonuses={data?.bonuses || []}
              />
            </div>

            {/* Bottom row: Leaderboard */}
            <div className="w-full">
              <LeaderboardWidget />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
