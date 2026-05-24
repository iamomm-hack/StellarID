'use client';

import { Github, ExternalLink, LogOut } from 'lucide-react';
import Image from 'next/image';

interface GitHubGreetingProps {
  username: string;
  avatarUrl?: string;
  profileUrl?: string;
  onLogout?: () => void;
}

export default function GitHubGreeting({ username, avatarUrl, profileUrl, onLogout }: GitHubGreetingProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      {avatarUrl && (
        <Image src={avatarUrl} alt={username} width={32} height={32} unoptimized className="rounded-full border border-white/[0.08]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono text-muted truncate">Connected as</p>
        <p className="text-sm font-bold text-foreground truncate">{username}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.06] hover:border-accent-indigo/30 transition-colors">
            <ExternalLink className="w-3 h-3 text-muted" />
          </a>
        )}
        {onLogout && (
          <button onClick={onLogout}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
            <LogOut className="w-3 h-3 text-accent-indigo" />
          </button>
        )}
      </div>
    </div>
  );
}
