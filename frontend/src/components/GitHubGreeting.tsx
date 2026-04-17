'use client';
import { Github, LogOut } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

interface GitHubGreetingProps {
  credential: any;
}

export default function GitHubGreeting({ credential }: GitHubGreetingProps) {
  const { disconnect } = useWalletStore();
  const username = credential?.claim_data?.github_username || 'Developer';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    if (
      confirm(
        `Are you sure you want to logout? You'll be disconnected from GitHub (${username}).`
      )
    ) {
      disconnect();
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="flex items-center justify-between mb-6 border border-[#333] bg-[var(--color-surface)]"
         style={{ borderLeft: '4px solid var(--color-highlight)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Github className="w-5 h-5" style={{ color: 'var(--color-highlight)' }} />
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wider">
            {getGreeting()}, <span style={{ color: 'var(--color-highlight)' }}>{username}</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            GitHub account linked • Click logout to disconnect
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 mr-4 text-xs font-bold uppercase tracking-wider transition-all"
        style={{ color: 'var(--color-accent)', border: '1px solid var(--color-accent)', background: 'rgba(255, 60, 0, 0.1)' }}
      >
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </button>
    </div>
  );
}
