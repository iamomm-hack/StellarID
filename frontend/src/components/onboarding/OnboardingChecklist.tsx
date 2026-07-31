'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Circle, Rocket } from 'lucide-react';

type OnboardingChecklistProps = {
  walletAddress: string;
  credentialCount: number;
  onRequestCredential: () => void;
};

type ManualStep = 'learned' | 'shared';

const emptyProgress: Record<ManualStep, boolean> = {
  learned: false,
  shared: false,
};

export default function OnboardingChecklist({
  walletAddress,
  credentialCount,
  onRequestCredential,
}: OnboardingChecklistProps) {
  const storageKey = `stellarid-onboarding:${walletAddress}`;
  const [manualProgress, setManualProgress] = useState(emptyProgress);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      setManualProgress(saved ? { ...emptyProgress, ...JSON.parse(saved) } : emptyProgress);
    } catch {
      setManualProgress(emptyProgress);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  const markComplete = (step: ManualStep) => {
    const next = { ...manualProgress, [step]: true };
    setManualProgress(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const steps = [
    {
      id: 'wallet',
      title: 'Connect your Stellar wallet',
      description: 'Your wallet is connected and ready.',
      complete: Boolean(walletAddress),
      action: null,
    },
    {
      id: 'learned',
      title: 'Learn how private proofs work',
      description: 'Review the 2-minute protocol walkthrough.',
      complete: manualProgress.learned,
      action: (
        <Link href="/how-it-works" onClick={() => markComplete('learned')} className="text-indigo-300 hover:text-indigo-200">
          View guide
        </Link>
      ),
    },
    {
      id: 'credential',
      title: 'Add your first credential',
      description: credentialCount > 0 ? `${credentialCount} credential${credentialCount === 1 ? '' : 's'} secured.` : 'Request a credential from a trusted issuer.',
      complete: credentialCount > 0,
      action: credentialCount === 0 ? (
        <button onClick={onRequestCredential} className="text-indigo-300 hover:text-indigo-200">
          Request now
        </button>
      ) : null,
    },
    {
      id: 'shared',
      title: 'Preview your public identity',
      description: 'Open the shareable profile your community can verify.',
      complete: manualProgress.shared,
      action: (
        <Link href={`/p/${walletAddress}`} target="_blank" rel="noopener noreferrer" onClick={() => markComplete('shared')} className="text-indigo-300 hover:text-indigo-200">
          Open profile
        </Link>
      ),
    },
  ];

  const completed = steps.filter((step) => step.complete).length;
  const progress = Math.round((completed / steps.length) * 100);

  if (!hydrated) return null;

  return (
    <section className="protocol-panel p-6 lg:p-7 mb-14" aria-labelledby="onboarding-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-indigo-300">Quick start</p>
            <h2 id="onboarding-title" className="text-lg font-bold">Your identity launch checklist</h2>
          </div>
        </div>
        <div className="min-w-[190px]">
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
            <span>{completed} of {steps.length} complete</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div key={step.id} className={`rounded-xl border p-4 ${step.complete ? 'border-emerald-400/20 bg-emerald-400/[0.03]' : 'border-white/[0.06] bg-white/[0.015]'}`}>
            <div className="flex items-start gap-3">
              {step.complete ? <Check className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 mt-0.5 text-muted shrink-0" />}
              <div className="min-w-0">
                <h3 className="text-xs font-semibold mb-1">{step.title}</h3>
                <p className="text-[10px] leading-relaxed text-muted min-h-8">{step.description}</p>
                {step.action && (
                  <div className="mt-3 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
                    {step.action}<ChevronRight className="w-3 h-3 text-indigo-300" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
