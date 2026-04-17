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
        <span className="badge-revoked">
          <ShieldX className="w-3 h-3" /> Revoked
        </span>
      );
    }
    if (credential.expired) {
      return (
        <span className="badge-expired">
          <ShieldAlert className="w-3 h-3" /> Expired
        </span>
      );
    }
    return (
      <span className="badge-valid">
        <ShieldCheck className="w-3 h-3" /> Valid
      </span>
    );
  };

  const getHeaderStyle = () => {
    if (credential.revoked) return { background: '#ff3c00', color: '#050505' };
    if (credential.expired) return { background: '#888', color: '#050505' };
    return { background: 'var(--color-highlight)', color: 'var(--color-bg)' };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const IconComp = typeIcons[credential.credential_type] || KeyRound;

  return (
    <div className="brutal-card">
      <div className="card-header-brutal" style={getHeaderStyle()}>
        <span>{typeLabels[credential.credential_type] || credential.credential_type}</span>
        <span>[{credential.valid ? 'ACTIVE' : credential.revoked ? 'REVOKED' : 'EXPIRED'}]</span>
      </div>
      <div className="card-body-brutal">
        {/* Icon + Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 flex items-center justify-center border border-[#333]"
               style={{ background: 'var(--color-bg)' }}>
            <IconComp className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
          </div>
          {getStatusBadge()}
        </div>

        {/* Issuer */}
        <div className="flex items-center gap-1.5 mb-4">
          <Building2 className="w-3 h-3 text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)]">{credential.issuer.name}</span>
          {credential.issuer.verified && (
            <ShieldCheck className="w-3 h-3" style={{ color: 'var(--color-highlight)' }} />
          )}
        </div>

        {/* Details - Table style */}
        <table className="edge-table w-full mb-4" style={{ fontSize: '0.8rem' }}>
          <tbody>
            <tr>
              <td className="py-1.5 px-0"><Clock className="w-3 h-3 inline mr-1" />Issued</td>
              <td className="py-1.5 px-0 text-right text-white">{formatDate(credential.issued_at)}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-0"><Clock className="w-3 h-3 inline mr-1" />Expires</td>
              <td className="py-1.5 px-0 text-right text-white">{formatDate(credential.expires_at)}</td>
            </tr>
            {credential.nft_token_id && (
              <tr>
                <td className="py-1.5 px-0"><Fingerprint className="w-3 h-3 inline mr-1" />NFT ID</td>
                <td className="py-1.5 px-0 text-right">
                  <button
                    onClick={copyTokenId}
                    className="text-white hover:text-[var(--color-highlight)] transition-colors font-mono text-xs"
                  >
                    {credential.nft_token_id.substring(0, 12)}...
                    {copied ? (
                      <Check className="w-3 h-3 inline ml-1" style={{ color: 'var(--color-highlight)' }} />
                    ) : (
                      <Copy className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Buttons */}
        <div className="space-y-2">
          {credential.valid && (
            <button
              onClick={() => onGenerateProof(credential)}
              className="w-full btn-brutal btn-brutal-accent flex items-center justify-center gap-2 py-2.5 text-sm"
            >
              <Shield className="w-4 h-4" />
              Generate ZK Proof
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full btn-brutal btn-brutal-outline flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-40"
            style={{ color: 'var(--color-accent)' }}
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Unlinking...' : 'Unlink Credential'}
          </button>
        </div>
      </div>
    </div>
  );
}
