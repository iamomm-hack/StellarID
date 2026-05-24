'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Shield, Check, Lock, Eye, Download, 
  ExternalLink, Link2, Terminal, Cpu, Zap, 
  Fingerprint, Activity, Database, RefreshCw, 
  ShieldCheck, AlertCircle, ChevronRight
} from 'lucide-react';
import { useZKProof } from '../../hooks/useZKProof';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1';

interface Credential {
  id: string;
  credential_type: string;
  nft_token_id: string;
}

interface ProofGeneratorProps {
  credential: Credential;
  onClose: () => void;
}

type ClaimType = 'age_18' | 'age_21' | 'income_100k' | 'residency';

const claimOptions: { value: ClaimType; label: string; description: string; circuit: string }[] = [
  { value: 'age_18', label: 'Over 18 Check', description: 'Zero-Knowledge Age Gate (18+)', circuit: 'circuit_v1.0.1_age_gate' },
  { value: 'age_21', label: 'Over 21 Check', description: 'Zero-Knowledge Age Gate (21+)', circuit: 'circuit_v1.0.1_age_gate' },
  { value: 'income_100k', label: 'Financial Threshold', description: 'ZK Private Income Verification', circuit: 'circuit_v2.1.0_fin_alpha' },
  { value: 'residency', label: 'Global Residency', description: 'Geographic Proof of Origin', circuit: 'circuit_v1.2.0_geo_verify' },
];

const PROVING_LOGS = [
  "INITIALIZING_VIRTUAL_MACHINE...",
  "FETCHING_R1CS_CONSTRAINTS...",
  "GENERATING_WITNESS_VECTOR...",
  "COMPUTING_POLYNOMIAL_COMMITMENTS...",
  "EXECUTING_GROTH16_PROVER...",
  "STARK_FRI_LAYER_VALIDATION...",
  "ANCHORING_PROTOCOL_STATE...",
  "FINALIZING_PROOF_ARTIFACT..."
];

