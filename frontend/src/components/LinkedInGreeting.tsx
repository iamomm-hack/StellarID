'use client';
import { Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useWalletStore } from '../store/walletStore';

interface LinkedInGreetingProps {
  credential: any;
}

export default function LinkedInGreeting({ credential }: LinkedInGreetingProps) {
  const { disconnect } = useWalletStore();
  const name = credential?.claim_data?.linkedin_name || 'Professional';
  const picture = credential?.claim_data?.linkedin_picture || '';

  return (
    <div className="flex items-center justify-between mb-6 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
      <div className="flex items-center gap-3">
        {picture ? (
          <Image
            src={picture}
            alt={name}
            width={32}
            height={32}
            unoptimized
            className="rounded-full border border-blue-500/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Linkedin className="w-4 h-4 text-blue-400" />
          </div>
        )}
        <div>
          <p className="text-xs font-mono text-blue-400 uppercase tracking-wider">
            LinkedIn Verification Active
          </p>
          <p className="text-sm font-bold text-foreground mt-0.5">
            LinkedIn verified: <span className="text-blue-400">{name}</span>
          </p>
          <p className="text-[10px] text-muted mt-0.5">
            LinkedIn account linked • Professional identity confirmed
          </p>
        </div>
      </div>
    </div>
  );
}
