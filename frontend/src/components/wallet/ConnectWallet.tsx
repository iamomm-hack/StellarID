'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Loader2, ShieldCheck, ChevronDown, Zap, Wifi,
  Activity, Lock, Sparkles, Github, Linkedin, Copy, Check, User
} from 'lucide-react';
import { profileApi } from '../../lib/api';

export default function ConnectWallet() {
  const { connect, disconnect, loading, error, address, isConnected } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Profile data states
  const [displayName, setDisplayName] = useState<string>('Builder');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [typedSummary, setTypedSummary] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'linkedin' | 'twitter' | 'resume'>('linkedin');
  const [githubConnected, setGithubConnected] = useState<boolean>(false);
  const [linkedinConnected, setLinkedinConnected] = useState<boolean>(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState<boolean>(false);
  const [bioError, setBioError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [networkName, setNetworkName] = useState<string>('Stellar Testnet');
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const fetchProfileData = useCallback(async () => {
    if (!address) return;
    try {
      const cardRes = await profileApi.getCardData(address);
      if (cardRes.data) {
        setDisplayName(cardRes.data.display_name || 'Builder');
        setAvatarUrl(cardRes.data.avatar_url || null);
        const bio = cardRes.data.ai_summary || null;
        setAiSummary(bio);
        setTypedSummary(bio || '');
        setGithubConnected(cardRes.data.display_name !== 'Builder');
      }

      const credsRes = await profileApi.getCredentials(address);
      if (Array.isArray(credsRes.data)) {
        const hasLinkedin = credsRes.data.some((c: any) =>
          c.credential_type?.toLowerCase().includes('linkedin')
        );
        setLinkedinConnected(hasLinkedin);
      }
    } catch (err) {
      console.error('Failed to fetch wallet dropdown profile data:', err);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchProfileData();
    }
  }, [isConnected, address, fetchProfileData]);

  // Dynamically query network from Freighter on connection
  useEffect(() => {
    async function checkNetwork() {
      if (isConnected && address) {
        try {
          const freighter = await import('@stellar/freighter-api');
          const net = await freighter.getNetwork();
          if (net === 'PUBLIC') {
            setNetworkName('Stellar Mainnet');
          } else if (net === 'TESTNET') {
            setNetworkName('Stellar Testnet');
          } else if (net) {
            setNetworkName(`Stellar ${net.charAt(0).toUpperCase() + net.slice(1).toLowerCase()}`);
          }
        } catch (e) {
          console.debug('Failed to get network from Freighter:', e);
        }
      }
    }
    checkNetwork();
  }, [isConnected, address]);

  // Re-fetch when dropdown opens to guarantee up-to-date info
  useEffect(() => {
    if (showDropdown && isConnected && address) {
      fetchProfileData();
    }
  }, [showDropdown, isConnected, address, fetchProfileData]);

  // Cleanup typewriter timeouts
  useEffect(() => {
    return () => {
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const animateTypewriter = (text: string) => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    setTypedSummary('');
    let i = 0;
    const speed = 12; // ms per character
    const type = () => {
      if (i < text.length) {
        setTypedSummary(text.slice(0, i + 1));
        i++;
        typewriterTimeoutRef.current = setTimeout(type, speed);
      }
    };
    type();
  };

  const handleGenerateBio = async (e?: React.MouseEvent, formatOverride?: 'linkedin' | 'twitter' | 'resume') => {
    if (e) e.stopPropagation();
    const format = formatOverride || selectedFormat;
    setIsGeneratingBio(true);
    setBioError(null);
    try {
      const res = await profileApi.generateBio(format);
      if (res.data && res.data.bio) {
        setAiSummary(res.data.bio);
        animateTypewriter(res.data.bio);
      }
    } catch (err: any) {
      console.error('Failed to generate bio in header:', err);
      setBioError(err.response?.data?.error || 'Failed to generate bio');
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleFormatChange = (format: 'linkedin' | 'twitter' | 'resume', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFormat(format);
    handleGenerateBio(undefined, format);
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // --- CONNECTED STATE ---
  if (isConnected && address) {
    return (
      <div ref={dropdownRef} className="relative z-[100]">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="group flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:border-accent-indigo/30 transition-all duration-300"
        >
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-4 h-4 rounded-full border border-white/[0.1] object-cover"
            />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-accent-indigo" />
          )}
          <span className="text-[11px] font-bold text-foreground tracking-wider font-mono">
            {displayName !== 'Builder' ? displayName : truncateAddress(address)}
          </span>
          <ChevronDown className={`w-3 h-3 text-muted transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              {/* Profile Header */}
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-mono text-muted truncate max-w-[120px]">
                      {truncateAddress(address)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 rounded hover:bg-white/[0.05] transition-colors text-muted hover:text-white"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI developer Bio */}
              <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider">AI Developer Bio</span>
                  </div>
                  <button
                    onClick={(e) => handleGenerateBio(e)}
                    disabled={isGeneratingBio}
                    className="text-[9px] font-mono text-accent-indigo hover:text-white transition-colors flex items-center gap-1 bg-white/[0.03] hover:bg-white/[0.06] px-2 py-1 rounded-md border border-white/[0.06] disabled:opacity-50"
                  >
                    {isGeneratingBio ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : aiSummary ? (
                      'Regenerate'
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>

                {/* Format Toggle Buttons */}
                <div className="flex rounded-lg bg-white/[0.03] p-0.5 border border-white/[0.06] text-[9px] font-mono">
                  {(['linkedin', 'twitter', 'resume'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={(e) => handleFormatChange(fmt, e)}
                      disabled={isGeneratingBio}
                      className={`flex-1 py-1 px-1.5 rounded-md text-center capitalize transition-all duration-200 ${
                        selectedFormat === fmt
                          ? 'bg-accent-indigo text-white font-bold shadow-md shadow-accent-indigo/25'
                          : 'text-muted hover:text-white'
                      } disabled:opacity-50`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {typedSummary ? (
                  <p className="text-[10px] text-foreground/80 leading-relaxed font-sans max-h-24 overflow-y-auto pr-1 select-text">
                    {typedSummary}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted/50 italic leading-relaxed">
                    No bio generated yet. Click generate to build your AI profile.
                  </p>
                )}
                {bioError && (
                  <p className="text-[9px] text-red-400 font-mono">{bioError}</p>
                )}
              </div>

              {/* Connections */}
              <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
                <p className="text-[10px] font-mono text-muted uppercase tracking-wider">Social Integrations</p>
                
                {/* GitHub Connection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-muted" />
                    <span className="text-[11px] font-medium text-foreground">GitHub Identity</span>
                  </div>
                  {githubConnected ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Connected</span>
                  ) : (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/github-issuer/auth?stellarAddress=${address}`}
                      className="text-[10px] font-mono text-accent-indigo hover:text-white transition-colors underline"
                    >
                      Connect
                    </a>
                  )}
                </div>

                {/* LinkedIn Connection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-muted" />
                    <span className="text-[11px] font-medium text-foreground">LinkedIn Profile</span>
                  </div>
                  {linkedinConnected ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Connected</span>
                  ) : (
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/linkedin-issuer/auth?stellarAddress=${address}`}
                      className="text-[10px] font-mono text-accent-indigo hover:text-white transition-colors underline"
                    >
                      Connect
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="p-5 space-y-3 border-b border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-muted" />
                    <span className="text-[10px] font-mono text-muted">Network</span>
                  </div>
                  <span className="text-[10px] font-mono text-foreground">{networkName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-muted" />
                    <span className="text-[10px] font-mono text-muted">Status</span>
                  </div>
                  <span className="tag-orange !py-0.5 !px-2 !text-[8px]">Active</span>
                </div>
              </div>

              {/* Disconnect */}
              <button
                onClick={() => { disconnect(); setShowDropdown(false); }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-red-500/5 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5 text-red-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted group-hover:text-red-400">Disconnect</span>
                </div>
                <Lock className="w-3 h-3 text-muted/30" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- DISCONNECTED STATE ---
  return (
    <div className="flex flex-col items-end relative">
      <button
        onClick={connect}
        disabled={loading}
        className="btn-stellar disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
        ) : (
          <><Zap className="w-4 h-4" /> Connect Wallet</>
        )}
      </button>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute top-full mt-3 right-0 z-[110]"
          >
            <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
              <p className="text-[10px] font-mono text-red-400">
                {error.includes('Freighter') ? (
                  <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="hover:text-red-300 transition-colors">
                    Freighter not found — Click to install
                  </a>
                ) : error}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}