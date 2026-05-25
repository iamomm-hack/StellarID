'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '../../../store/walletStore';
import { billingApi } from '../../../lib/api';
import ConnectWallet from '../../../components/wallet/ConnectWallet';
import {
  ArrowLeft, Shield, Zap, Check, CreditCard,
  AlertCircle, BarChart3, HelpCircle, RefreshCw, Key, FileSpreadsheet
} from 'lucide-react';

interface BillingStatus {
  issuerName: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: string;
  totalUsed: number;
  remaining: number;
  mockMode: boolean;
  limits: {
    name: string;
    maxCredentialsPerMonth: number;
    allowBulkUpload: boolean;
    maxApiKeys: number;
  };
}

export default function BillingPage() {
  const { isConnected } = useWalletStore();
  const searchParams = useSearchParams();
  
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadBillingStatus();
    }
  }, [isConnected]);

  // Handle URL success/cancel parameters
  useEffect(() => {
    if (searchParams.get('checkout_success') === 'true') {
      setSuccessMsg('Thank you for subscribing! Your StellarID plan has been updated.');
      // Clean URL params
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/dashboard/billing');
      }
    } else if (searchParams.get('mock_checkout_success') === 'true') {
      const tier = searchParams.get('tier') || 'pro';
      handleMockUpgradeDirectly(tier as any);
    } else if (searchParams.get('checkout_cancel') === 'true') {
      setError('Subscription checkout was cancelled.');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/dashboard/billing');
      }
    }
  }, [searchParams]);

  async function loadBillingStatus() {
    setLoading(true);
    setError('');
    try {
      const res = await billingApi.getStatus();
      setBilling(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch subscription details');
    } finally {
      setLoading(false);
    }
  }

  async function handleMockUpgradeDirectly(tier: 'free' | 'pro' | 'enterprise') {
    try {
      await billingApi.mockUpgrade(tier);
      setSuccessMsg(`Simulated sandbox upgrade to ${tier.toUpperCase()} completed successfully!`);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/dashboard/billing');
      }
      loadBillingStatus();
    } catch (err: any) {
      setError('Mock upgrade simulation failed');
    }
  }

  async function handleSubscribe(tier: 'pro' | 'enterprise') {
    setActionLoading(tier);
    setError('');
    setSuccessMsg('');
    try {
      const res = await billingApi.createCheckoutSession(tier);
      if (res.data.mock && res.data.url) {
        // Mock mode redirect simulation
        window.location.href = res.data.url;
      } else if (res.data.url) {
        // Real Stripe checkout redirect
        window.location.href = res.data.url;
      } else {
        throw new Error('No checkout session URL returned');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Subscription checkout failed to initiate');
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading('portal');
    setError('');
    setSuccessMsg('');
    try {
      const res = await billingApi.createPortalSession();
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No portal session URL returned');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to open billing portal');
      setActionLoading(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="protocol-panel max-w-md w-full p-12 text-center">
          <Shield className="w-8 h-8 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">Authentication Required</h1>
          <p className="text-muted text-sm mb-8">Connect your wallet to manage your subscription.</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

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
              <span className="text-xs font-mono text-violet-400 tracking-wider uppercase">Issuer Infrastructure</span>
              <h1 className="text-3xl font-bold tracking-tight font-display">Plans & Billing</h1>
            </div>
          </div>
          
          {billing && (
            <button 
              onClick={loadBillingStatus} 
              disabled={loading} 
              className="p-2.5 rounded-lg border border-white/10 hover:border-white/20 transition-all text-xs flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          )}
        </div>

        {/* Message banners */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm flex items-center gap-3"
          >
            <Check className="w-5 h-5 flex-shrink-0 bg-green-500/10 rounded-full p-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {billing?.mockMode && (
          <div className="mb-8 p-5 rounded-xl border border-violet-500/30 bg-violet-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-violet-300 font-semibold text-sm">Sandbox Mock Mode Enabled</p>
                <p className="text-violet-200/60 text-xs mt-0.5">Stripe keys are not configured. You can simulate instant, free upgrades for testing.</p>
              </div>
            </div>
            {billing.tier !== 'free' && (
              <button 
                onClick={() => handleMockUpgradeDirectly('free')}
                className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg px-4 py-2 transition-all self-start sm:self-auto"
              >
                Reset to Free
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="protocol-panel p-20 text-center">
            <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
            <p className="text-muted text-sm font-mono">Resolving billing credentials...</p>
          </div>
        ) : (
          billing && (
            <>
              {/* Current Subscription Stats Panel */}
              <div className="protocol-panel p-8 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/[0.06] mb-8">
                  <div>
                    <span className="text-xs font-mono text-muted uppercase">Active Profile</span>
                    <h2 className="text-2xl font-bold font-display mt-1">{billing.issuerName}</h2>
                    <p className="text-xs text-muted mt-1 font-mono">Stellar Address: {useWalletStore.getState().address}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted block">Current Tier</span>
                      <span className="text-lg font-bold font-mono text-violet-400 uppercase tracking-wide">
                        {billing.limits.name} Plan
                      </span>
                    </div>
                    {billing.tier !== 'free' && !billing.mockMode && (
                      <button
                        onClick={handleManageBilling}
                        disabled={actionLoading === 'portal'}
                        className="btn-stellar-ghost !py-2.5 !px-5 !text-xs gap-2 flex items-center"
                      >
                        <CreditCard className="w-4 h-4" />
                        {actionLoading === 'portal' ? 'Opening...' : 'Manage Billing'}
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-violet-400" /> Usage Metrics (Current Month)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Metric 1: Monthly Issuance */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Issued Credentials</span>
                      <span className="font-bold">
                        {billing.totalUsed} / {billing.limits.maxCredentialsPerMonth === Infinity ? '∞' : billing.limits.maxCredentialsPerMonth}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/[0.04]">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-500"
                        style={{ 
                          width: `${billing.limits.maxCredentialsPerMonth === Infinity ? 0 : Math.min(100, (billing.totalUsed / billing.limits.maxCredentialsPerMonth) * 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-more font-mono">
                      {billing.limits.maxCredentialsPerMonth === Infinity 
                        ? 'Unlimited credentials available.' 
                        : `${billing.remaining} available before limit lock.`}
                    </p>
                  </div>

                  {/* Metric 2: API Keys */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Active API Keys</span>
                      <span className="font-bold">
                        {billing.limits.maxApiKeys === Infinity ? 'Unlimited' : billing.limits.maxApiKeys} max
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-violet-300 font-mono py-1">
                      <Key className="w-4 h-4 text-violet-400" />
                      <span>Allows developers to hook credentials programmatically.</span>
                    </div>
                  </div>

                  {/* Metric 3: Bulk CSV Upload */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-muted">Bulk CSV uploads</span>
                      <span className={`font-bold ${billing.limits.allowBulkUpload ? 'text-green-400' : 'text-red-400'}`}>
                        {billing.limits.allowBulkUpload ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-violet-300 font-mono py-1">
                      <FileSpreadsheet className="w-4 h-4 text-violet-400" />
                      <span>Upload CSV tables for bulk digital credentials.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <h2 className="text-2xl font-bold font-display text-center mb-8">Select Your Tier</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* Plan 1: Free */}
                <div className={`protocol-panel p-6 flex flex-col justify-between relative ${billing.tier === 'free' ? 'border-violet-500/50 bg-violet-500/[0.02]' : ''}`}>
                  {billing.tier === 'free' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-bold font-display text-white">Free</h3>
                    <p className="text-xs text-muted mt-1">Perfect for sandbox testing and small clubs.</p>
                    
                    <div className="my-6">
                      <span className="text-3xl font-bold font-mono">$0</span>
                      <span className="text-xs text-muted"> / month</span>
                    </div>

                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <FeatureItem label="50 credentials / month" active={true} />
                      <FeatureItem label="1 active developer API key" active={true} />
                      <FeatureItem label="Manual single minting tools" active={true} />
                      <FeatureItem label="Bulk CSV upload" active={false} />
                      <FeatureItem label="On-chain Stellar anchors" active={true} />
                    </div>
                  </div>

                  <button 
                    disabled={true} 
                    className="w-full mt-8 bg-white/5 border border-white/10 text-muted rounded-xl py-3 text-xs font-semibold cursor-not-allowed"
                  >
                    {billing.tier === 'free' ? 'Active Plan' : 'Free Tier'}
                  </button>
                </div>

                {/* Plan 2: Pro */}
                <div className={`protocol-panel p-6 flex flex-col justify-between relative ${billing.tier === 'pro' ? 'border-violet-500/50 bg-violet-500/[0.02]' : ''}`}>
                  {billing.tier === 'pro' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                      Pro <Zap className="w-4 h-4 text-violet-400 fill-violet-400" />
                    </h3>
                    <p className="text-xs text-muted mt-1">Ideal for expanding networks, hackathons & schools.</p>
                    
                    <div className="my-6">
                      <span className="text-3xl font-bold font-mono">$49</span>
                      <span className="text-xs text-muted"> / month</span>
                    </div>

                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <FeatureItem label="1,000 credentials / month" active={true} />
                      <FeatureItem label="5 active developer API keys" active={true} />
                      <FeatureItem label="Bulk CSV upload & retry support" active={true} />
                      <FeatureItem label="Standard rate limit: 10,000 req/hr" active={true} />
                      <FeatureItem label="On-chain Stellar anchors" active={true} />
                    </div>
                  </div>

                  {billing.mockMode ? (
                    <button 
                      onClick={() => handleMockUpgradeDirectly('pro')}
                      disabled={billing.tier === 'pro'}
                      className="w-full mt-8 btn-stellar !py-3"
                    >
                      {billing.tier === 'pro' ? 'Active Plan' : 'Select Pro (Mock)'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe('pro')}
                      disabled={billing.tier === 'pro' || actionLoading === 'pro'}
                      className={`w-full mt-8 py-3 rounded-xl text-xs font-semibold transition-all ${
                        billing.tier === 'pro' 
                          ? 'bg-white/5 border border-white/10 text-muted cursor-not-allowed' 
                          : 'btn-stellar'
                      }`}
                    >
                      {actionLoading === 'pro' ? 'Initiating...' : billing.tier === 'pro' ? 'Active' : 'Upgrade to Pro'}
                    </button>
                  )}
                </div>

                {/* Plan 3: Enterprise */}
                <div className={`protocol-panel p-6 flex flex-col justify-between relative ${billing.tier === 'enterprise' ? 'border-violet-500/50 bg-violet-500/[0.02]' : ''}`}>
                  {billing.tier === 'enterprise' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-bold font-display text-white">Enterprise</h3>
                    <p className="text-xs text-muted mt-1">For massive corporate verify setups & protocols.</p>
                    
                    <div className="my-6">
                      <span className="text-3xl font-bold font-mono">$299</span>
                      <span className="text-xs text-muted"> / month</span>
                    </div>

                    <div className="space-y-3 border-t border-white/[0.06] pt-6">
                      <FeatureItem label="Unlimited credentials / month" active={true} />
                      <FeatureItem label="Unlimited developer API keys" active={true} />
                      <FeatureItem label="Bulk CSV upload & API priority" active={true} />
                      <FeatureItem label="High-speed rate limits" active={true} />
                      <FeatureItem label="24/7 Dedicated account manager" active={true} />
                    </div>
                  </div>

                  {billing.mockMode ? (
                    <button 
                      onClick={() => handleMockUpgradeDirectly('enterprise')}
                      disabled={billing.tier === 'enterprise'}
                      className="w-full mt-8 btn-stellar !py-3"
                    >
                      {billing.tier === 'enterprise' ? 'Active Plan' : 'Select Enterprise (Mock)'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSubscribe('enterprise')}
                      disabled={billing.tier === 'enterprise' || actionLoading === 'enterprise'}
                      className={`w-full mt-8 py-3 rounded-xl text-xs font-semibold transition-all ${
                        billing.tier === 'enterprise' 
                          ? 'bg-white/5 border border-white/10 text-muted cursor-not-allowed' 
                          : 'btn-stellar'
                      }`}
                    >
                      {actionLoading === 'enterprise' ? 'Initiating...' : billing.tier === 'enterprise' ? 'Active' : 'Upgrade to Enterprise'}
                    </button>
                  )}
                </div>

              </div>
            </>
          )
        )}

      </div>
    </motion.div>
  );
}

function FeatureItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${active ? 'text-violet-400' : 'text-white/10'}`} />
      <span className={active ? 'text-white/80' : 'text-white/30 line-through'}>{label}</span>
    </div>
  );
}
