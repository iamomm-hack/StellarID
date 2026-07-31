'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../store/walletStore';
import { useCredentials } from '../../hooks/useCredentials';
import { reputationApi } from '../../lib/api';

// Component Imports
import CredentialCard from '../../components/credentials/CredentialCard';
import ProofGenerator from '../../components/proof/ProofGenerator';
import LiveDemo from '../../components/proof/LiveDemo';
import RequestCredentialModal from '../../components/credentials/RequestCredentialModal';
import GitHubGreeting from '../../components/GitHubGreeting';
import LinkedInGreeting from '../../components/LinkedInGreeting';
import ConnectWallet from '../../components/wallet/ConnectWallet';
import OnboardingChecklist from '../../components/onboarding/OnboardingChecklist';

// Icons
import {
  Shield, Plus, Award, CheckCircle2,
  AlertCircle, Zap, Activity, Fingerprint,
  Lock, Terminal, Globe, HardDrive, Upload,
  MessageSquare, X
} from 'lucide-react';


// --- ANIMATION CONFIG ---
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [.23, 1, .32, 1] as const }
  })
};

function DashboardContent() {
  const { address, isConnected, setToken } = useWalletStore();
  const searchParams = useSearchParams();
  const { data: credentials, isLoading, error } = useCredentials();
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [reputationScore, setReputationScore] = useState<number | null>(null);
  const [reputationTier, setReputationTier] = useState<string>('Verified');

  // Fetch reputation score and tier
  useEffect(() => {
    if (isConnected && address) {
      reputationApi.getReputation(address)
        .then((res) => {
          setReputationScore(res.data.total_score);
          setReputationTier(res.data.tier);
        })
        .catch(() => {});
    }
  }, [isConnected, address]);

  // Handle token from GitHub OAuth callback
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl && isConnected) {
      setToken(tokenFromUrl);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/dashboard');
      }
    }
  }, [searchParams, isConnected, setToken]);

  const oauthError = searchParams.get('error');

  // --- ACCESS DENIED ---
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="protocol-panel max-w-md w-full p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Authentication Required</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Connect your Stellar wallet to access the Identity Control Center.
          </p>
          <div className="flex justify-center">
            <ConnectWallet />
          </div>
        </motion.div>
      </div>
    );
  }

  const validCredentials = credentials?.filter((c: any) => c.valid) || [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="min-h-screen pb-24"
    >
      <div className="max-w-[1440px] mx-auto px-8 pt-10 relative z-10">

        {/* --- HEADER --- */}
        <motion.div variants={fadeUp} custom={0} className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16">
          <div className="space-y-4">
            <span className="tag-orange">Status: Operational</span>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight font-display">Control Center</h1>
            <div className="flex items-center gap-3 font-mono text-xs text-muted bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2 w-fit">
              <Fingerprint className="w-4 h-4 text-accent-indigo" />
              <span className="tracking-wider">{address}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="btn-stellar !py-2.5 !px-5 !text-[10px]"
            >
              + Request Credential
            </button>
            <Link
              href={`/p/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Globe className="w-3.5 h-3.5" /> Public Profile
            </Link>
            <Link
              href="/dashboard/reputation"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Award className="w-3.5 h-3.5 text-accent-indigo" /> Leaderboard
            </Link>
            <Link
              href="/dashboard/issuer-verification"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Shield className="w-3.5 h-3.5 text-accent-indigo" /> Issuer Portal
            </Link>
            <Link
              href="/dashboard/bulk-issue"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Upload className="w-3.5 h-3.5 text-accent-indigo" /> Bulk Issuance
            </Link>
            <Link
              href="/dashboard/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Terminal className="w-3.5 h-3.5 text-accent-indigo" /> Developer API
            </Link>
            <Link
              href="/dashboard/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Activity className="w-3.5 h-3.5 text-accent-indigo" /> Analytics
            </Link>
            <Link
              href="/dashboard/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center"
            >
              <Zap className="w-3.5 h-3.5 text-accent-indigo" /> Plans & Billing
            </Link>
            <button
              onClick={() => setShowDiscordModal(true)}
              className="btn-stellar-ghost !py-2.5 !px-5 !text-[10px] gap-2 flex items-center border border-indigo-500/30 bg-indigo-500/[0.04] hover:bg-indigo-500/10 text-indigo-300 transition-all duration-300"
            >
              <img src="/discord-bot.png" alt="Discord" className="w-3.5 h-3.5 object-contain" /> Discord Bot
            </button>
          </div>
        </motion.div>
 
        {/* --- METRICS --- */}
        <motion.div variants={fadeUp} custom={1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          <MetricCard label="Credentials" value={credentials?.length || 0} status="Secured" color="#6366f1" />
          <MetricCard label="Verified" value={validCredentials.length} status="Valid" color="#a855f7" />
          <Link 
            href="/dashboard/reputation" 
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer block"
          >
            <MetricCard 
              label="Reputation Score" 
              value={reputationScore !== null ? reputationScore : '...'} 
              status={reputationTier} 
              color="#a855f7" 
              isClickable={true}
            />
          </Link>
          <MetricCard label="Latency" value="24ms" status="Stable" color="#6366f1" />
        </motion.div>

        <OnboardingChecklist
          walletAddress={address || ''}
          credentialCount={credentials?.length || 0}
          onRequestCredential={() => setShowRequestModal(true)}
        />
 

        {/* --- ALERTS --- */}
        <AnimatePresence>
          {oauthError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-10">
              <div className="p-5 border border-red-500/20 bg-red-500/5 rounded-2xl flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-red-400">
                  {oauthError === 'email_already_linked'
                    ? 'This email address is already linked to another StellarID wallet. Each social account can only be linked to a single wallet.'
                    : oauthError === 'github_auth_failed'
                    ? 'GitHub authentication failed. Please ensure your OAuth configuration is correct.'
                    : oauthError === 'linkedin_auth_failed'
                    ? 'LinkedIn authentication failed. Please check your credentials and try again.'
                    : oauthError.replace(/_/g, ' ')}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-16">
          {/* Main Proving Unit */}
          <motion.div variants={fadeUp} custom={2} className="w-full">
            <div className="flex items-center gap-3 mb-5">
              <Terminal className="w-4 h-4 text-accent-indigo" />
              <h2 className="text-lg font-bold">Identity Prover</h2>
            </div>
            <div className="protocol-panel p-1 overflow-hidden">
              <LiveDemo />
            </div>
          </motion.div>
        </div>

        {/* --- CREDENTIAL VAULT --- */}
        <motion.div variants={fadeUp} custom={4}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-accent-indigo" />
              <h2 className="text-2xl font-bold font-display">Credential Vault</h2>
            </div>
            <span className="tag-orange">{credentials?.length || 0} stored</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="protocol-panel h-72 animate-pulse" />
              ))}
            </div>
          ) : credentials && credentials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {credentials.map((cred: any) => (
                <CredentialCard
                  key={cred.id}
                  credential={cred}
                  onGenerateProof={setSelectedCredential}
                />
              ))}
            </div>
          ) : (
            <div className="protocol-panel py-24 text-center border-dashed">
              <Activity className="w-10 h-10 text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-muted mb-2">No Credentials Yet</h3>
              <p className="text-sm text-muted/60 mb-6">Connect an issuer to start building your identity.</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="btn-stellar-ghost"
              >
                Request Credential
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        {selectedCredential && (
          <ProofGenerator
            credential={selectedCredential}
            onClose={() => setSelectedCredential(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestModal && (
          <RequestCredentialModal onClose={() => setShowRequestModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscordModal && (
          <DiscordBotModal onClose={() => setShowDiscordModal(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- UTILITY COMPONENTS ---

function MetricCard({ label, value, status, color, isClickable }: any) {
  return (
    <div className={`protocol-panel p-7 group transition-all duration-300 ${
      isClickable 
        ? 'hover:border-indigo-500/40 hover:bg-indigo-500/[0.02] cursor-pointer' 
        : 'hover:border-white/[0.12]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">{label}</span>
        {isClickable && (
          <span className="text-[10px] font-mono text-muted group-hover:text-indigo-400 transition-colors">
            View Details →
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-4xl font-bold tracking-tight">{value}</span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color }}>{status}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'hsl(var(--background))' }} />}>
      <DashboardContent />
    </Suspense>
  );
}

function DiscordBotModal({ onClose }: { onClose: () => void }) {
  const inviteLink = "https://discord.com/oauth2/authorize?client_id=1508481188610969700&permissions=268462096&scope=bot%20applications.commands";
  const supportLink = "https://discord.gg/8Xdyj7ZD";

  return (
    <div className="edge-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [.23, 1, .32, 1] }}
        className="protocol-panel max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/discord-bot.png" alt="Discord Bot" className="w-5 h-5 object-contain rounded" />
            <span className="text-sm font-bold text-[#f5f5f0]">Discord Bot Gating</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.05] rounded-full transition-colors">
            <X className="w-4 h-4 text-[#666660]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-xs text-muted leading-relaxed">
            Supercharge your server with StellarID. Authenticate members, verify on-chain credentials, and lock channels behind reputation tiers automatically.
          </p>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-white/[0.06] hover:border-indigo-500/30 bg-white/[0.01] hover:bg-indigo-500/[0.02] text-left transition-all duration-300"
            >
              <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors uppercase tracking-wider mb-2">Invite Bot</h4>
              <p className="text-[10px] text-muted leading-relaxed">Add the bot to your own Discord server.</p>
            </a>
            
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-xl border border-white/[0.06] hover:border-indigo-500/30 bg-white/[0.01] hover:bg-indigo-500/[0.02] text-left transition-all duration-300"
            >
              <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-400 transition-colors uppercase tracking-wider mb-2">Join Test Server</h4>
              <p className="text-[10px] text-muted leading-relaxed">Try out slash commands in our official server.</p>
            </a>
          </div>

          {/* Commands */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">Commands Guide</span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {[
                { cmd: '/verify', desc: 'Connects Discord user to their Stellar wallet & updates roles.' },
                { cmd: '/profile', desc: 'Shows reputation score, badges, and active tiers.' },
                { cmd: '/leaderboard', desc: 'Lists top verified builders ranked by reputation.' },
                { cmd: '/gate tier:[Bronze/Silver/Gold/Platinum]', desc: 'Locks active channel for specified tier and above.' },
              ].map((item) => (
                <div key={item.cmd} className="flex justify-between items-start p-3 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                  <div className="space-y-1">
                    <code className="text-[10px] font-mono font-bold text-indigo-400">{item.cmd}</code>
                    <p className="text-[10px] text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end">
          <button onClick={onClose} className="btn-stellar-ghost !py-2.5 !px-5 !text-[11px]">
            Close Window
          </button>
        </div>
      </motion.div>
    </div>
  );
}
