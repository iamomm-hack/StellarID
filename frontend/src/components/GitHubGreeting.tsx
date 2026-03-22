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
      // Refresh page to reset everything
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 mb-6 rounded-xl
                    bg-gradient-to-r from-[#00e676]/10 to-[#7c3aed]/10
                    border border-[#00e676]/20 hover:border-[#00e676]/40 transition-all">
      <div className="flex items-center gap-3">
        <Github className="w-5 h-5 text-[#00e676]" />
        <div>
          <p className="text-sm font-medium text-white">
            {getGreeting()}, <span className="font-semibold text-[#00e676]">{username}</span>
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            GitHub account linked • Click logout to disconnect
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                   bg-red-500/20 hover:bg-red-500/30
                   text-red-400 text-xs font-medium
                   transition-all"
      >
        <LogOut className="w-3.5 h-3.5" />
        Logout
      </button>
    </div>
  );
}
