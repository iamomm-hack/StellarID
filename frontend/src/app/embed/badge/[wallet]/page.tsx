'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { profileApi } from '@/lib/api';
import { ShieldCheck, Loader2, Award } from 'lucide-react';
import Image from 'next/image';

interface EmbedBadgeProps {
  params: {
    wallet: string;
  };
}

function EmbedBadgeContent({ params }: EmbedBadgeProps) {
  const { wallet } = params;
  const searchParams = useSearchParams();
  const style = searchParams.get('style') || 'dark'; // 'light' | 'dark'
  const size = searchParams.get('size') || 'md';   // 'sm' | 'md' | 'lg'

  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    setError(false);
    profileApi.getCardData(wallet)
      .then((res) => {
        setCardData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load embed card data:', err);
        setError(true);
        setLoading(false);
      });
  }, [wallet]);

  const handleBadgeClick = () => {
    if (typeof window !== 'undefined') {
      window.open(`/p/${wallet}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="embed-badge-container w-full h-full flex items-center justify-center p-2 bg-transparent">
        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !cardData) {
    return (
      <div 
        onClick={handleBadgeClick}
        className={`embed-badge-container w-full h-full flex items-center justify-center p-3 border rounded-xl cursor-pointer select-none transition-all duration-300 ${
          style === 'light' 
            ? 'bg-white/80 border-red-200 text-red-600' 
            : 'bg-slate-950/80 border-red-900/30 text-red-400'
        }`}
      >
        <span className="text-[10px] font-mono tracking-tight font-bold">StellarID Badge Error</span>
      </div>
    );
  }

  const truncatedName = cardData.display_name.length > 14 
    ? `${cardData.display_name.slice(0, 12)}...` 
    : cardData.display_name;

  const truncatedWallet = cardData.wallet_address.length > 10
    ? `${cardData.wallet_address.slice(0, 4)}...${cardData.wallet_address.slice(-4)}`
    : cardData.wallet_address;

  // Responsive padding/font sizes based on badge size option
  const sizeStyles = {
    sm: {
      padding: 'p-2',
      avatarSize: 'w-8 h-8 text-sm',
      titleSize: 'text-xs',
      subSize: 'text-[9px]',
      scoreSize: 'text-base',
      scoreIcon: 'w-3 h-3',
      containerHeight: 'h-[60px]',
    },
    md: {
      padding: 'p-3',
      avatarSize: 'w-10 h-10 text-base',
      titleSize: 'text-sm',
      subSize: 'text-[10px]',
      scoreSize: 'text-xl',
      scoreIcon: 'w-4 h-4',
      containerHeight: 'h-[80px]',
    },
    lg: {
      padding: 'p-4',
      avatarSize: 'w-12 h-12 text-lg',
      titleSize: 'text-base',
      subSize: 'text-xs',
      scoreSize: 'text-2xl',
      scoreIcon: 'w-5 h-5',
      containerHeight: 'h-[100px]',
    }
  };

  const currentSize = sizeStyles[size as 'sm' | 'md' | 'lg'] || sizeStyles.md;

  const tierColors = {
    'Verified': 'border-slate-500/20 text-slate-400 bg-slate-500/5',
    'Proven': 'border-blue-500/20 text-blue-400 bg-blue-500/5',
    'Elite Builder': 'border-purple-500/20 text-purple-400 bg-purple-500/5',
  };

  const activeTierStyle = tierColors[cardData.tier as 'Verified' | 'Proven' | 'Elite Builder'] || tierColors['Verified'];

  return (
    <div 
      onClick={handleBadgeClick}
      className={`embed-badge-container w-full ${currentSize.containerHeight} flex items-center justify-between ${currentSize.padding} border rounded-xl cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] ${
        style === 'light' 
          ? 'bg-white/90 border-slate-200 text-slate-900 hover:border-purple-500/40 shadow-sm' 
          : 'bg-slate-950/80 border-white/[0.08] text-white hover:border-purple-500/40 shadow-lg'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-extrabold text-purple-400 shadow-inner overflow-hidden ${currentSize.avatarSize}`}>
            {cardData.avatar_url ? (
              <Image
                src={cardData.avatar_url}
                alt={cardData.display_name}
                className="w-full h-full object-cover"
                width={48}
                height={48}
                unoptimized
              />
            ) : (
              cardData.display_name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-background border border-white/10 rounded-full p-0.5 shadow-md">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
          </div>
        </div>

        {/* User Details */}
        <div className="min-w-0 flex flex-col justify-center">
          <h4 className={`font-black tracking-tight leading-none mb-1 ${currentSize.titleSize}`}>
            {truncatedName}
          </h4>
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${activeTierStyle}`}>
              {cardData.tier}
            </span>
            <span className={`font-mono text-[9px] ${style === 'light' ? 'text-slate-400' : 'text-muted'}`}>
              {truncatedWallet}
            </span>
          </div>
        </div>
      </div>

      {/* Score Section */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="text-right">
          <div className={`font-mono uppercase tracking-wider text-[8px] ${style === 'light' ? 'text-slate-400' : 'text-muted'}`}>
            Score
          </div>
          <div className={`font-black tracking-tight leading-none bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent ${currentSize.scoreSize}`}>
            {cardData.reputation_score}
          </div>
        </div>
        <div className={`flex items-center justify-center p-1.5 rounded-lg ${style === 'light' ? 'bg-slate-100 text-purple-600' : 'bg-white/[0.03] text-purple-400 border border-white/[0.05]'}`}>
          <Award className={currentSize.scoreIcon} />
        </div>
      </div>
    </div>
  );
}

export default function EmbedBadgePage({ params }: EmbedBadgeProps) {
  return (
    <Suspense fallback={
      <div className="embed-badge-container w-full h-full flex items-center justify-center p-2 bg-transparent">
        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
      </div>
    }>
      <EmbedBadgeContent params={params} />
    </Suspense>
  );
}
