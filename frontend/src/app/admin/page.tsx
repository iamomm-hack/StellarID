'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Users, Zap, TrendingUp, Clock, Award,
  BarChart3, CheckCircle2, XCircle, Building2, Loader2,
  Activity, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className="rounded-2xl glass p-5 border border-white/8 hover:border-white/15 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5.5 h-5.5 ${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-white/40">{label}</p>
        </div>
      </div>
    </div>
  );
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [topIssuers, setTopIssuers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('stellarid_token');
    if (!token) {
      setError('Authentication required. Connect wallet first.');
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
  }, []);

  // Merge chart data for the area chart
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl glass p-8 border border-white/10">
          <Shield className="w-10 h-10 text-[#7c3aed] mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Admin Panel</h1>
          <p className="text-white/50 text-sm mb-4">{error}</p>
          <a href="/dashboard" className="text-sm text-[#00e676] hover:underline">Back to Dashboard</a>
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

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'linear-gradient(165deg, #08001a 0%, #0d0030 30%, #12003a 50%, #0a0020 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-xs text-white/60 mb-3">
            <BarChart3 className="w-3.5 h-3.5 text-[#00e676]" />
            Admin Panel
          </div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-white/35 mt-1">Platform-wide metrics and activity overview</p>
        </div>

        {/* Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Award} label="Total Credentials" value={stats.totalCredentials} color="text-[#7c3aed]" bgColor="bg-[#7c3aed]/10" />
            <StatCard icon={Zap} label="Total Proofs" value={stats.totalProofs} color="text-[#00e676]" bgColor="bg-[#00e676]/10" />
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="text-[#4ade80]" bgColor="bg-[#4ade80]/10" />
            <StatCard icon={TrendingUp} label="Success Rate" value={`${stats.successRate}%`} color="text-[#a855f7]" bgColor="bg-[#a855f7]/10" />
          </div>
        )}

        {/* Chart + Activity - Two Column */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mb-8">
          {/* Chart */}
          <div className="rounded-2xl glass p-6 border border-white/8">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00e676]" />
              30-Day Trend
            </h3>
            {mergedChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={mergedChart}>
                  <defs>
                    <linearGradient id="gradProofs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00e676" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00e676" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCreds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickFormatter={(v: string) => v.substring(5)} axisLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(10,0,32,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                  />
                  <Area type="monotone" dataKey="proofs" stroke="#00e676" fill="url(#gradProofs)" strokeWidth={2} name="Proofs" />
                  <Area type="monotone" dataKey="credentials" stroke="#7c3aed" fill="url(#gradCreds)" strokeWidth={2} name="Credentials" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">
                No data yet — activity will appear here
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl glass p-6 border border-white/8">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7c3aed]" />
              Recent Activity
            </h3>
            {allEvents.length > 0 ? (
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {allEvents.map((ev, i) => (
                  <div key={ev.id + i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    {ev.type === 'proof' ? (
                      <Zap className="w-4 h-4 text-[#00e676] shrink-0" />
                    ) : (
                      <Award className="w-4 h-4 text-[#7c3aed] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.label}</p>
                      <p className="text-[10px] text-white/30">{ev.detail || ev.type}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-medium ${
                        ev.status === 'verified' || ev.status === 'issued' ? 'text-[#00e676]' :
                        ev.status === 'failed' ? 'text-red-400' : 'text-white/40'
                      }`}>
                        {ev.status}
                      </span>
                      <p className="text-[10px] text-white/20">{timeAgo(ev.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-white/30 text-sm">
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Top Issuers */}
        {topIssuers.length > 0 && (
          <div className="rounded-2xl glass p-6 border border-white/8">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#a855f7]" />
              Top Issuers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left py-2 px-3 text-xs text-white/40 font-medium">#</th>
                    <th className="text-left py-2 px-3 text-xs text-white/40 font-medium">Issuer</th>
                    <th className="text-left py-2 px-3 text-xs text-white/40 font-medium">Status</th>
                    <th className="text-right py-2 px-3 text-xs text-white/40 font-medium">Credentials</th>
                  </tr>
                </thead>
                <tbody>
                  {topIssuers.map((issuer, idx) => (
                    <tr key={issuer.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 text-white/30 text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-xs">{issuer.name}</td>
                      <td className="py-2.5 px-3">
                        {issuer.verified ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Verified</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/30 font-medium">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-xs text-white/60">{issuer.credential_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
