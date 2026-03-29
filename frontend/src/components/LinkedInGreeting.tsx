'use client';
import { Linkedin, LogOut } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';

interface LinkedInGreetingProps {
  credential: any;
}

export default function LinkedInGreeting({ credential }: LinkedInGreetingProps) {
  const { disconnect } = useWalletStore();
  const name = credential?.claim_data?.linkedin_name || 'Professional';
  const picture = credential?.claim_data?.linkedin_picture || '';

  return (
    <div className="flex items-center justify-between px-4 py-3 mb-6 rounded-xl
                    bg-gradient-to-r from-[#0077b5]/15 to-[#7c3aed]/10
                    border border-[#0077b5]/25 hover:border-[#0077b5]/45 transition-all">
      <div className="flex items-center gap-3">
        {picture ? (
          <img
            src={picture}
            alt={name}
            className="w-8 h-8 rounded-full border border-[#0077b5]/40"
          />
        ) : (
          <Linkedin className="w-5 h-5 text-[#0077b5]" />
        )}
        <div>
          <p className="text-sm font-medium text-white">
            LinkedIn verified:{' '}
            <span className="font-semibold text-[#0077b5]">{name}</span>
          </p>
          <p className="text-xs text-white/50 mt-0.5">
            LinkedIn account linked • Professional identity confirmed
          </p>
        </div>
      </div>
    </div>
  );
}
