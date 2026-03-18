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
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover
                     text-white/90 transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-sm">{truncateAddress(address)}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl glass border border-white/10
                          shadow-2xl p-2 z-50">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-xs text-white/50">Connected</p>
              <p className="font-mono text-xs text-white/80 break-all">{address}</p>
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
                   bg-gradient-to-r from-indigo-600 to-purple-600
                   hover:from-indigo-500 hover:to-purple-500
                   text-white font-medium transition-all duration-300
                   hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:scale-95"
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
