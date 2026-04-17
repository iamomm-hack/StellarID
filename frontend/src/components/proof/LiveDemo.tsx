'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Zap, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

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
    <div className="brutal-card relative overflow-hidden">
      {/* Success flash overlay */}
      {state === 'success' && (
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'rgba(212, 255, 0, 0.03)', animation: 'glitchFlicker 2s infinite' }} />
      )}

      <div className="card-header-brutal"
           style={state === 'success'
             ? { background: 'var(--color-highlight)', color: 'var(--color-bg)' }
             : {}}>
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Live ZK Proof Demo
        </span>
        <span>[{state === 'idle' ? 'READY' : state === 'generating' ? 'COMPUTING' : 'VERIFIED'}]</span>
      </div>

      <div className="card-body-brutal relative z-10">
        {state === 'idle' && (
          <>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              Generate a real zero-knowledge proof. No wallet needed.
            </p>

            {/* Circuit selector */}
            <div className="mb-5">
              <label className="text-[10px] text-[var(--color-text-muted)] mb-2 block uppercase tracking-widest font-bold">
                Select Proof Type
              </label>
              <div className="grid grid-cols-2 gap-0">
                {circuits.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCircuit(c)}
                    className={`text-left p-3 border border-[#333] text-sm transition-all duration-200 ${
                      selectedCircuit.id === c.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-white'
                        : 'text-[var(--color-text-muted)] hover:border-[#555]'
                    }`}
                  >
                    <span className="font-bold block uppercase text-xs tracking-wider">{c.label}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">{c.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full btn-brutal btn-brutal-primary flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Generate ZK Proof
            </button>
          </>
        )}

        {state === 'generating' && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-2 border-[#333] border-t-[var(--color-accent)]"
                 style={{ animation: 'spin-slow 0.8s linear infinite' }} />
            <p className="text-sm text-[var(--color-text-main)] mb-1">
              Generating proof for <span style={{ color: 'var(--color-accent)' }} className="font-bold">{selectedCircuit.label}</span>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-[var(--color-text-muted)]">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono text-lg text-white">{(elapsed / 1000).toFixed(2)}s</span>
            </div>
            <div className="mt-4 mx-auto max-w-[200px] h-1 bg-[#222] overflow-hidden">
              <div className="h-full" 
                   style={{ 
                     width: `${Math.min(95, (elapsed / 14))}%`,
                     background: 'var(--color-accent)',
                     transition: 'width 0.1s linear'
                   }} />
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="py-4 text-center">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center border border-[var(--color-highlight)]"
                 style={{ background: 'rgba(212, 255, 0, 0.1)' }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--color-highlight)' }} />
            </div>
            <p className="text-lg font-bold mb-1 uppercase tracking-wider"
               style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--color-highlight)' }}>
              Proof Verified
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">
              <span className="font-mono text-white">{(finalTime / 1000).toFixed(2)}s</span> — {selectedCircuit.label}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mb-5">Zero data shared. Only YES/NO result transmitted.</p>

            {/* Results table */}
            <table className="edge-table w-full mb-5" style={{ fontSize: '0.8rem' }}>
              <tbody>
                <tr>
                  <td>Data Exposed</td>
                  <td style={{ color: 'var(--color-highlight)' }} className="text-right font-bold">NONE</td>
                </tr>
                <tr>
                  <td>Proof Size</td>
                  <td className="text-right text-white font-bold">256 B</td>
                </tr>
                <tr>
                  <td>Verification</td>
                  <td style={{ color: 'var(--color-highlight)' }} className="text-right font-bold">VALID</td>
                </tr>
              </tbody>
            </table>

            <button
              onClick={handleReset}
              className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Try another proof
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
