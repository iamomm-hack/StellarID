'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { issuersApi } from '../../lib/api';
import { Shield, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface BecomeIssuerFormProps {
  onSuccess: (newIssuer: any) => void;
}

export default function BecomeIssuerForm({ onSuccess }: BecomeIssuerFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [credTypes, setCredTypes] = useState<string[]>(['age_verification']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableTypes = [
    { value: 'age_verification', label: 'Age Verification' },
    { value: 'github_developer', label: 'Developer Identity' },
    { value: 'linkedin_professional', label: 'Professional Credential' },
    { value: 'income_check', label: 'Financial Proof' },
    { value: 'student', label: 'Education Verify' },
    { value: 'us_resident', label: 'Residency Node' },
    { value: 'accredited_investor', label: 'Investor Seal' },
    { value: 'stellar_hackathon_winner', label: 'Stellar Hackathon Winner' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Issuer Name is required');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await issuersApi.register({
        name,
        description,
        domain: domain || undefined,
        logo_url: logoUrl || undefined,
        credential_types: credTypes
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess(response.data);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to register issuer profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCredType = (val: string) => {
    if (credTypes.includes(val)) {
      setCredTypes(credTypes.filter(t => t !== val));
    } else {
      setCredTypes([...credTypes, val]);
    }
  };

  if (success) {
    return (
      <div className="protocol-panel p-10 text-center flex flex-col items-center justify-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Issuer Profile Created!</h3>
          <p className="text-sm text-muted">Redirecting you to the verification control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="protocol-panel p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Register as an Issuer</h2>
          <p className="text-xs text-muted">Create your profile to start issuing digital credentials.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[11px] font-mono text-muted uppercase tracking-wider block">Issuer Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. MIT, GitHub Inc."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-mono text-muted uppercase tracking-wider block">Website Domain (Optional)</label>
          <input
            type="text"
            placeholder="e.g. mit.edu, github.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-mono text-muted uppercase tracking-wider block">Description</label>
        <textarea
          placeholder="Describe your organization and the credentials you verify..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-mono text-muted uppercase tracking-wider block">Logo URL (Optional)</label>
        <input
          type="url"
          placeholder="https://example.com/logo.png"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
        />
      </div>

      <div className="space-y-3">
        <label className="text-[11px] font-mono text-muted uppercase tracking-wider block">Supported Credential Types</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {availableTypes.map((type) => {
            const selected = credTypes.includes(type.value);
            return (
              <button
                type="button"
                key={type.value}
                onClick={() => toggleCredType(type.value)}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  selected 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' 
                    : 'bg-white/[0.02] border-white/[0.06] text-muted hover:border-white/[0.12]'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-stellar flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Registering...
            </>
          ) : (
            <>
              Register Profile <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
