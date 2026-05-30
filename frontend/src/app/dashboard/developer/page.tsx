'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../../store/walletStore';
import { developerApi } from '../../../lib/api';
import ConnectWallet from '../../../components/wallet/ConnectWallet';
import {
  Key, Plus, Trash2, Copy, Check, ArrowLeft, Shield,
  Activity, Clock, Lock, Eye, EyeOff, Terminal, Code2, Zap
} from 'lucide-react';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  permissions: string[];
  rate_limit_per_hour: number;
  last_used_at: string | null;
  created_at: string;
  revoked: boolean;
}

interface UsageStats {
  total_calls: number;
  calls_today: number;
  calls_this_week: number;
  avg_response_time_ms: number;
  active_keys: number;
  by_endpoint: { endpoint: string; method: string; calls: number }[];
  by_day: { date: string; calls: number }[];
  by_status: { status: number; calls: number }[];
}

const PERM_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  verify: { label: 'Verify', icon: Shield, color: 'text-green-400' },
  read_profile: { label: 'Read', icon: Eye, color: 'text-blue-400' },
  issue: { label: 'Issue', icon: Zap, color: 'text-violet-400' },
};

export default function DeveloperDashboard() {
  const { isConnected } = useWalletStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(['verify', 'read_profile']);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isConnected) loadData();
  }, [isConnected]);

  async function loadData() {
    setLoading(true);
    try {
      const [keysRes, statsRes] = await Promise.all([
        developerApi.listKeys(),
        developerApi.getUsageStats(),
      ]);
      setKeys(keysRes.data.keys || []);
      setStats(statsRes.data);
    } catch { /* silent */ }
    setLoading(false);
  }

  async function createKey() {
    if (!newKeyName.trim()) { setError('Key name is required'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await developerApi.createKey({ name: newKeyName.trim(), permissions: newKeyPerms });
      setRevealedKey(res.data.key);
      setNewKeyName('');
      setShowCreateForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create key');
    }
    setCreating(false);
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await developerApi.revokeKey(id);
      await loadData();
    } catch { /* silent */ }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function togglePerm(perm: string) {
    setNewKeyPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="protocol-panel max-w-md w-full p-12 text-center">
          <Lock className="w-8 h-8 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">Authentication Required</h1>
          <p className="text-muted text-sm mb-8">Connect your wallet to manage API keys.</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  const activeKeys = keys.filter(k => !k.revoked);
  const revokedKeys = keys.filter(k => k.revoked);

  const codeSnippet = `import axios from 'axios';

const client = axios.create({
  baseURL: '${(process.env.NEXT_PUBLIC_API_URL || 'https://stellarid.onrender.com/api/v1')}/public',
  headers: { 'X-StellarID-Key': 'YOUR_API_KEY' }
});

// Verify a wallet
const { data } = await client.get('/verify/GABC...');
console.log(data.reputation_score, data.tier);`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-24">
      <div className="max-w-[1200px] mx-auto px-8 pt-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs font-mono text-violet-400 tracking-wider uppercase">Developer Portal</span>
              <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            </div>
          </div>
          <button onClick={() => setShowCreateForm(true)} className="btn-stellar !py-2.5 !px-5 !text-xs gap-2">
            <Plus className="w-4 h-4" /> Create API Key
          </button>
        </div>

        {/* Revealed Key Banner */}
        {revealedKey && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5"
          >
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-yellow-300 font-semibold text-sm mb-1">Save your API key now!</p>
                <p className="text-yellow-200/60 text-xs mb-3">This key will not be shown again. Store it securely.</p>
                <div className="flex items-center gap-2 bg-black/30 rounded-lg p-3 font-mono text-xs">
                  <code className="flex-1 break-all text-yellow-200">{revealedKey}</code>
                  <button onClick={() => copyToClipboard(revealedKey, 'new')}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  >
                    {copied === 'new' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button onClick={() => setRevealedKey(null)} className="text-yellow-400/60 hover:text-yellow-300 text-xs">✕</button>
            </div>
          </motion.div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 protocol-panel p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Key Name</label>
                <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Production Key"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-2 block">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PERM_LABELS).map(([key, { label, icon: Icon, color }]) => (
                    <button key={key} onClick={() => togglePerm(key)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        newKeyPerms.includes(key) ? 'border-violet-500/50 bg-violet-500/10 text-violet-300' : 'border-white/10 text-muted hover:border-white/20'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${newKeyPerms.includes(key) ? color : ''}`} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3">
                <button onClick={createKey} disabled={creating} className="btn-stellar !py-2 !px-5 !text-xs">
                  {creating ? 'Creating...' : 'Generate Key'}
                </button>
                <button onClick={() => { setShowCreateForm(false); setError(''); }} className="btn-stellar-ghost !py-2 !px-5 !text-xs">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Calls', value: stats.total_calls, icon: Activity },
              { label: 'Today', value: stats.calls_today, icon: Zap },
              { label: 'This Week', value: stats.calls_this_week, icon: Clock },
              { label: 'Active Keys', value: stats.active_keys, icon: Key },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="protocol-panel p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-muted">{label}</span>
                </div>
                <p className="text-2xl font-bold font-mono">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Active Keys */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-400" /> Active Keys ({activeKeys.length})
          </h2>
          {loading ? (
            <div className="protocol-panel p-8 text-center text-muted text-sm">Loading keys...</div>
          ) : activeKeys.length === 0 ? (
            <div className="protocol-panel p-8 text-center">
              <Key className="w-8 h-8 text-muted mx-auto mb-3" />
              <p className="text-muted text-sm">No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map(key => (
                <div key={key.id} className="protocol-panel p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{key.name}</span>
                      <code className="text-xs text-muted font-mono bg-white/5 px-2 py-0.5 rounded">{key.key_prefix}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      {key.permissions.map(p => {
                        const info = PERM_LABELS[p];
                        return info ? (
                          <span key={p} className={`${info.color} bg-white/5 px-2 py-0.5 rounded`}>{info.label}</span>
                        ) : null;
                      })}
                      <span>• {key.rate_limit_per_hour}/hr</span>
                      <span>• Created {new Date(key.created_at).toLocaleDateString()}</span>
                      {key.last_used_at && <span>• Last used {new Date(key.last_used_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <button onClick={() => revokeKey(key.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revoked Keys */}
        {revokedKeys.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold mb-3 text-muted flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5" /> Revoked Keys ({revokedKeys.length})
            </h2>
            <div className="space-y-2 opacity-50">
              {revokedKeys.map(key => (
                <div key={key.id} className="protocol-panel p-3 flex items-center gap-3">
                  <span className="text-sm line-through">{key.name}</span>
                  <code className="text-xs text-muted font-mono">{key.key_prefix}</code>
                  <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded ml-auto">Revoked</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Start */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-violet-400" /> Quick Start
          </h2>
          <div className="protocol-panel p-5 relative">
            <button onClick={() => copyToClipboard(codeSnippet, 'snippet')}
              className="absolute top-4 right-4 p-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              {copied === 'snippet' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="text-xs font-mono text-violet-200/80 overflow-x-auto whitespace-pre leading-relaxed">{codeSnippet}</pre>
          </div>
        </div>

        {/* API Reference */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-violet-400" /> API Reference
          </h2>
          <div className="space-y-2">
            {[
              { method: 'GET', path: '/verify/:wallet', desc: 'Get wallet reputation & credentials', perm: 'verify' },
              { method: 'POST', path: '/credentials/issue', desc: 'Issue credential via email', perm: 'issue' },
              { method: 'GET', path: '/credentials/:id', desc: 'Get credential details', perm: 'read_profile' },
              { method: 'GET', path: '/proof/:credential_id', desc: 'Get ZK proof data', perm: 'verify' },
            ].map(ep => (
              <div key={ep.path} className="protocol-panel p-3 flex items-center gap-3">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  ep.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                }`}>{ep.method}</span>
                <code className="text-xs font-mono text-violet-300 flex-1">{ep.path}</code>
                <span className="text-xs text-muted hidden sm:block">{ep.desc}</span>
                <span className="text-[10px] text-muted bg-white/5 px-2 py-0.5 rounded">{ep.perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
