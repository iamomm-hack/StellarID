'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageSquareText, Star, X } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';

const feedbackFormUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;

export default function FeedbackWidget() {
  const { address } = useWalletStore();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyWallet = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const formHref = feedbackFormUrl
    ? `${feedbackFormUrl}${feedbackFormUrl.includes('?') ? '&' : '?'}usp=pp_url&rating=${rating || ''}`
    : undefined;

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {open && (
        <div className="protocol-panel w-[min(360px,calc(100vw-2.5rem))] p-5 mb-3 shadow-2xl shadow-black/40" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-indigo-300">Builder feedback</p>
              <h2 id="feedback-title" className="text-base font-bold mt-1">Help shape StellarID</h2>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close feedback" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-muted leading-relaxed mb-4">
            Rate your experience, then share your name, email, wallet and product feedback in our onboarding form.
          </p>

          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted">Your rating</span>
            <div className="flex gap-2 mt-2" aria-label="Product rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => setRating(value)} aria-label={`Rate ${value} out of 5`} className="p-1 rounded-md hover:bg-white/[0.05]">
                  <Star className={`w-6 h-6 ${value <= rating ? 'fill-amber-300 text-amber-300' : 'text-white/20'}`} />
                </button>
              ))}
            </div>
          </div>

          {address && (
            <button onClick={copyWallet} className="w-full flex items-center justify-between gap-3 p-3 mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-left">
              <span className="text-[10px] font-mono text-muted truncate">{address}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-muted shrink-0" />}
            </button>
          )}

          {formHref ? (
            <a href={formHref} target="_blank" rel="noopener noreferrer" className="btn-stellar w-full flex items-center justify-center gap-2 !py-3">
              Continue to feedback form <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-3 text-[10px] leading-relaxed text-amber-200">
              Feedback form is being refreshed. Set NEXT_PUBLIC_FEEDBACK_FORM_URL to publish the new form.
            </p>
          )}
        </div>
      )}

      <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="ml-auto flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-600 px-4 py-3 text-xs font-bold shadow-lg shadow-indigo-950/40 hover:bg-indigo-500 transition-colors">
        <MessageSquareText className="w-4 h-4" /> Feedback
      </button>
    </div>
  );
}
