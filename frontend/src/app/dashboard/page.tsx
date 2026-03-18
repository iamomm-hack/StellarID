'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '../../store/walletStore';
import { useCredentials } from '../../hooks/useCredentials';
import CredentialCard from '../../components/credentials/CredentialCard';
import ProofGenerator from '../../components/proof/ProofGenerator';
import {
  Shield, Plus, Github, Award, Clock, CheckCircle2,
  Loader2, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { address, isConnected } = useWalletStore();
  const { data: credentials, isLoading, error } = useCredentials();
  const [selectedCredential, setSelectedCredential] = useState<any>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  const validCredentials = credentials?.filter((c: any) => c.valid) || [];
  const totalCredentials = credentials?.length || 0;

  const stats = [
    {
      icon: Award,
      label: 'Total Credentials',
      value: totalCredentials,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
    },
    {
      icon: CheckCircle2,
      label: 'Valid',
      value: validCredentials.length,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      icon: Shield,
      label: 'Proofs Generated',
      value: 0,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                               bg-gradient-to-r from-indigo-600 to-purple-600
                               text-white text-sm font-medium hover:shadow-lg
                               hover:shadow-indigo-500/25 transition-all">
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
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
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
              <Shield className="w-5 h-5 text-indigo-400" />
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
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center
                            justify-center mb-4">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
            <p className="text-sm text-white/40 text-center max-w-md mb-6">
              Get started by connecting with an issuer. Try linking your GitHub
              account to receive your first verifiable credential NFT.
            </p>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                         bg-gradient-to-r from-indigo-600 to-purple-600
                         text-white text-sm font-medium hover:shadow-lg
                         hover:shadow-indigo-500/25 transition-all"
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
