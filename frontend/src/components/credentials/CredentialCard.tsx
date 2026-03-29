'use client';
import { useState, type ReactNode } from 'react';
import {
  Shield, ShieldCheck, ShieldX, ShieldAlert,
  Copy, Check, Fingerprint, Clock, Building2,
  Cake, Github, Linkedin, Wallet, GraduationCap, Home, BarChart3, KeyRound, Trash2, type LucideIcon
} from 'lucide-react';
import { useDeleteCredential } from '../../hooks/useCredentials';

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

const typeIcons: Record<string, LucideIcon> = {
  age_verification: Cake,
  github_developer: Github,
  linkedin_professional: Linkedin,
  income_check: Wallet,
  student: GraduationCap,
  us_resident: Home,
  accredited_investor: BarChart3,
};

const typeLabels: Record<string, string> = {
  age_verification: 'Age Verification',
  github_developer: 'GitHub Developer',
  linkedin_professional: 'LinkedIn Professional',
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
  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential();

  const copyTokenId = () => {
    navigator.clipboard.writeText(credential.nft_token_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to unlink this ${typeLabels[credential.credential_type] || credential.credential_type} credential?`)) {
      deleteCredential(credential.id);
    }
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00e676]/15
                            to-[#7c3aed]/15 flex items-center justify-center">
              {(() => {
                const IconComp = typeIcons[credential.credential_type] || KeyRound;
                return <IconComp className="w-5 h-5 text-[#00e676]" />;
              })()}
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

        {/* Buttons */}
        <div className="space-y-2">
          {credential.valid && (
            <button
              onClick={() => onGenerateProof(credential)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed]
                         to-[#9333ea] hover:from-[#8b5cf6] hover:to-[#a855f7]
                         text-white text-sm font-medium transition-all duration-300
                         hover:shadow-md hover:shadow-purple-500/25 active:scale-[0.98]
                         flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Generate ZK Proof
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30
                       disabled:bg-red-500/10 disabled:text-white/40
                       text-red-400 text-sm font-medium transition-all
                       flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Unlinking...' : 'Unlink Credential'}
          </button>
        </div>
      </div>
    </div>
  );
}
