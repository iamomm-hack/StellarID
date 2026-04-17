'use client';
import { Linkedin } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

interface LinkedInGreetingProps {
  credential: any;
}

export default function LinkedInGreeting({ credential }: LinkedInGreetingProps) {
  const { disconnect } = useWalletStore();
  const name = credential?.claim_data?.linkedin_name || 'Professional';
  const picture = credential?.claim_data?.linkedin_picture || '';

  return (
    <div className="flex items-center justify-between mb-6 border border-[#333] bg-[var(--color-surface)]"
         style={{ borderLeft: '4px solid #0077b5' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {picture ? (
          <img
            src={picture}
            alt={name}
            className="w-8 h-8 border border-[#333]"
          />
        ) : (
          <Linkedin className="w-5 h-5 text-[#0077b5]" />
        )}
        <div>
          <p className="text-sm font-bold text-white uppercase tracking-wider">
            LinkedIn verified: <span className="text-[#0077b5]">{name}</span>
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            LinkedIn account linked • Professional identity confirmed
          </p>
        </div>
      </div>
    </div>
  );
}
