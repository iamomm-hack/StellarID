'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletStore } from '../../store/walletStore';
import { useCredentials } from '../../hooks/useCredentials';
import CredentialCard from '../../components/credentials/CredentialCard';
import ProofGenerator from '../../components/proof/ProofGenerator';
import LiveDemo from '../../components/proof/LiveDemo';
import RequestCredentialModal from '../../components/credentials/RequestCredentialModal';
import GitHubGreeting from '../../components/GitHubGreeting';
import {
  Shield, Plus, Github, Award, Clock, CheckCircle2,
  Loader2, AlertCircle, Zap
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

function DashboardContent() {
  const { address, isConnected, setToken } = useWalletStore();
  const searchParams = useSearchParams();
  const { data: credentials, isLoading, error } = useCredentials();
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Handle token from GitHub OAuth callback
  const tokenFromUrl = searchParams.get('token');
  useEffect(() => {
    if (tokenFromUrl && isConnected) {
      setToken(tokenFromUrl);
      // Clear URL params after handling token to prevent loop
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/dashboard');
      }
    }
  }, [tokenFromUrl, isConnected, setToken]);

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
          <Shield className="w-10 h-10 text-[#00e676] mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect wallet to open dashboard</h1>
          <p className="text-white/60 mb-6">
            Dashboard works after wallet connection. Use the Connect Wallet button in top-right.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30"
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
      color: 'text-[#7c3aed]',
      bgColor: 'bg-[#7c3aed]/10',
    },
    {
      icon: CheckCircle2,
      label: 'Valid',
      value: validCredentials.length,
      color: 'text-[#00e676]',
      bgColor: 'bg-[#00e676]/10',
    },
    {
      icon: Zap,
      label: 'Proofs Generated',
      value: 0,
      color: 'text-[#4ade80]',
      bgColor: 'bg-[#4ade80]/10',
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
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass glass-hover
                         text-white/85 text-sm font-medium transition-all duration-300
                         hover:border-[#00e676]/35"
            >
              <Github className="w-4 h-4" />
              Get GitHub Credential
            </a>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-[#7c3aed] to-[#9333ea]
                         hover:from-[#8b5cf6] hover:to-[#a855f7]
                         text-white text-sm font-semibold hover:shadow-lg
                         hover:shadow-purple-500/30 transition-all">
              <Plus className="w-4 h-4" />
              Request Credential
            </button>
          </div>
        </div>

        {/* GitHub Greeting - Show if GitHub credential exists */}
        {credentials && credentials.some((c: any) => c.credential_type === 'github_developer') && (
          <GitHubGreeting 
            credential={credentials.find((c: any) => c.credential_type === 'github_developer')} 
          />
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl glass p-4 hover:border-[#00e676]/25 transition-colors duration-300">
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

        {/* Live Demo + Credentials - Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-8">
          {/* Live Demo */}
          <LiveDemo />

          {/* Quick Actions */}
          <div className="rounded-2xl glass p-6 border border-white/10">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#7c3aed]" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#00e676]/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#00e676]/10 flex items-center justify-center">
                  <Github className="w-5 h-5 text-[#00e676]" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-[#00e676] transition-colors">Link GitHub Account</p>
                  <p className="text-xs text-white/35">Get your first verifiable credential</p>
                </div>
              </a>
              <a href="/docs" className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-[#7c3aed]/20 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#7c3aed]" />
                </div>
                <div>
                  <p className="text-sm font-medium group-hover:text-[#7c3aed] transition-colors">View API Docs</p>
                  <p className="text-xs text-white/35">Integrate StellarID into your platform</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {isLoading ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00e676]" />
              Your Credentials
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl glass p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
            <p className="text-white/50">Failed to load credentials</p>
            <p className="text-xs text-white/30 mt-1">
              Make sure the backend is running on port 5555
            </p>
          </div>
        ) : credentials && credentials.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#00e676]" />
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
                          glass border border-dashed border-[#00e676]/20">
            <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/10 flex items-center
                            justify-center mb-4">
              <Shield className="w-8 h-8 text-[#7c3aed]" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-white/40 text-center max-w-md mb-6">
              Get started by connecting with an issuer. Try linking your GitHub
              account to receive your first verifiable credential NFT.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                         bg-gradient-to-r from-[#7c3aed] to-[#9333ea]
                         text-white text-sm font-medium hover:shadow-lg
                         hover:shadow-purple-500/30 transition-all"
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

      {/* Request Credential Modal */}
      {showRequestModal && (
        <RequestCredentialModal onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DashboardContent />
    </Suspense>
  );
}
