'use client';
import { useState } from 'react';
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert,
  Copy, Check, Fingerprint, Clock, Building2
} from 'lucide-react';

interface Credential {
  id: string;
  credential_type: string;
  issuer: { name: string; logo_url: string; verified: boolean };
  issued_at: string;
  expires_at: string;
  revoked: boolean;
  expired: boolean;
  nft_token_id: string;
  valid: boolean;
}

interface CredentialCardProps {
  credential: Credential;
  onGenerateProof: (credential: Credential) => void;
}

const typeIcons: Record<string, string> = {
  age_verification: '🎂',
  github_developer: '💻',
  income_check: '💰',
  student: '🎓',
  us_resident: '🏠',
  accredited_investor: '📊',
};

const typeLabels: Record<string, string> = {
  age_verification: 'Age Verification',
  github_developer: 'GitHub Developer',
  income_check: 'Income Verification',
  income_100k: 'Income ($100k+)',
  income_200k: 'Income ($200k+)',
  student: 'Student Status',
  alumni: 'Alumni Status',
  us_resident: 'US Residency',
  accredited_investor: 'Accredited Investor',
  age_18: 'Age (18+)',
  age_21: 'Age (21+)',
};

export default function CredentialCard({ credential, onGenerateProof }: CredentialCardProps) {
  const [copied, setCopied] = useState(false);

  const copyTokenId = () => {
    navigator.clipboard.writeText(credential.nft_token_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = () => {
    if (credential.revoked) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full
                         bg-red-500/15 text-red-400 text-xs font-medium">
          <ShieldX className="w-3 h-3" /> Revoked
        </span>
      );
    }
    if (credential.expired) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full
                         bg-gray-500/15 text-gray-400 text-xs font-medium">
          <ShieldAlert className="w-3 h-3" /> Expired
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full
                       bg-emerald-500/15 text-emerald-400 text-xs font-medium">
        <ShieldCheck className="w-3 h-3" /> Valid
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="group relative rounded-2xl glass border border-white/10
                    hover:border-[#67e2a6]/35 transition-all duration-500
                    hover:shadow-lg hover:shadow-[#1fce8b]/15 overflow-hidden">
      {/* Top gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r
        ${credential.valid ? 'from-emerald-500 to-teal-500' :
          credential.revoked ? 'from-red-500 to-orange-500' :
          'from-gray-500 to-gray-600'}`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1fce8b]/25
                            to-[#ff9a5d]/20 flex items-center justify-center text-lg">
              {typeIcons[credential.credential_type] || '🔐'}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {typeLabels[credential.credential_type] || credential.credential_type}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3 h-3 text-white/40" />
                <span className="text-xs text-white/50">{credential.issuer.name}</span>
                {credential.issuer.verified && (
                  <ShieldCheck className="w-3 h-3 text-[#8bf3bf]" />
                )}
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs text-white/50 mb-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Issued
            </span>
            <span className="text-white/70">{formatDate(credential.issued_at)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Expires
            </span>
            <span className="text-white/70">{formatDate(credential.expires_at)}</span>
          </div>
          {credential.nft_token_id && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3 h-3" /> NFT ID
              </span>
              <button
                onClick={copyTokenId}
                className="flex items-center gap-1 text-white/70 hover:text-white
                           transition-colors font-mono"
              >
                {credential.nft_token_id.substring(0, 12)}...
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Generate Proof Button */}
        {credential.valid && (
          <button
            onClick={() => onGenerateProof(credential)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#ff5a1f]
                       to-[#ff7b46] hover:from-[#ff6f3d] hover:to-[#ff9a5d]
                       text-white text-sm font-medium transition-all duration-300
                       hover:shadow-md hover:shadow-[#ff5a1f]/25 active:scale-[0.98]
                       flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Generate ZK Proof
          </button>
        )}
      </div>
    </div>
  );
}
