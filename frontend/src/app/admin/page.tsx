'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield, Users, Zap, TrendingUp, Clock, Award,
  BarChart3, CheckCircle2, XCircle, Building2, Loader2,
  Activity, ArrowRight, Lock, Eye, EyeOff, Terminal,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import VerificationBadge from '@/components/credentials/VerificationBadge';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'Stellar0281';

interface Stats {
  totalCredentials: number;
  totalProofs: number;
  totalUsers: number;
  successRate: number;
}

interface ActivityData {
  recentProofs: any[];
  recentCredentials: any[];
}

interface ChartData {
  proofs: { date: string; count: number }[];
  credentials: { date: string; count: number }[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [topIssuers, setTopIssuers] = useState<any[]>([]);
  const [allIssuers, setAllIssuers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revokeReasonMap, setRevokeReasonMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionStorage.getItem('stellarid_admin') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError('');
      sessionStorage.setItem('stellarid_admin', 'true');
    } else {
      setAuthError('Invalid password');
    }
  };

  const handleVerifyOfficial = async (id: string) => {
    let token: string | null = null;
    try {
      const stored = localStorage.getItem('stellar-id-wallet');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.token || null;
      }
    } catch {}
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/issuers/${id}/verify-official`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('Issuer officially verified!');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to verify issuer.');
    }
  };

  const handleRevokeVerification = async (id: string) => {
    const reason = revokeReasonMap[id];
    if (!reason) {
      alert('Please enter a reason for revocation.');
      return;
    }

    let token: string | null = null;
    try {
      const stored = localStorage.getItem('stellar-id-wallet');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.token || null;
      }
    } catch {}
    if (!token) return;

    try {
      const res = await fetch(`${API}/admin/issuers/${id}/revoke-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        alert('Issuer verification tier status revoked.');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to revoke verification.');
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);

    let token: string | null = null;
    try {
      const stored = localStorage.getItem('stellar-id-wallet');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.token || null;
      }
    } catch {}

    if (!token) {
      setError('Wallet not connected. Connect wallet first.');
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/admin/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/admin/activity`, { headers }).then(r => r.json()),
      fetch(`${API}/admin/chart-data`, { headers }).then(r => r.json()),
      fetch(`${API}/admin/top-issuers`, { headers }).then(r => r.json()),
      fetch(`${API}/issuers`, { headers }).then(r => r.json()),
    ])
      .then(([s, a, c, i, all_i]) => {
        if (s.error) { setError(s.error); return; }
        setStats(s);
        setActivity(a);
        setChartData(c);
        setTopIssuers(Array.isArray(i) ? i : []);
        setAllIssuers(Array.isArray(all_i) ? all_i : []);
      })
      .catch(() => setError('Failed to load analytics. Make sure backend is running and you have admin access.'))
      .finally(() => setLoading(false));
  }, [authenticated]);

  const mergedChart = (() => {
    if (!chartData) return [];
    const map: Record<string, { date: string; proofs: number; credentials: number }> = {};
    chartData.proofs.forEach(d => {
      const key = d.date?.substring(0, 10);
      if (!map[key]) map[key] = { date: key, proofs: 0, credentials: 0 };
      map[key].proofs = d.count;
    });
    chartData.credentials.forEach(d => {
      const key = d.date?.substring(0, 10);
      if (!map[key]) map[key] = { date: key, proofs: 0, credentials: 0 };
      map[key].credentials = d.count;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  // --- LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="protocol-panel max-w-sm w-full p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-indigo via-accent-purple to-transparent" />
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto flex items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <Lock className="w-6 h-6 text-accent-indigo animate-pulse" />
            </div>
            <h1 className="text-xl font-bold font-display text-foreground uppercase tracking-wider">
              Admin Gateway
            </h1>
            <p className="text-xs text-muted mt-2">Enter admin authorization key to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                placeholder="Authorization Key"
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-sm text-foreground focus:outline-none focus:border-accent-indigo/50 transition-colors pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authError && (
              <p className="text-xs text-center text-red-400 font-mono">{authError}</p>
            )}
            <button type="submit" className="w-full btn-stellar !py-3">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-accent-indigo animate-spin" />
          <span className="text-xs font-mono text-muted animate-pulse">Syncing platform metrics...</span>
        </div>
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'hsl(var(--background))' }}>
        <div className="protocol-panel max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-lg font-bold text-foreground mb-2">Authorization Failed</h2>
          <p className="text-muted text-sm mb-6 leading-relaxed">{error}</p>
          <Link href="/dashboard" className="btn-stellar-ghost !py-2.5 w-full justify-center">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const allEvents = [
    ...(activity?.recentProofs?.map(p => ({
      type: 'proof' as const,
      id: p.id,
      label: p.claim_type || p.circuit_type,
      status: p.status,
      time: p.created_at,
      detail: p.proof_time_ms ? `${(p.proof_time_ms / 1000).toFixed(2)}s` : null,
    })) || []),
    ...(activity?.recentCredentials?.map(c => ({
      type: 'credential' as const,
      id: c.id,
      label: c.credential_type,
      status: 'issued',
      time: c.issued_at,
      detail: c.issuer_name,
    })) || []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15);

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <span className="tag-orange mb-3 block w-fit">
            System Terminal
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight font-display text-foreground">
            Platform Analytics
          </h1>
          <p className="text-sm mt-3 text-muted">Platform-wide metrics and zero-knowledge activity log</p>
        </div>

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { icon: Award, label: 'Total Credentials', value: stats.totalCredentials, status: 'Active', color: 'var(--accent-indigo)' },
              { icon: Zap, label: 'Total Proofs', value: stats.totalProofs, status: 'Verified', color: 'var(--accent-purple)' },
              { icon: Users, label: 'Total Users', value: stats.totalUsers, status: 'Registered', color: 'var(--accent-indigo)' },
              { icon: TrendingUp, label: 'Success Rate', value: `${stats.successRate}%`, status: 'Stable', color: 'var(--accent-amber)' },
            ].map((stat) => (
              <div key={stat.label} className="protocol-panel p-6 hover:border-white/[0.12] transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">{stat.label}</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: stat.color }}>{stat.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/[0.04]">
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
          {/* Chart */}
          <div className="protocol-panel p-6 lg:col-span-8">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                <Activity className="w-4 h-4 text-accent-indigo" />
                30-Day Trend
              </span>
              <span className="text-[10px] font-mono text-accent-indigo uppercase">Live Telemetry</span>
            </div>
            <div className="w-full">
              {mergedChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={mergedChart}>
                    <defs>
                      <linearGradient id="gradProofs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCreds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--foreground)/0.4)', fontSize: 9, fontFamily: 'monospace' }} tickFormatter={(v: string) => v.substring(5)} axisLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--foreground)/0.4)', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(260 50% 6%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                      labelStyle={{ color: 'hsl(var(--foreground)/0.6)' }}
                    />
                    <Area type="monotone" dataKey="proofs" stroke="#6366f1" fill="url(#gradProofs)" strokeWidth={2} name="Proofs" />
                    <Area type="monotone" dataKey="credentials" stroke="#a855f7" fill="url(#gradCreds)" strokeWidth={2} name="Credentials" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted text-sm font-mono">
                  No telemetric data available yet
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="protocol-panel p-6 lg:col-span-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
              <span className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
                <Clock className="w-4 h-4 text-muted" />
                Recent Activity
              </span>
              <span className="text-[10px] font-mono text-muted uppercase">Feed</span>
            </div>
            <div className="flex-grow overflow-hidden">
              {allEvents.length > 0 ? (
                <div className="max-h-[280px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {allEvents.map((ev, i) => (
                    <div key={ev.id + i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center shrink-0">
                        {ev.type === 'proof' ? (
                          <Zap className="w-3.5 h-3.5 text-accent-indigo" />
                        ) : (
                          <Award className="w-3.5 h-3.5 text-accent-purple" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-foreground font-display uppercase tracking-wider">{ev.label.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-muted truncate">{ev.detail || ev.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                          ev.status === 'verified' || ev.status === 'issued'
                            ? 'text-accent-indigo'
                            : ev.status === 'failed' ? 'text-red-400' : 'text-muted'
                        }`}>
                          {ev.status}
                        </span>
                        <p className="text-[9px] text-muted/50 font-mono mt-0.5">{timeAgo(ev.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted text-sm">
                  No events found in feed
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Issuers */}
        {topIssuers.length > 0 && (
          <div className="protocol-panel p-6 mb-10">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4 mb-6">
              <Building2 className="w-4 h-4 text-accent-indigo" />
              <span className="font-display text-sm font-bold text-foreground">Top Active Issuers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted">
                <thead>
                  <tr className="border-b border-white/[0.06] text-muted text-[10px] uppercase font-mono tracking-wider">
                    <th className="pb-3 font-semibold">Rank</th>
                    <th className="pb-3 font-semibold">Issuer Identity</th>
                    <th className="pb-3 font-semibold">Verification Node</th>
                    <th className="pb-3 font-semibold text-right">Volume Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {topIssuers.map((issuer, idx) => (
                    <tr key={issuer.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 font-mono font-bold text-accent-indigo">#{idx + 1}</td>
                      <td className="py-4 font-bold text-foreground">{issuer.name}</td>
                      <td className="py-4">
                        {issuer.verified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-accent-indigo border border-indigo-500/20">Verified</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/[0.04] text-muted border border-white/[0.06]">Pending</span>
                        )}
                      </td>
                      <td className="py-4 text-right font-mono text-foreground font-bold">{issuer.credential_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manage Issuer Verification Tiers */}
        <div className="protocol-panel p-6">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4 mb-6">
            <ShieldCheck className="w-4 h-4 text-accent-indigo" />
            <span className="font-display text-sm font-bold text-foreground">Manage Issuer Verification Tiers</span>
          </div>

          {allIssuers.length === 0 ? (
            <p className="text-xs text-muted font-mono">No issuers registered on the platform.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-muted">
                <thead>
                  <tr className="border-b border-white/[0.06] text-muted text-[10px] uppercase font-mono tracking-wider">
                    <th className="pb-3 font-semibold">Issuer</th>
                    <th className="pb-3 font-semibold">Stellar Address</th>
                    <th className="pb-3 font-semibold">Current Status</th>
                    <th className="pb-3 font-semibold">Domain / Peer Rating</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allIssuers.map((issuer) => (
                    <tr key={issuer.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          {issuer.logo_url && (
                            <img src={issuer.logo_url} alt="" className="w-6 h-6 rounded-md bg-zinc-800" />
                          )}
                          <div>
                            <div>{issuer.name}</div>
                            <div className="text-[10px] text-muted font-normal mt-0.5">{issuer.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-[11px]">
                        {issuer.stellar_address ? `${issuer.stellar_address.substring(0, 8)}...${issuer.stellar_address.substring(issuer.stellar_address.length - 8)}` : 'N/A'}
                      </td>
                      <td className="py-4">
                        <VerificationBadge status={issuer.verification_status} />
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono">
                            Domain: {issuer.domain ? (
                              <span className={issuer.domain_verified ? 'text-green-400' : 'text-yellow-400'}>
                                {issuer.domain} ({issuer.domain_verified ? 'Verified' : 'Pending'})
                              </span>
                            ) : 'None'}
                          </div>
                          <div className="text-[10px] font-mono text-muted">
                            Peer Endorsements: {issuer.endorsement_count || 0}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                          {issuer.verification_status !== 'official_verified' && (
                            <button
                              onClick={() => handleVerifyOfficial(issuer.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                            >
                              Verify Officially
                            </button>
                          )}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Reason..."
                              value={revokeReasonMap[issuer.id] || ''}
                              onChange={(e) => setRevokeReasonMap({
                                ...revokeReasonMap,
                                [issuer.id]: e.target.value
                              })}
                              className="px-2 py-1 bg-white/[0.02] border border-white/[0.06] rounded-md text-[10px] text-foreground focus:outline-none focus:border-indigo-500/50 w-28"
                            />
                            <button
                              onClick={() => handleRevokeVerification(issuer.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 font-semibold text-[11px] transition-colors"
                            >
                              Revoke Status
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
