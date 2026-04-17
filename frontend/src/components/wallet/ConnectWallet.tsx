'use client';
import { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

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
          className="flex items-center gap-2 px-4 py-2 border border-[var(--color-highlight)] text-[var(--color-highlight)] text-sm font-bold uppercase tracking-wider transition-all hover:bg-[var(--color-highlight)] hover:text-[var(--color-bg)]"
          style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
        >
          <div className="w-2 h-2 bg-[var(--color-highlight)]" style={{ animation: 'pulse-accent 2s ease-in-out infinite' }} />
          <span className="font-mono text-xs">{truncateAddress(address)}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 border border-[#333] bg-[var(--color-surface)] shadow-2xl z-50">
            <div className="px-3 py-2 border-b border-[#333]">
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Connected</p>
              <p className="font-mono text-[11px] text-[var(--color-text-main)] break-all mt-1">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors uppercase tracking-wider font-semibold"
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
        className="btn-brutal btn-brutal-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect
          </>
        )}
      </button>

      {error && (
        <div className="text-xs text-[var(--color-accent)]">
          {error.includes('Freighter') ? (
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--color-highlight)]"
            >
              Install Freighter →
            </a>
          ) : (
            <span>{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