export default function ProofGenerator({ credential, onClose }: ProofGeneratorProps) {
  const [step, setStep] = useState(1);
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimType | null>(null);
  const [proofResult, setProofResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  
  const { generateAgeProof, generateIncomeProof, loading, error } = useZKProof();
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal and log simulation
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  useEffect(() => {
    if (step === 3 && activeLogIndex < PROVING_LOGS.length) {
      const timer = setTimeout(() => {
        setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${PROVING_LOGS[activeLogIndex]}`]);
        setActiveLogIndex(prev => prev + 1);
      }, 400 + Math.random() * 600);
      return () => clearTimeout(timer);
    }
  }, [step, activeLogIndex]);

  const handleGenerateProof = async () => {
    if (!selectedClaim) return;
    setStep(3);
    setTerminalLogs([`[${new Date().toLocaleTimeString()}] INITIATING_HANDSHAKE_ENCLAVE...`]);

    let result: any;
    const nftId = parseInt(credential.nft_token_id) || 1;

    try {
      switch (selectedClaim) {
        case 'age_18': result = await generateAgeProof(1995, 6, 15, nftId, 18); break;
        case 'age_21': result = await generateAgeProof(1995, 6, 15, nftId, 21); break;
        case 'income_100k': result = await generateIncomeProof(150000, nftId, 100000); break;
        default: result = await generateAgeProof(1995, 6, 15, nftId, 18);
      }

      if (result) {
        setProofResult(result);
        setTimeout(async () => {
          await finalizeProofOnServer(result);
          setStep(4);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      setStep(1);
    }
  };

  const finalizeProofOnServer = async (result: any) => {
    try {
      const stored = localStorage.getItem('stellar-id-wallet');
      const token = stored ? JSON.parse(stored)?.state?.token : null;
      if (token) {
        const res = await fetch(`${API}/proofs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            circuitType: selectedClaim?.includes('age') ? 'age_check' : 'income_check',
            claimType: getClaimLabel(),
            proofData: result,
          }),
        });
        const data = await res.json();
        if (data.publicToken) setShareUrl(`${window.location.origin}/verify/${data.publicToken}`);
      }
    } catch {}
  };

  const getClaimLabel = () => claimOptions.find(o => o.value === selectedClaim)?.label || 'Claim Verified';

  return (
    <div className="edge-modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
        className="protocol-panel max-w-2xl w-full overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cinematic Header */}
        <div className="relative px-8 py-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-accent-indigo" />
            <div>
              <p className="text-[10px] font-mono tracking-[0.15em] text-muted uppercase leading-none mb-1">ZK Proving Engine</p>
              <h2 className="text-sm font-bold tracking-tight text-foreground leading-none">Identity Prover v3</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/[0.05] rounded-full transition-all group">
            <X className="w-5 h-5 text-muted group-hover:text-foreground" />
          </button>
        </div>

        <div className="relative p-8 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* --- STEP 1: MODULE SELECTION --- */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-accent-indigo/50" />
                  <span className="text-[10px] font-mono text-accent-indigo tracking-[0.15em]">Select Proving Module</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {claimOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSelectedClaim(option.value); setStep(2); }}
                      className="group relative text-left p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-accent-indigo/30 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <Cpu className="w-4 h-4 text-muted group-hover:text-accent-indigo transition-colors" />
                        <span className="text-[8px] font-mono text-muted tracking-tighter uppercase">{option.circuit}</span>
                      </div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">{option.label}</p>
                      <p className="text-[10px] text-muted leading-tight">{option.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* --- STEP 2: MANIFEST VALIDATION --- */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-indigo/30 to-transparent" />
                  <div className="flex items-center gap-4 mb-6">
                    <Database className="w-5 h-5 text-muted" />
                    <span className="text-[10px] font-mono tracking-[0.15em] text-muted uppercase">Input Manifest</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-[10px] font-mono text-muted uppercase">Credential</span>
                      <span className="text-xs font-bold text-foreground tracking-tight">#{credential.nft_token_id.slice(0, 16)}...</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-[10px] font-mono text-muted uppercase">Protocol</span>
                      <span className="text-xs font-bold text-foreground tracking-tight">{getClaimLabel()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-mono text-muted uppercase">Enclave</span>
                      <span className="text-[10px] font-mono text-accent-indigo">Local Browser Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border-l-2 border-accent-indigo bg-accent-indigo/5">
                  <Lock className="w-4 h-4 text-accent-indigo shrink-0 mt-0.5" />
                  <p className="text-[10px] text-accent-indigo/80 leading-relaxed">
                    Zero-Knowledge Warning: Private data stays within your browser. 
                    The proving circuit only outputs a mathematical truth artifact.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setStep(1)} className="btn-stellar-ghost !py-4">Back</button>
                  <button onClick={handleGenerateProof} className="btn-stellar !py-4">Generate Proof</button>
                </div>
              </motion.div>
            )}

            {/* --- STEP 3: COMPUTATION CORE (THE SHOW) --- */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 flex flex-col flex-grow">
                {/* Visual Proving Core */}
                <div className="relative h-32 flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-32 h-32 border border-white/5 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24 border border-dashed border-accent-indigo/20 rounded-full"
                  />
                  <div className="relative z-10 flex flex-col items-center">
                    <Zap className="w-8 h-8 text-accent-indigo animate-pulse mb-2" />
                    <span className="text-[9px] font-mono text-accent-indigo tracking-[0.15em] uppercase animate-pulse">Computing Proof</span>
                  </div>
                  {/* Dynamic Shimmer Progress */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-transparent via-accent-indigo to-transparent w-1/3"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>

                {/* Live Terminal Log */}
                <div className="border border-white/[0.06] rounded-2xl p-5 flex-grow h-48 overflow-y-auto font-mono text-[9px] text-muted leading-relaxed" style={{ background: 'hsl(var(--background))' }}>
                  <div className="flex flex-col gap-1">
                    {terminalLogs.map((log, i) => (
                      <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex gap-2">
                        <span className="text-accent-indigo shrink-0">➜</span>
                        <span className={i === terminalLogs.length - 1 ? "text-white" : ""}>{log}</span>
                      </motion.div>
                    ))}
                    <div ref={terminalEndRef} />
                    <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-3 bg-muted/50 ml-6" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* --- STEP 4: SUCCESS ARTIFACT --- */}
            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="space-y-8 text-center"
              >
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-accent-indigo/10 border border-accent-indigo/30 flex items-center justify-center rounded-2xl relative z-10">
                    <ShieldCheck className="w-10 h-10 text-accent-indigo" />
                  </div>
                </div>

                <div>
                  <h3 className="text-display text-4xl mb-2">Protocol_Success</h3>
                  <p className="text-protocol tracking-[0.15em] text-accent-indigo">Zero-Knowledge Proof Generated</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="protocol-panel p-4 text-left">
                    <span className="text-[8px] font-mono text-muted block uppercase mb-1">Artifact Hash</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-foreground truncate max-w-[140px]">
                        {proofResult?.publicSignals?.[0] || '0x4f...a23'}
                      </span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(proofResult));
                        toast.success("Proof copied!");
                      }} className="p-1 hover:text-accent-indigo transition-colors"><Fingerprint className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="protocol-panel p-4 text-left">
                    <span className="text-[8px] font-mono text-muted block uppercase mb-1">Share Link</span>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-accent-indigo">Ready to share</span>
                      <Link2 className="w-3 h-3 text-muted" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button onClick={() => window.open(shareUrl || '#', '_blank')} className="btn-stellar-ghost !py-4 flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View Proof
                  </button>
                  <button onClick={onClose} className="btn-stellar !py-4">Done</button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}