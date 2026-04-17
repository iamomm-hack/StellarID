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
import LinkedInGreeting from '../../components/LinkedInGreeting';
import {
  Shield, Plus, Github, Linkedin, Award, CheckCircle2,
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
      case 'linkedin_oauth_not_configured':
        return 'LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in backend/.env and restart backend.';
      case 'missing_wallet_address':
        return 'Wallet address is missing. Reconnect wallet and try again.';
      case 'no_verified_email':
        return 'GitHub account does not have a verified primary email.';
      case 'linkedin_no_email':
        return 'LinkedIn account does not have an email address.';
      case 'github_auth_failed':
        return 'GitHub authentication failed. Please try again.';
      case 'linkedin_auth_failed':
        return 'LinkedIn authentication failed. Please try again.';
      case 'linkedin_auth_denied':
        return 'LinkedIn access was denied. Please try again.';
      default:
        return null;
    }
  })();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="brutal-card max-w-lg w-full">
          <div className="card-header-brutal">
            <span>Access Denied</span>
            <span>[NO_WALLET]</span>
          </div>
          <div className="card-body-brutal text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-accent)' }} />
            <h1 className="text-xl font-bold mb-2 uppercase"
                style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
              Connect wallet to proceed
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm mb-6">
              Dashboard requires wallet connection. Use the Connect button in the navigation.
            </p>
            <a href="/">
              <button className="btn-brutal btn-brutal-outline">Back to Index</button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const validCredentials = credentials?.filter((c: any) => c.valid) || [];
  const totalCredentials = credentials?.length || 0;

  const stats = [
    {
      label: 'Total Credentials',
      value: totalCredentials,
      status: 'ACTIVE',
    },
    {
      label: 'Valid',
      value: validCredentials.length,
      status: 'ONLINE',
    },
    {
      label: 'Proofs Generated',
      value: 0,
      status: 'STANDBY',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {oauthMessage && (
          <div className="mb-6 border-l-4 border-[var(--color-accent)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-accent)]">
            {oauthMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 reveal-wrap">
          <div className="reveal-content delay-1">
            <h1 style={{ fontFamily: 'Unbounded, sans-serif', fontWeight: 900, fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-0.04em', color: '#fff' }}>
              Dashboard
            </h1>
            <p className="text-sm mt-2 font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {address?.slice(0, 10)}...{address?.slice(-6)}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0 flex-wrap">
            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}>
              <button className="btn-brutal btn-brutal-outline flex items-center gap-2 text-sm py-2.5 px-4">
                <Github className="w-4 h-4" />
                GitHub
              </button>
            </a>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/linkedin-issuer/auth?stellarAddress=${address}`}>
              <button className="btn-brutal btn-brutal-outline flex items-center gap-2 text-sm py-2.5 px-4">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </button>
            </a>
            <button
              onClick={() => setShowRequestModal(true)}
              className="btn-brutal btn-brutal-accent flex items-center gap-2 text-sm py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              Request
            </button>
          </div>
        </div>

        {/* GitHub Greeting */}
        {credentials && credentials.some((c: any) => c.credential_type === 'github_developer') && (
          <GitHubGreeting 
            credential={credentials.find((c: any) => c.credential_type === 'github_developer')} 
          />
        )}

        {/* LinkedIn Greeting */}
        {credentials && credentials.some((c: any) => c.credential_type === 'linkedin_professional') && (
          <LinkedInGreeting 
            credential={credentials.find((c: any) => c.credential_type === 'linkedin_professional')} 
          />
        )}

        {/* Stats Row - Data Table Style */}
        <div className="mb-8 overflow-x-auto">
          <table className="edge-table w-full">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Status</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.label}>
                  <td className="text-[var(--color-text-main)]">{stat.label}</td>
                  <td style={{ color: stat.status === 'ONLINE' ? 'var(--color-highlight)' : stat.status === 'ACTIVE' ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {stat.status}
                  </td>
                  <td className="font-bold text-white" style={{ fontFamily: 'Unbounded, sans-serif' }}>
                    {stat.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Demo + Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-0 mb-8">
          <LiveDemo />

          {/* Quick Actions */}
          <div className="brutal-card">
            <div className="card-header-brutal">
              <span>Quick Actions</span>
              <span>[READY]</span>
            </div>
            <div className="card-body-brutal space-y-0">
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
                className="flex items-center gap-3 p-4 border-b border-[#222] hover:bg-white/[0.02] transition-colors group"
              >
                <Github className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-highlight)] transition-colors uppercase tracking-wide">
                    Link GitHub Account
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Get your developer verifiable credential</p>
                </div>
              </a>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/linkedin-issuer/auth?stellarAddress=${address}`}
                className="flex items-center gap-3 p-4 border-b border-[#222] hover:bg-white/[0.02] transition-colors group"
              >
                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-highlight)] transition-colors uppercase tracking-wide">
                    Link LinkedIn Account
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Get your professional identity credential</p>
                </div>
              </a>
              <a href="/docs" className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors group">
                <Shield className="w-5 h-5" style={{ color: 'var(--color-highlight)' }} />
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-main)] group-hover:text-[var(--color-highlight)] transition-colors uppercase tracking-wide">
                    View API Docs
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">Integrate StellarID into your platform</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {isLoading ? (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider"
                style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              Your Credentials
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="brutal-card">
                  <div className="card-header-brutal">
                    <span>Loading...</span>
                    <span>[...]</span>
                  </div>
                  <div className="card-body-brutal">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="brutal-card">
            <div className="card-header-brutal">
              <span>Error</span>
              <span>[FAIL]</span>
            </div>
            <div className="card-body-brutal flex flex-col items-center py-12">
              <AlertCircle className="w-8 h-8 mb-4" style={{ color: 'var(--color-accent)' }} />
              <p className="text-[var(--color-text-muted)]">Failed to load credentials</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Make sure the backend is running on port 5555
              </p>
            </div>
          </div>
        ) : credentials && credentials.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wider"
                style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              Your Credentials
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0">
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
          <div className="brutal-card">
            <div className="card-header-brutal">
              <span>Credentials</span>
              <span>[EMPTY]</span>
            </div>
            <div className="card-body-brutal flex flex-col items-center py-16">
              <Shield className="w-12 h-12 mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <h3 className="text-lg font-bold mb-2 uppercase"
                  style={{ fontFamily: 'Unbounded, sans-serif', color: '#fff' }}>
                No credentials yet
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] text-center max-w-md mb-6">
                Get started by connecting with an issuer. Try linking your GitHub
                account to receive your first verifiable credential NFT.
              </p>
              <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}>
                <button className="btn-brutal btn-brutal-accent flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  Get GitHub Credential
                </button>
              </a>
            </div>
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
