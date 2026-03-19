'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '../../store/walletStore';
import { useCredentials } from '../../hooks/useCredentials';
import CredentialCard from '../../components/credentials/CredentialCard';
import ProofGenerator from '../../components/proof/ProofGenerator';
import {
  Shield, Plus, Github, Award, Clock, CheckCircle2,
  Loader2, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { address, isConnected } = useWalletStore();
  const searchParams = useSearchParams();
  const { data: credentials, isLoading, error } = useCredentials();
  const [selectedCredential, setSelectedCredential] = useState<any>(null);

  const oauthError = searchParams.get('error');
  const oauthMessage = (() => {
    switch (oauthError) {
      case 'github_oauth_not_configured':
        return 'GitHub OAuth is not configured on backend. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env and restart backend.';
      case 'missing_wallet_address':
        return 'Wallet address is missing. Reconnect wallet and try again.';
      case 'no_verified_email':
        return 'GitHub account does not have a verified primary email.';
      case 'github_auth_failed':
        return 'GitHub authentication failed. Please try again.';
      default:
        return null;
    }
  })();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center rounded-2xl glass p-8 border border-white/10">
          <Shield className="w-10 h-10 text-[#ff7b46] mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect wallet to open dashboard</h1>
          <p className="text-white/60 mb-6">
            Dashboard works after wallet connection. Use the Connect Wallet button in top-right.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff5a1f] hover:bg-[#ff6f3d] text-white font-semibold transition-all duration-300"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const validCredentials = credentials?.filter((c: any) => c.valid) || [];
  const totalCredentials = credentials?.length || 0;

  const stats = [
    {
      icon: Award,
      label: 'Total Credentials',
      value: totalCredentials,
      color: 'text-[#ff7b46]',
      bgColor: 'bg-[#ff6a2e]/10',
    },
    {
      icon: CheckCircle2,
      label: 'Valid',
      value: validCredentials.length,
      color: 'text-[#ff9a5d]',
      bgColor: 'bg-[#ff8a4a]/10',
    },
    {
      icon: Shield,
      label: 'Proofs Generated',
      value: 0,
      color: 'text-[#ffc27a]',
      bgColor: 'bg-[#ffc27a]/10',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {oauthMessage && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {oauthMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-sm text-white/40 font-mono">
              {address?.slice(0, 10)}...{address?.slice(-6)}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover
                         text-white/80 text-sm font-medium transition-all duration-300
                         hover:border-white/20"
            >
              <Github className="w-4 h-4" />
              Get GitHub Credential
            </a>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                               bg-[#ff5a1f] hover:bg-[#ff6f3d]
                               text-white text-sm font-medium hover:shadow-lg
                               hover:shadow-[#ff5a1f]/30 transition-all">
              <Plus className="w-4 h-4" />
              Request Credential
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl glass p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Credentials Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#ff7b46] animate-spin mb-4" />
            <p className="text-white/50">Loading credentials...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
            <p className="text-white/50">Failed to load credentials</p>
            <p className="text-xs text-white/30 mt-1">
              Make sure the backend is running on port 4000
            </p>
          </div>
        ) : credentials && credentials.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#ff7b46]" />
              Your Credentials
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {credentials.map((cred: any) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onGenerateProof={setSelectedCredential}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl
                          glass border border-dashed border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-[#ff6a2e]/10 flex items-center
                            justify-center mb-4">
              <Shield className="w-8 h-8 text-[#ff7b46]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-white/40 text-center max-w-md mb-6">
              Get started by connecting with an issuer. Try linking your GitHub
              account to receive your first verifiable credential NFT.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                         bg-[#ff5a1f] hover:bg-[#ff6f3d]
                         text-white text-sm font-medium hover:shadow-lg
                         hover:shadow-[#ff5a1f]/30 transition-all"
            >
              <Github className="w-4 h-4" />
              Get GitHub Credential
            </a>
          </div>
        )}
      </div>

      {/* Proof Generator Modal */}
      {selectedCredential && (
        <ProofGenerator
          credential={selectedCredential}
          onClose={() => setSelectedCredential(null)}
        />
      )}
    </div>
  );
}
