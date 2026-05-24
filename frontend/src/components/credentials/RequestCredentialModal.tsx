'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChevronRight, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { issuersApi } from '../../lib/api';
import { useRequestCredential } from '../../hooks/useCredentials';

interface RequestCredentialModalProps {
  onClose: () => void;
}

const CREDENTIAL_TYPE_LABELS: Record<string, string> = {
  'age_verification': 'Age Verification',
  'age_18': 'Age (18+)',
  'age_21': 'Age (21+)',
  'github_developer': 'GitHub Developer',
  'income_check': 'Income Verification',
  'income_100k': 'Income ($100k+)',
  'income_200k': 'Income ($200k+)',
  'student': 'Student Status',
  'alumni': 'Alumni Status',
  'us_resident': 'US Residency',
  'accredited_investor': 'Accredited Investor',
};

const CLAIM_DATA_PLACEHOLDERS: Record<string, Record<string, string>> = {
  'age_18': { 'verified_at': 'ISO timestamp (auto-filled)' },
  'age_21': { 'verified_at': 'ISO timestamp (auto-filled)' },
  'age_verification': { 'birthdate': 'YYYY-MM-DD' },
  'income_100k': { 'annual_income': '100000 or more' },
  'income_200k': { 'annual_income': '200000 or more' },
  'income_check': { 'annual_income': 'Amount in USD' },
  'github_developer': { 'public_repos_count': 'Number', 'verified_email': 'true/false' },
  'student': { 'institution': 'University name', 'graduation_year': 'YYYY' },
  'alumni': { 'institution': 'University name', 'graduation_year': 'YYYY' },
  'us_resident': { 'verified_at': 'ISO timestamp' },
  'accredited_investor': { 'verified_at': 'ISO timestamp' },
};

export default function RequestCredentialModal({ onClose }: RequestCredentialModalProps) {
  const [step, setStep] = useState(1);
  const [selectedIssuer, setSelectedIssuer] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<Record<string, any>>({});

  const { data: issuers, isLoading: isLoadingIssuers } = useQuery({
    queryKey: ['issuers'],
    queryFn: () => issuersApi.getAll().then((r) => r.data),
  });

  const { mutate: requestCredential, isPending: isRequesting } = useRequestCredential();

  const availableTypes = selectedIssuer?.credential_types || [];

  const handleSubmit = () => {
    if (!selectedIssuer || !selectedType) return;

    const finalClaimData = { ...claimData };
    if (selectedType.includes('age_') && selectedType !== 'age_verification') {
      finalClaimData.verified_at = finalClaimData.verified_at || new Date().toISOString();
    }
    if (selectedType === 'us_resident' || selectedType === 'accredited_investor') {
      finalClaimData.verified_at = finalClaimData.verified_at || new Date().toISOString();
    }

    requestCredential(
      { issuerId: selectedIssuer.id, credentialType: selectedType, claimData: finalClaimData },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="edge-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [.23, 1, .32, 1] }}
        className="protocol-panel max-w-lg w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Plus className="w-4 h-4 text-[#FF6A00]" />
            <span className="text-sm font-bold text-[#f5f5f0]">Request Credential</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/[0.05] rounded-full transition-colors">
            <X className="w-4 h-4 text-[#666660]" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.01]">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                step >= s 
                  ? 'bg-[#FF6A00] text-[#0a0a0a]' 
                  : 'bg-white/[0.04] text-[#666660] border border-white/[0.06]'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`h-[2px] flex-1 rounded-full transition-colors ${step > s ? 'bg-[#FF6A00]' : 'bg-white/[0.06]'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Issuer */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <span className="text-[10px] font-mono text-[#666660] uppercase tracking-wider block">Select Issuer</span>
                {isLoadingIssuers ? (
                  <div className="flex items-center justify-center py-12 text-[#666660]">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
                  </div>
                ) : issuers && issuers.length > 0 ? (
                  <div className="space-y-2">
                    {issuers.map((issuer: any) => (
                      <button
                        key={issuer.id}
                        onClick={() => { setSelectedIssuer(issuer); setSelectedType(null); setClaimData({}); }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedIssuer?.id === issuer.id
                            ? 'border-[#FF6A00]/30 bg-[#FF6A00]/5'
                            : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-[#f5f5f0]">{issuer.name}</p>
                            <p className="text-[11px] text-[#666660] mt-1">{issuer.description}</p>
                          </div>
                          {selectedIssuer?.id === issuer.id && <ChevronRight className="w-4 h-4 text-[#FF6A00]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666660] text-sm py-8 text-center">No issuers available</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Select Type */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <span className="text-[10px] font-mono text-[#666660] uppercase tracking-wider block">Select Credential Type</span>
                {availableTypes.length > 0 ? (
                  <div className="space-y-2">
                    {availableTypes.map((type: string) => (
                      <button
                        key={type}
                        onClick={() => { setSelectedType(type); setClaimData({}); }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          selectedType === type
                            ? 'border-[#FF6A00]/30 bg-[#FF6A00]/5'
                            : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-[#f5f5f0]">{CREDENTIAL_TYPE_LABELS[type] || type}</p>
                          {selectedType === type && <ChevronRight className="w-4 h-4 text-[#FF6A00]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#666660] text-sm py-8 text-center">No credential types available</p>
                )}
              </motion.div>
            )}

            {/* Step 3: Claim Data */}
            {step === 3 && selectedType && (
              <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <span className="text-[10px] font-mono text-[#666660] uppercase tracking-wider block">Additional Information</span>
                <div className="space-y-4">
                  {Object.entries(CLAIM_DATA_PLACEHOLDERS[selectedType] || {}).map(
                    ([key, placeholder]) => (
                      <div key={key}>
                        <label className="block text-[10px] font-mono text-[#666660] mb-2 uppercase tracking-wider">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type={key.includes('count') || key.includes('income') || key.includes('year') ? 'number' : 'text'}
                          placeholder={placeholder}
                          value={claimData[key] || ''}
                          onChange={(e) => setClaimData({ ...claimData, [key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#f5f5f0] text-sm font-mono placeholder:text-[#666660]/50 focus:outline-none focus:border-[#FF6A00]/40 transition-colors"
                        />
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="btn-stellar-ghost flex-1 !py-3">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !selectedIssuer) || (step === 2 && !selectedType)}
              className="btn-stellar flex-1 !py-3 disabled:opacity-30"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isRequesting} className="btn-stellar flex-1 !py-3 disabled:opacity-30">
              {isRequesting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRequesting ? 'Requesting...' : 'Submit Request'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
