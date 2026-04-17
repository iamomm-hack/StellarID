'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Users, Zap, TrendingUp, Clock, Award,
  BarChart3, CheckCircle2, XCircle, Building2, Loader2,
  Activity, ArrowRight, Lock, Eye, EyeOff,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    ])
      .then(([s, a, c, i]) => {
        if (s.error) { setError(s.error); return; }
        setStats(s);
        setActivity(a);
        setChartData(c);
        setTopIssuers(Array.isArray(i) ? i : []);
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
      <div className="min-h-screen flex items-center justify-center px-6"
           style={{ background: 'var(--color-bg)' }}>
        <div className="brutal-card max-w-sm w-full">
          <div className="card-header-brutal">
            <span>Admin Access</span>
            <span>[LOCKED]</span>
          </div>
          <div className="card-body-brutal">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto flex items-center justify-center border border-[#333] mb-3"
                   style={{ background: 'var(--color-bg)' }}>
                <Lock className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h1 className="text-lg font-bold uppercase tracking-wider"
                  style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                Authenticate
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Enter admin password to continue</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(''); }}
                  placeholder="Enter password"
                  className="edge-input pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && (
                <p className="text-xs text-center" style={{ color: 'var(--color-accent)' }}>{authError}</p>
              )}
              <button type="submit" className="w-full btn-brutal btn-brutal-accent">
                Authenticate
              </button>
            </form>
            <p className="text-center text-[10px] mt-4" style={{ color: '#333' }}>
              StellarID Admin Panel
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="w-12 h-12 border-2 border-[#333] border-t-[var(--color-accent)]"
             style={{ animation: 'spin-slow 0.8s linear infinite' }} />
      </div>
    );
  }

  // --- ERROR ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--color-bg)' }}>
        <div className="brutal-card max-w-md w-full">
          <div className="card-header-brutal">
            <span>Admin Panel</span>
            <span>[ERROR]</span>
          </div>
          <div className="card-body-brutal text-center py-12">
            <Shield className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--color-accent)' }} />
            <p className="text-[var(--color-text-muted)] text-sm mb-4">{error}</p>
            <a href="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--color-accent)' }}>
              Back to Dashboard →
            </a>
          </div>
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
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 reveal-wrap">
          <div className="reveal-content delay-1">
            <span className="block text-sm font-bold uppercase tracking-[0.2em] mb-2"
                  style={{ color: 'var(--color-accent)' }}>
              // Admin Panel
            </span>
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Analytics
            </h1>
            <p className="text-sm mt-2 text-[var(--color-text-muted)]">Platform-wide metrics and activity overview</p>
          </div>
        </div>

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-8">
            {[
              { icon: Award, label: 'Total Credentials', value: stats.totalCredentials },
              { icon: Zap, label: 'Total Proofs', value: stats.totalProofs },
              { icon: Users, label: 'Total Users', value: stats.totalUsers },
              { icon: TrendingUp, label: 'Success Rate', value: `${stats.successRate}%` },
            ].map((stat, idx) => (
              <div key={stat.label} className="brutal-card">
                <div className="card-header-brutal"
                     style={idx === 0 ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' } : {}}>
                  <span>{stat.label}</span>
                </div>
                <div className="card-body-brutal flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center border border-[#333]"
                       style={{ background: 'var(--color-bg)' }}>
                    <stat.icon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <span className="text-2xl font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart + Activity */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-0 mb-8">
          {/* Chart */}
          <div className="brutal-card">
            <div className="card-header-brutal" style={{ background: 'var(--color-highlight)', color: 'var(--color-bg)' }}>
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                30-Day Trend
              </span>
              <span>[LIVE]</span>
            </div>
            <div className="card-body-brutal">
              {mergedChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={mergedChart}>
                    <defs>
                      <linearGradient id="gradProofs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4ff00" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#d4ff00" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCreds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff3c00" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ff3c00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v: string) => v.substring(5)} axisLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#121212', border: '1px solid #333', borderRadius: '0', fontSize: '12px', fontFamily: 'Space Mono, monospace' }}
                      labelStyle={{ color: '#888' }}
                    />
                    <Area type="monotone" dataKey="proofs" stroke="#d4ff00" fill="url(#gradProofs)" strokeWidth={2} name="Proofs" />
                    <Area type="monotone" dataKey="credentials" stroke="#ff3c00" fill="url(#gradCreds)" strokeWidth={2} name="Credentials" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                  No data yet — activity will appear here
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="brutal-card">
            <div className="card-header-brutal">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Activity
              </span>
              <span>[FEED]</span>
            </div>
            <div className="card-body-brutal p-0">
              {allEvents.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto">
                  {allEvents.map((ev, i) => (
                    <div key={ev.id + i} className="flex items-center gap-3 px-4 py-3 border-b border-[#222] hover:bg-white/[0.02] transition-colors">
                      {ev.type === 'proof' ? (
                        <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--color-highlight)' }} />
                      ) : (
                        <Award className="w-4 h-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-white uppercase tracking-wider">{ev.label}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{ev.detail || ev.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          ev.status === 'verified' || ev.status === 'issued'
                            ? 'text-[var(--color-highlight)]'
                            : ev.status === 'failed' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                        }`}>
                          {ev.status}
                        </span>
                        <p className="text-[10px] text-[#333]">{timeAgo(ev.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Issuers */}
        {topIssuers.length > 0 && (
          <div className="brutal-card">
            <div className="card-header-brutal">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Top Issuers
              </span>
              <span>[RANKING]</span>
            </div>
            <div className="card-body-brutal p-0">
              <div className="overflow-x-auto">
                <table className="edge-table w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Issuer</th>
                      <th>Status</th>
                      <th className="text-right">Credentials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topIssuers.map((issuer, idx) => (
                      <tr key={issuer.id}>
                        <td>{idx + 1}</td>
                        <td className="text-white font-bold">{issuer.name}</td>
                        <td>
                          {issuer.verified ? (
                            <span className="badge-valid">Verified</span>
                          ) : (
                            <span className="badge-expired">Pending</span>
                          )}
                        </td>
                        <td className="text-right font-mono text-white">{issuer.credential_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
