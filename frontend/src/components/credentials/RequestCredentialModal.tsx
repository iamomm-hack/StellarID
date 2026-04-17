'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronRight, Loader2 } from 'lucide-react';
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
    if (!selectedIssuer || !selectedType) {
      alert('Please select issuer and credential type');
      return;
    }

    const finalClaimData = { ...claimData };
    if (selectedType.includes('age_') && selectedType !== 'age_verification') {
      finalClaimData.verified_at = finalClaimData.verified_at || new Date().toISOString();
    }
    if (selectedType === 'us_resident' || selectedType === 'accredited_investor') {
      finalClaimData.verified_at = finalClaimData.verified_at || new Date().toISOString();
    }

    requestCredential(
      {
        issuerId: selectedIssuer.id,
        credentialType: selectedType,
        claimData: finalClaimData,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="edge-modal-overlay" onClick={onClose}>
      <div className="edge-modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edge-modal-header">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Request Credential</span>
          </div>
          <button type="button" onClick={onClose} title="Close modal"
                  className="hover:opacity-60 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-[var(--color-bg)] flex items-center gap-2 border-b border-[#222]">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold ${
                step >= s ? 'bg-[var(--color-accent)] text-[var(--color-bg)]' : 'bg-[#222] text-[var(--color-text-muted)]'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`h-[2px] flex-1 ${step > s ? 'bg-[var(--color-accent)]' : 'bg-[#222]'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Issuer */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Select an Issuer
              </label>
              {isLoadingIssuers ? (
                <div className="flex items-center justify-center py-8 text-[var(--color-text-muted)]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Loading issuers...
                </div>
              ) : issuers && issuers.length > 0 ? (
                <div className="space-y-0">
                  {issuers.map((issuer: any) => (
                    <button
                      key={issuer.id}
                      onClick={() => {
                        setSelectedIssuer(issuer);
                        setSelectedType(null);
                        setClaimData({});
                      }}
                      className={`w-full p-4 border border-[#333] transition-all text-left ${
                        selectedIssuer?.id === issuer.id
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                          : 'hover:border-[#555]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white uppercase tracking-wider text-sm">{issuer.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1">{issuer.description}</p>
                        </div>
                        {selectedIssuer?.id === issuer.id && (
                          <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)]">No issuers available</p>
              )}
            </div>
          )}

          {/* Step 2: Select Credential Type */}
          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Select Credential Type
              </label>
              {availableTypes.length > 0 ? (
                <div className="space-y-0">
                  {availableTypes.map((type: string) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setClaimData({});
                      }}
                      className={`w-full p-4 border border-[#333] transition-all text-left ${
                        selectedType === type
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                          : 'hover:border-[#555]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white uppercase tracking-wider text-sm">
                          {CREDENTIAL_TYPE_LABELS[type] || type}
                        </p>
                        {selectedType === type && (
                          <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--color-text-muted)]">No credential types available</p>
              )}
            </div>
          )}

          {/* Step 3: Fill Claim Data */}
          {step === 3 && selectedType && (
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Additional Information
              </label>
              <div className="space-y-4">
                {Object.entries(CLAIM_DATA_PLACEHOLDERS[selectedType] || {}).map(
                  ([key, placeholder]) => (
                    <div key={key}>
                      <label className="block text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-widest font-bold">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <input
                        type={key.includes('count') || key.includes('income') || key.includes('year') ? 'number' : 'text'}
                        placeholder={placeholder}
                        value={claimData[key] || ''}
                        onChange={(e) =>
                          setClaimData({ ...claimData, [key]: e.target.value })
                        }
                        className="edge-input"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--color-bg)] border-t border-[#222] flex gap-0">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 btn-brutal btn-brutal-outline text-sm"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedIssuer) || (step === 2 && !selectedType)
              }
              className="flex-1 btn-brutal btn-brutal-accent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isRequesting}
              className="flex-1 btn-brutal btn-brutal-accent text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequesting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRequesting ? 'Requesting...' : 'Request Credential'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
