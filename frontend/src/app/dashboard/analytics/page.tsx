'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../../store/walletStore';
import { issuersApi } from '../../../lib/api';
import ConnectWallet from '../../../components/wallet/ConnectWallet';
import {
  ArrowLeft, Loader2, ShieldAlert, Lock, Zap, Sparkles,
  Award, Activity, Key, Database, Users, ShieldCheck, MailOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

// Custom tooltip style for charts
const chartTooltipStyle = {
  backgroundColor: 'rgba(9, 9, 11, 0.95)',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#f4f4f5',
  fontSize: '12px',
  fontFamily: 'monospace',
};

// High-fidelity Mock Data for Free Tier preview
const mockDailyIssuance = Array.from({ length: 30 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  // Generate a nice wave curve
  const count = Math.round(15 + Math.sin(i * 0.5) * 8 + (i % 3 === 0 ? 12 : 0) + (i % 7 === 0 ? -6 : 0));
  return {
    date: date.toISOString().split('T')[0],
    count: Math.max(2, count)
  };
});

const mockApiUsage = [
  { date: 'Mon', count: 1200, avgResponseTimeMs: 42 },
  { date: 'Tue', count: 1540, avgResponseTimeMs: 38 },
  { date: 'Wed', count: 2100, avgResponseTimeMs: 35 },
  { date: 'Thu', count: 1850, avgResponseTimeMs: 44 },
  { date: 'Fri', count: 2400, avgResponseTimeMs: 40 },
  { date: 'Sat', count: 2900, avgResponseTimeMs: 32 },
  { date: 'Sun', count: 3200, avgResponseTimeMs: 30 },
];

const mockPieData = [
  { name: 'Active', value: 150, color: '#6366f1' },
  { name: 'Expired', value: 12, color: '#a855f7' },
  { name: 'Revoked', value: 3, color: '#f43f5e' },
];

const mockClaimingData = [
  { name: 'Claimed', value: 280, color: '#10b981' },
  { name: 'Pending', value: 70, color: '#f59e0b' },
];

export default function AnalyticsPage() {
  const { isConnected, address } = useWalletStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [issuer, setIssuer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      // First verify issuer status
      const profileRes = await issuersApi.getMe();
      setIssuer(profileRes.data);
      
      const statsRes = await issuersApi.getAnalytics();
      setAnalytics(statsRes.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIssuer(null);
      } else {
        setError(err.response?.data?.error || 'Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
        <div className="protocol-panel max-w-md w-full p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-sm text-muted">Please connect your Stellar wallet to view analytics.</p>
          <Link href="/dashboard" className="btn-stellar inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-mono text-muted">Aggregating credential metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="protocol-panel max-w-md w-full p-8 text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm">Failed to Load Metrics</h3>
          <p className="text-xs text-muted">{error}</p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/dashboard" className="btn-stellar-ghost !py-2 !px-4 text-xs">
              Dashboard
            </Link>
            <button onClick={fetchAnalytics} className="btn-stellar !py-2 !px-4 text-xs">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not an issuer profile yet
  if (!issuer) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="protocol-panel max-w-md w-full p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Issuer Profile Required</h2>
          <p className="text-sm text-muted">
            You need to register as an issuer and obtain verification before you can access developer analytics.
          </p>
          <Link href="/dashboard/issuer-verification" className="btn-stellar inline-block">
            Register as Issuer
          </Link>
        </div>
      </div>
    );
  }

  const isFree = analytics?.tier === 'free';
  const currentTier = analytics?.tier || 'free';

  // Use actual data or simulated mock preview
  const dataCredentials = isFree ? mockPieData : [
    { name: 'Active', value: analytics?.credentials?.active || 0, color: '#6366f1' },
    { name: 'Expired', value: analytics?.credentials?.expired || 0, color: '#a855f7' },
    { name: 'Revoked', value: analytics?.credentials?.revoked || 0, color: '#f43f5e' },
  ];

  const dataDailyIssuance = isFree ? mockDailyIssuance : analytics?.dailyIssuance || [];
  const dataApiUsage = isFree ? mockApiUsage : analytics?.apiUsage || [];
  const dataClaiming = isFree ? mockClaimingData : [
    { name: 'Claimed', value: analytics?.claiming?.claimed || 0, color: '#10b981' },
    { name: 'Pending', value: analytics?.claiming?.pending || 0, color: '#f59e0b' },
  ];

  const totalCredentials = isFree ? 165 : (analytics?.credentials?.total || 0);
  const totalClaims = isFree ? 350 : (analytics?.claiming?.total || 0);
  const claimSuccessRate = totalClaims > 0 
    ? Math.round(((isFree ? 280 : analytics?.claiming?.claimed || 0) / totalClaims) * 100) 
    : 0;

  const totalApiHits = isFree 
    ? mockApiUsage.reduce((acc, curr) => acc + curr.count, 0)
    : analytics?.apiUsage?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;

  const avgApiLatency = isFree 
    ? 36
    : (analytics?.apiUsage?.length 
        ? Math.round(analytics.apiUsage.reduce((acc: number, curr: any) => acc + curr.avgResponseTimeMs, 0) / analytics.apiUsage.length) 
        : 0);

  const bulkJobsTotal = isFree ? 14 : (analytics?.bulkJobs?.totalJobs || 0);
  const bulkJobsSuccess = isFree ? 472 : (analytics?.bulkJobs?.totalSuccess || 0);
  const bulkJobsFailed = isFree ? 8 : (analytics?.bulkJobs?.totalFailed || 0);
  const bulkJobsRecipients = isFree ? 480 : (analytics?.bulkJobs?.totalRecipients || 0);
  const bulkSuccessRate = bulkJobsRecipients > 0 
    ? Math.round((bulkJobsSuccess / bulkJobsRecipients) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground pb-24 relative overflow-hidden">
      {/* Background glow assets */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />

      <div className="max-w-[1440px] mx-auto px-8 pt-10 space-y-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-mono text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Plan:</span>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              currentTier === 'enterprise' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              currentTier === 'pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {currentTier}
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="flex justify-between items-end pb-4 border-b border-white/5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Premium Analytics</h1>
            <p className="text-sm text-muted">Track credential issuance trends, claims, API logs, and volume.</p>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="relative">
          {/* Glassmorphic locked cover overlay */}
          {isFree && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/70 backdrop-blur-md rounded-3xl border border-white/5">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-zinc-900/90 border border-white/10 p-8 rounded-2xl shadow-2xl text-center space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-400 animate-pulse" /> Unlock Premium Analytics
                  </h2>
                  <p className="text-xs text-muted leading-relaxed">
                    Visual charts for bulk uploads, credential conversions, developer API logs, latency metrics, and real-time trends are locked under the Free tier.
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl text-left space-y-2 font-mono text-[11px] text-zinc-400">
                  <p className="flex items-center gap-2"><span className="text-indigo-400">✓</span> 30-Day Credential Issuance Trends</p>
                  <p className="flex items-center gap-2"><span className="text-indigo-400">✓</span> API Usage volume & Response Time Latency</p>
                  <p className="flex items-center gap-2"><span className="text-indigo-400">✓</span> Email Claims Conversion Rate Metrics</p>
                  <p className="flex items-center gap-2"><span className="text-indigo-400">✓</span> Bulk CSV Success / Failure Logs</p>
                </div>
                <div className="flex gap-4">
                  <Link href="/dashboard" className="btn-stellar-ghost flex-1 !text-xs">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/billing" className="btn-stellar flex-1 !text-xs gap-2">
                    Upgrade to Pro <Zap className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          )}

          {/* Actual Analytics layout (starts blurred if Free tier) */}
          <div className={`space-y-8 transition-all duration-500 ${isFree ? 'blur-md pointer-events-none select-none filter brightness-50' : ''}`}>
            
            {/* Top metrics summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Card 1: Total credentials */}
              <div className="protocol-panel p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Credentials</span>
                  <Database className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight font-mono">{totalCredentials}</span>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Active: {isFree ? 150 : (analytics?.credentials?.active || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Claims success */}
              <div className="protocol-panel p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Claims Rate</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight font-mono">{claimSuccessRate}%</span>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{isFree ? 280 : (analytics?.claiming?.claimed || 0)} claimed of {totalClaims}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: API Integration hits */}
              <div className="protocol-panel p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Developer Latency</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight font-mono">{avgApiLatency}ms</span>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>{totalApiHits.toLocaleString()} calls / {isFree ? 1 : (analytics?.apiKeys?.activeCount || 0)} active keys</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Bulk CSV uploads */}
              <div className="protocol-panel p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-muted uppercase tracking-wider">CSV Uploads</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-3xl font-bold tracking-tight font-mono">{bulkSuccessRate}%</span>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{bulkJobsSuccess} successful of {bulkJobsRecipients}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Charts Grid Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart 1: AreaChart (Daily credential creation trends) */}
              <div className="protocol-panel p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold">Credential Issuance Trend</h3>
                  <p className="text-[11px] text-muted font-mono">Daily credential issuances compiled over the last 30 days</p>
                </div>
                <div className="h-[280px]">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dataDailyIssuance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.3)" 
                          fontSize={10} 
                          fontFamily="monospace"
                          tickFormatter={(str) => {
                            const p = str.split('-');
                            return p.length > 2 ? `${p[1]}/${p[2]}` : str;
                          }}
                        />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" allowDecimals={false} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Issued" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Donut Chart (Credential status distribution) */}
              <div className="protocol-panel p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Credential Distribution</h3>
                  <p className="text-[11px] text-muted font-mono">Total credentials split by status</p>
                </div>
                <div className="h-[180px] flex items-center justify-center relative">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataCredentials}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {dataCredentials.map((entry: any, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute text-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">Total</span>
                    <span className="text-xl font-bold font-mono">{totalCredentials}</span>
                  </div>
                </div>
                <div className="flex justify-around gap-2 font-mono text-[10px] text-zinc-400">
                  {dataCredentials.map((c: any) => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name} ({c.value})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Charts Grid Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 3: Developer API usage logs (dual hits + latency charts) */}
              <div className="protocol-panel p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold">Developer API Hits & Latency</h3>
                  <p className="text-[11px] text-muted font-mono">Daily volume (bars) compared with average latency in ms (line)</p>
                </div>
                <div className="h-[240px]">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataApiUsage} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" />
                        <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" />
                        <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="monospace" unit="ms" />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar yAxisId="left" dataKey="count" fill="#8b5cf6" name="API Calls" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="avgResponseTimeMs" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Latency (ms)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 4: Claim status conversion (pie / conversion display) */}
              <div className="protocol-panel p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Email Invitations Claim Rate</h3>
                  <p className="text-[11px] text-muted font-mono">Status of bulk credential invitations sent via email</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div className="h-[140px] flex items-center justify-center relative">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataClaiming}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {dataClaiming.map((entry: any, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={chartTooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Claimed:</span>
                        <span className="text-emerald-400 font-bold">{isFree ? 280 : (analytics?.claiming?.claimed || 0)}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${claimSuccessRate}%` }} />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Pending:</span>
                        <span className="text-amber-400 font-bold">{isFree ? 70 : (analytics?.claiming?.pending || 0)}</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full" style={{ width: `${100 - claimSuccessRate}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-between text-[11px] text-muted">
                      <span>Conversion Rate:</span>
                      <span className="text-white font-bold">{claimSuccessRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Bulk details */}
                <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl flex justify-between items-center font-mono text-[10px] text-zinc-400">
                  <div className="text-center flex-1">
                    <span className="block text-muted text-[9px] uppercase">Bulk Jobs</span>
                    <span className="text-sm font-bold text-white">{bulkJobsTotal}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center flex-1">
                    <span className="block text-muted text-[9px] uppercase">Success</span>
                    <span className="text-sm font-bold text-emerald-400">{bulkJobsSuccess}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center flex-1">
                    <span className="block text-muted text-[9px] uppercase">Errors</span>
                    <span className="text-sm font-bold text-rose-400">{bulkJobsFailed}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
