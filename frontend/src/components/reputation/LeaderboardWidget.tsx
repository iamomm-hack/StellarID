'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, Medal, ArrowUpRight, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reputationApi } from '../../lib/api';
import { useWalletStore } from '../../store/walletStore';

interface LeaderboardUser {
  rank: number;
  wallet_address: string;
  total_score: number;
  tier: string;
  credential_count: number;
  display_name: string;
  avatar_url: string | null;
  member_since: string;
}

export default function LeaderboardWidget() {
  const currentWallet = useWalletStore((state) => state.address);
  const [filter, setFilter] = useState<'global' | 'verified' | 'elite'>('global');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await reputationApi.getLeaderboard(filter, 100);
      if (res.data && Array.isArray(res.data.leaderboard)) {
        setUsers(res.data.leaderboard);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, page]);

  // Client-side search filtering
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.display_name.toLowerCase().includes(term) ||
      u.wallet_address.toLowerCase().includes(term) ||
      u.tier.toLowerCase().includes(term)
    );
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 2:
        return <Medal className="w-4 h-4 text-slate-300" />;
      case 3:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="text-[10px] font-mono text-muted">{rank}</span>;
    }
  };

  const truncateWallet = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getTierColorClass = (tier: string) => {
    switch (tier) {
      case 'Elite Builder':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Proven':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md flex flex-col w-full">
      {/* Header section with title and search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-mono tracking-[0.2em] text-muted uppercase flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Global Rankings
          </h3>
          <p className="text-xs text-muted mt-1">Top developers building in the Stellar ecosystem.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search wallet, GitHub username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-white/[0.06] bg-white/[0.02] text-foreground placeholder-muted focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all duration-300"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-6 border-b border-white/[0.04] pb-4">
        {(['global', 'verified', 'elite'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all duration-300 ${
              filter === tab
                ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-muted hover:text-foreground hover:bg-white/[0.02]'
            }`}
          >
            {tab === 'global' ? 'All Builders' : tab === 'verified' ? 'Verified Only' : 'Elite Builders'}
          </button>
        ))}
      </div>

      {/* Rankings List / Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.04] text-[9px] font-mono text-muted uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th className="py-3 px-4">Builder</th>
              <th className="py-3 px-4 hidden md:table-cell">Tier</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Credentials</th>
              <th className="py-3 px-4 text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-[10px] font-mono text-muted">Retrieving Leaderboard...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-muted">
                    No builders found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, idx) => {
                  const isSelf = currentWallet && user.wallet_address.toLowerCase() === currentWallet.toLowerCase();
                  return (
                    <motion.tr
                      key={user.wallet_address || idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                      className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors duration-200 ${
                        isSelf ? 'bg-indigo-500/[0.04]' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <div className="flex items-center justify-center h-5 w-5 mx-auto">
                          {getRankIcon(user.rank)}
                        </div>
                      </td>

                      {/* Builder Name & Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.display_name}
                                className="w-6 h-6 rounded-full border border-white/[0.08]"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center text-[10px] font-mono font-bold">
                                {user.display_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {isSelf && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 border border-black" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground flex items-center gap-1">
                              {user.display_name}
                              {user.avatar_url && (
                                <Github className="w-2.5 h-2.5 text-muted inline" />
                              )}
                              {isSelf && (
                                <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] font-mono text-muted">
                              {truncateWallet(user.wallet_address)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold tracking-wide uppercase ${getTierColorClass(user.tier)}`}>
                          {user.tier}
                        </span>
                      </td>

                      {/* Credentials claimed count */}
                      <td className="py-3.5 px-4 text-center hidden sm:table-cell font-mono text-[11px] text-muted">
                        {user.credential_count}
                      </td>

                      {/* Reputation Rating */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <span>{user.total_score}</span>
                          <ArrowUpRight className="w-3 h-3 text-muted/50" />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
