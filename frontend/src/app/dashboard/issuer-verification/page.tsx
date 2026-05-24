'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../../store/walletStore';
import BecomeIssuerForm from '../../../components/credentials/BecomeIssuerForm';
import IssuerVerificationPanel from '../../../components/credentials/IssuerVerificationPanel';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { issuersApi } from '../../../lib/api';

export default function IssuerVerificationPage() {
  const { isConnected, address } = useWalletStore();
  const [issuer, setIssuer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIssuerProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await issuersApi.getMe();
      setIssuer(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIssuer(null); // No issuer profile yet, user can create one
      } else {
        setError(err.response?.data?.error || 'Failed to load issuer profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchIssuerProfile();
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
          <p className="text-sm text-muted">Please connect your Stellar wallet to access this section.</p>
          <Link href="/dashboard" className="btn-stellar inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground pb-24">
      <div className="max-w-[1440px] mx-auto px-8 pt-10 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-xs font-mono text-muted hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Issuer Portal</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-xs font-mono text-muted">Loading Issuer Status...</span>
          </div>
        ) : error ? (
          <div className="protocol-panel p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm">Error Loading Profile</h3>
            <p className="text-xs text-muted">{error}</p>
            <button onClick={fetchIssuerProfile} className="btn-stellar-ghost !py-2 !px-4">
              Retry
            </button>
          </div>
        ) : !issuer ? (
          <BecomeIssuerForm onSuccess={(newIssuer) => setIssuer(newIssuer)} />
        ) : (
          <IssuerVerificationPanel issuer={issuer} onRefresh={fetchIssuerProfile} />
        )}
      </div>
    </div>
  );
}
