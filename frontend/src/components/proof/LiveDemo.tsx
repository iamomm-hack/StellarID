'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, CheckCircle2, Cpu, 
  Lock, Fingerprint, Globe, Activity, EyeOff
} from 'lucide-react';

// --- PROTOCOL STAGES ---
const STAGES = [
  {
    id: 'handshake',
    title: 'Identity Handshake',
    num: '01',
    desc: 'Establishing secure connection with the Stellar network issuer.',
    icon: Globe,
    color: '#FF6A00'
  },
  {
    id: 'witness',
    title: 'Witness Generation',
    num: '02',
    desc: 'Compiling private inputs into a mathematical witness vector.',
    icon: Cpu,
    color: '#FF8C38'
  },
  {
    id: 'proving',
    title: 'Proof Computation',
    num: '03',
    desc: 'Executing Groth16 zk-SNARK prover for the cryptographic truth artifact.',
    icon: Activity,
    color: '#CC5500'
  },
  {
    id: 'verified',
    title: 'Protocol Finality',
    num: '04',
    desc: 'Identity verified with zero knowledge leakage.',
    icon: Shield,
    color: '#FF6A00'
  }
];

export default function LiveDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const runDemo = () => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveStage(0);
    setLogs([]);

    const protocol = [
      { stage: 0, log: "Initiating P2P handshake...", delay: 0 },
      { stage: 0, log: "Network tunnel established.", delay: 800 },
      { stage: 1, log: "Fetching R1CS constraints...", delay: 1600 },
      { stage: 1, log: "Witness vector compiled.", delay: 2400 },
      { stage: 2, log: "Executing SNARK prover (BN128)...", delay: 3200 },
      { stage: 2, log: "Polynomial commitments verified.", delay: 4000 },
      { stage: 2, log: "Proof artifact generated.", delay: 4800 },
      { stage: 3, log: "Identity verified. Zero data leaked.", delay: 5600 },
    ];

    protocol.forEach(({ stage, log, delay }) => {
      setTimeout(() => {
        setActiveStage(stage);
        setLogs(prev => [...prev, `> ${log}`]);
        if (stage === 3 && log.includes("Zero data")) {
          setIsRunning(false);
        }
      }, delay);
    });
  };

  return (
    <div className="bg-[#0a0a0a] rounded-2xl overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-[#FF6A00]" />
          <span className="text-[11px] font-mono text-[#666660] uppercase tracking-wider">Live Protocol Demo</span>
        </div>
        <button
          onClick={runDemo}
          disabled={isRunning}
          className="btn-stellar !py-2 !px-5 !text-[10px] disabled:opacity-40"
        >
          {isRunning ? 'Running...' : activeStage === 3 ? 'Run Again' : 'Start Demo'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-0">
        {/* Left — Steps */}
        <div className="p-6 border-r border-white/[0.06]">
          <div className="space-y-3">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStage === idx;
              const isPast = activeStage > idx;
              const isFuture = activeStage < idx;

              return (
                <motion.div
                  key={stage.id}
                  animate={{ 
                    opacity: isFuture ? 0.3 : 1,
                    scale: isActive ? 1.02 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-colors duration-300 ${
                    isActive ? 'bg-white/[0.04] border border-white/[0.08]' :
                    isPast ? 'border border-transparent' :
                    'border border-transparent'
                  }`}
                >
                  {/* Step indicator */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isPast ? 'bg-[#FF6A00]/10 border border-[#FF6A00]/20' :
                    isActive ? 'border-2' : 'bg-white/[0.03] border border-white/[0.06]'
                  }`} style={isActive ? { borderColor: stage.color + '40', background: stage.color + '10' } : {}}>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[#FF6A00]" />
                    ) : (
                      <Icon className="w-4 h-4" style={{ color: isActive ? stage.color : '#666660' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold" style={{ color: isActive ? stage.color : '#666660' }}>{stage.num}</span>
                      <h4 className={`text-sm font-bold ${isActive ? 'text-[#f5f5f0]' : isPast ? 'text-[#a8a8a0]' : 'text-[#666660]'}`}>
                        {stage.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-[#666660] leading-relaxed">{stage.desc}</p>

                    {/* Active stage pulsing bar */}
                    {isActive && isRunning && (
                      <motion.div className="mt-3 h-0.5 rounded-full overflow-hidden bg-white/[0.06]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: stage.color }}
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 1.5, ease: 'easeInOut' }}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right — Terminal */}
        <div className="p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
            </div>
            <span className="text-[10px] font-mono text-[#666660] ml-2">zk_prover.sh</span>
          </div>
          
          <div className="bg-[#111111] rounded-xl border border-white/[0.06] p-5 font-mono text-xs flex-grow min-h-[280px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="flex items-center gap-2 text-[#666660]">
                <span className="text-[#FF6A00]">$</span> 
                <span>Press &quot;Start Demo&quot; to begin...</span>
              </div>
            ) : (
              logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-2 flex items-start gap-2"
                >
                  <span className="text-[#FF6A00] shrink-0">➜</span>
                  <span className={i === logs.length - 1 ? 'text-[#f5f5f0]' : 'text-[#a8a8a0]'}>{log}</span>
                </motion.div>
              ))
            )}

            {isRunning && (
              <motion.div
                animate={{ opacity: [0, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-2 h-4 bg-[#FF6A00]/60 mt-2"
              />
            )}

            {/* Success state */}
            {activeStage === 3 && !isRunning && logs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl border border-[#FF6A00]/20 bg-[#FF6A00]/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#FF6A00]" />
                  <span className="text-[#FF6A00] font-bold text-[11px]">VERIFIED</span>
                </div>
                <p className="text-[10px] text-[#FF6A00]/70">Proof: 0x4f...8a2 • Zero data leaked</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}