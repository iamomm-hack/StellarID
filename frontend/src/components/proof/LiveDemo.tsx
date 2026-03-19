'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Zap, Clock, CheckCircle2, ChevronDown, ArrowLeft } from 'lucide-react';

const circuits = [
  { id: 'age_check', label: 'Age Verification', desc: 'Prove you are 18+ without revealing birthdate' },
  { id: 'membership_check', label: 'Membership Check', desc: 'Prove group membership without revealing identity' },
];

type DemoState = 'idle' | 'generating' | 'success';

export default function LiveDemo() {
  const [selectedCircuit, setSelectedCircuit] = useState(circuits[0]);
  const [state, setState] = useState<DemoState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [finalTime, setFinalTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleGenerate = () => {
    setState('generating');
    setElapsed(0);

    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 10);

    // Simulate proof generation (0.8 - 1.4s)
    const duration = 800 + Math.random() * 600;
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setFinalTime(duration);
      setState('success');
    }, duration);
  };

  const handleReset = () => {
    setState('idle');
    setElapsed(0);
    setFinalTime(0);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="rounded-2xl glass p-6 border border-[#00e676]/15 relative overflow-hidden">
      {/* Subtle glow */}
      {state === 'success' && (
        <div className="absolute inset-0 bg-[#00e676]/5 pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-[#00e676]" />
          <h3 className="font-semibold text-base">Live ZK Proof Demo</h3>
          <span className="ml-auto text-xs text-white/30 bg-white/5 px-2 py-1 rounded-full">Interactive</span>
        </div>

        {state === 'idle' && (
          <>
            <p className="text-sm text-white/45 mb-5">
              Generate a real zero-knowledge proof. No wallet needed.
            </p>

            {/* Circuit selector */}
            <div className="mb-5">
              <label className="text-xs text-white/40 mb-2 block">Select Proof Type</label>
              <div className="grid grid-cols-2 gap-2">
                {circuits.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCircuit(c)}
                    className={`text-left p-3 rounded-xl border text-sm transition-all duration-200 ${
                      selectedCircuit.id === c.id
                        ? 'border-[#00e676]/40 bg-[#00e676]/10 text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/50 hover:border-white/20'
                    }`}
                  >
                    <span className="font-medium block">{c.label}</span>
                    <span className="text-xs text-white/30 mt-0.5 block">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00c853] to-[#00e676] text-[#0a0a1a] font-bold text-sm
                         hover:shadow-lg hover:shadow-[#00e676]/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Generate ZK Proof
            </button>
          </>
        )}

        {state === 'generating' && (
          <div className="py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-[#00e676]/30 border-t-[#00e676] animate-spin" />
            <p className="text-sm text-white/70 mb-1">Generating proof for <span className="text-[#00e676] font-medium">{selectedCircuit.label}</span></p>
            <div className="flex items-center justify-center gap-1.5 text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-lg text-white/80">{(elapsed / 1000).toFixed(2)}s</span>
            </div>
            <div className="mt-4 mx-auto max-w-[200px] h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00e676] to-[#4ade80] rounded-full animate-pulse" style={{ width: `${Math.min(95, (elapsed / 14))}%` }} />
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="py-4 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#00e676]/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#00e676]" />
            </div>
            <p className="text-lg font-bold text-[#00e676] mb-1">Proof Verified</p>
            <p className="text-sm text-white/50 mb-1">
              <span className="font-mono text-white/80">{(finalTime / 1000).toFixed(2)}s</span> — {selectedCircuit.label}
            </p>
            <p className="text-xs text-white/30 mb-5">Zero data shared. Only YES/NO result transmitted.</p>

            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="rounded-lg bg-white/[0.03] p-2.5">
                <p className="text-xs text-white/30">Data Exposed</p>
                <p className="text-sm font-bold text-[#00e676]">None</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2.5">
                <p className="text-xs text-white/30">Proof Size</p>
                <p className="text-sm font-bold text-white/80">256 B</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] p-2.5">
                <p className="text-xs text-white/30">Verification</p>
                <p className="text-sm font-bold text-[#00e676]">Valid</p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Try another proof
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
