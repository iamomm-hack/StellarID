'use client';

import { useState, useRef } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, ShieldCheck, ChevronDown, Zap, Wifi, Activity, Lock } from 'lucide-react';

export default function ConnectWallet() {
  const { connect, disconnect, loading, error, address, isConnected } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // --- CONNECTED STATE ---
  if (isConnected && address) {
    return (
      <div className="relative z-[100]" onMouseLeave={() => setShowDropdown(false)}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="group flex items-center gap-3 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] hover:border-accent-indigo/30 transition-all duration-300"
        >
          <div className="relative">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-indigo" />
          </div>
          <span className="text-[11px] font-bold text-foreground tracking-wider font-mono">
            {truncateAddress(address)}
          </span>
          <ChevronDown className={`w-3 h-3 text-muted transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [.23, 1, .32, 1] }}
              className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              {/* Address */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <p className="text-[10px] font-mono text-muted mb-2 uppercase tracking-wider">Connected Wallet</p>
                <p className="text-[11px] font-mono text-foreground/70 break-all leading-relaxed">{address}</p>
              </div>

              {/* Stats */}
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3 h-3 text-muted" />
                    <span className="text-[10px] font-mono text-muted">Network</span>
                  </div>
                  <span className="text-[10px] font-mono text-foreground">Stellar Mainnet</span>
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
                className="w-full flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06] hover:bg-red-500/5 transition-colors group"
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