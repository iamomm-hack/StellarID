'use client';
import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Wallet, LogOut, ExternalLink, Loader2 } from 'lucide-react';

export default function ConnectWallet() {
  const { connect, disconnect, loading, error, address, isConnected } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#9ce4bf]
                     bg-[#e8f8ee] text-[#1f3f34] transition-all duration-300
                     hover:scale-[1.02] hover:bg-[#dff3e8] hover:border-[#73d9a8]
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fd6a0]/50"
        >
          <div className="w-2 h-2 rounded-full bg-[#35c383] animate-pulse" />
          <span className="font-mono text-sm">{truncateAddress(address)}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#9ce4bf]
                          bg-[#f2fff6] shadow-2xl p-2 z-50">
            <div className="px-3 py-2 border-b border-[#c9f0d9] mb-1">
              <p className="text-xs text-[#45685b]">Connected</p>
              <p className="font-mono text-xs text-[#2f5044] break-all">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400
                         hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={connect}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl
                   bg-gradient-to-r from-[#ff5a1f] to-[#ff7b46]
                   hover:from-[#ff6f3d] hover:to-[#ff9a5d]
                   text-white font-semibold transition-all duration-300
                   hover:shadow-lg hover:shadow-[#ff5a1f]/30 hover:scale-[1.02]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:scale-95 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#ff7b46]/50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          {error.includes('Freighter') ? (
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 underline hover:text-red-300"
            >
              Install Freighter <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span>{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
