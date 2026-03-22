'use client';
import { useState, useEffect } from 'react';
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

    // Auto-fill timestamp fields if not provided
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl glass border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#00e676]" />
            <h2 className="text-lg font-semibold text-white">Request Credential</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close modal"
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-black/20 flex items-center gap-2 text-xs text-white/60">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#00e676] text-black' : 'bg-white/10'}`}>
            1
          </div>
          <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-[#00e676]' : 'bg-white/10'}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#00e676] text-black' : 'bg-white/10'}`}>
            2
          </div>
          <div className={`h-0.5 flex-1 ${step >= 3 ? 'bg-[#00e676]' : 'bg-white/10'}`} />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#00e676] text-black' : 'bg-white/10'}`}>
            3
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select Issuer */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Select an Issuer
                </label>
                {isLoadingIssuers ? (
                  <div className="flex items-center justify-center py-8 text-white/40">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading issuers...
                  </div>
                ) : issuers && issuers.length > 0 ? (
                  <div className="space-y-2">
                    {issuers.map((issuer: any) => (
                      <button
                        key={issuer.id}
                        onClick={() => {
                          setSelectedIssuer(issuer);
                          setSelectedType(null);
                          setClaimData({});
                        }}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                          selectedIssuer?.id === issuer.id
                            ? 'bg-[#00e676]/10 border-[#00e676]/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{issuer.name}</p>
                            <p className="text-xs text-white/50 mt-1">{issuer.description}</p>
                          </div>
                          {selectedIssuer?.id === issuer.id && (
                            <ChevronRight className="w-5 h-5 text-[#00e676]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50">No issuers available</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Credential Type */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Select Credential Type
                </label>
                {availableTypes.length > 0 ? (
                  <div className="space-y-2">
                    {availableTypes.map((type: string) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setClaimData({});
                        }}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                          selectedType === type
                            ? 'bg-[#00e676]/10 border-[#00e676]/50 text-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{CREDENTIAL_TYPE_LABELS[type] || type}</p>
                          {selectedType === type && (
                            <ChevronRight className="w-5 h-5 text-[#00e676]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/50">No credential types available</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Fill Claim Data */}
          {step === 3 && selectedType && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">
                  Additional Information
                </label>
                <div className="space-y-3">
                  {Object.entries(CLAIM_DATA_PLACEHOLDERS[selectedType] || {}).map(
                    ([key, placeholder]) => (
                      <div key={key}>
                        <label className="block text-xs text-white/60 mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <input
                          type={key.includes('count') || key.includes('income') || key.includes('year') ? 'number' : 'text'}
                          placeholder={placeholder}
                          value={claimData[key] || ''}
                          onChange={(e) =>
                            setClaimData({ ...claimData, [key]: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10
                                   text-white placeholder:text-white/30 focus:outline-none
                                   focus:border-[#00e676]/50 focus:bg-white/10 transition-all"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 border-t border-white/10 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15
                       text-white font-medium transition-all"
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
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00e676]
                       to-[#00c853] hover:from-[#00e676] hover:to-[#00e676]
                       text-black font-medium transition-all disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isRequesting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00e676]
                       to-[#00c853] hover:from-[#00e676] hover:to-[#00e676]
                       text-black font-medium transition-all disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
