'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { issuersApi, adminApi } from '../../lib/api';
import VerificationBadge from './VerificationBadge';
import { 
  Globe, Shield, Mail, Award, CheckCircle2, AlertCircle, Copy, Check, 
  ArrowRight, Users, Loader2, Sparkles, TrendingUp, RefreshCw, Star, Trash2
} from 'lucide-react';

interface IssuerVerificationPanelProps {
  issuer: any;
  onRefresh: () => void;
}

export default function IssuerVerificationPanel({ issuer, onRefresh }: IssuerVerificationPanelProps) {
  const [domainInput, setDomainInput] = useState(issuer.domain || '');
  const [emailInput, setEmailInput] = useState('');
  const [emailTokenInput, setEmailTokenInput] = useState('');
  const [dnsToken, setDnsToken] = useState(issuer.domain_verification_token || '');
  
  const [copied, setCopied] = useState(false);
  const [allIssuers, setAllIssuers] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<any[]>([]);
  
  // Loading states
  const [dnsLoading, setDnsLoading] = useState(false);
  const [dnsVerifyLoading, setDnsVerifyLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);
  const [endorseLoading, setEndorseLoading] = useState<string | null>(null);
  
  // Messages
  const [dnsMessage, setDnsMessage] = useState('');
  const [dnsError, setDnsError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  // Admin Simulator state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Check if simulated admin / dev mode
  useEffect(() => {
    setIsAdmin(process.env.NODE_ENV !== 'production');
    fetchEndorsements();
    fetchAllIssuers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issuer.id]);

  const fetchEndorsements = async () => {
    try {
      const res = await issuersApi.getEndorsements(issuer.id);
      setEndorsements(res.data);
    } catch (err) {
      console.error('Failed to fetch endorsements:', err);
    }
  };

  const fetchAllIssuers = async () => {
    try {
      const res = await issuersApi.getAll();
      // Exclude self from list
      setAllIssuers(res.data.filter((i: any) => i.id !== issuer.id));
    } catch (err) {
      console.error('Failed to fetch all issuers:', err);
    }
  };

  const handleRequestDNS = async () => {
    if (!domainInput) return;
    setDnsLoading(true);
    setDnsError('');
    setDnsMessage('');
    try {
      const res = await issuersApi.requestDomainVerification(issuer.id, domainInput);
      setDnsToken(res.data.verificationToken);
      setDnsMessage(`Verification token generated! Add the TXT record to verify ownership.`);
      onRefresh();
    } catch (err: any) {
      setDnsError(err.response?.data?.error || 'Failed to request domain verification.');
    } finally {
      setDnsLoading(false);
    }
  };

  const handleVerifyDNS = async () => {
    setDnsVerifyLoading(true);
    setDnsError('');
    setDnsMessage('');
    try {
      const res = await issuersApi.confirmDomainVerification(issuer.id);
      setDnsMessage(res.data.message);
      onRefresh();
    } catch (err: any) {
      setDnsError(err.response?.data?.error || 'DNS check failed. Please ensure the record has propagated.');
    } finally {
      setDnsVerifyLoading(false);
    }
  };

  const handleRequestEmail = async () => {
    // Generate fallback email based on domain if not input
    const finalEmail = emailInput || `admin@${issuer.domain || domainInput}`;
    setEmailLoading(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const res = await issuersApi.requestEmailVerification(issuer.id, finalEmail);
      setEmailMessage(res.data.message);
    } catch (err: any) {
      setEmailError(err.response?.data?.error || 'Failed to send verification email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailTokenInput) return;
    setEmailVerifyLoading(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const res = await issuersApi.confirmEmailVerification(issuer.id, emailTokenInput);
      setEmailMessage(res.data.message);
      onRefresh();
    } catch (err: any) {
      setEmailError(err.response?.data?.error || 'Invalid verification token.');
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const handleEndorse = async (targetId: string) => {
    setEndorseLoading(targetId);
    try {
      await issuersApi.endorse(targetId);
      fetchAllIssuers();
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Endorsement failed.');
    } finally {
      setEndorseLoading(null);
    }
  };

  // Admin simulation overrides
  const handleAdminVerify = async () => {
    setAdminLoading(true);
    try {
      await adminApi.verifyOfficial(issuer.id);
      alert('Issuer officially verified by admin override!');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Admin override failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminRevoke = async () => {
    if (!revokeReason) {
      alert('Please specify a reason for revocation.');
      return;
    }
    setAdminLoading(true);
    try {
      await adminApi.revokeVerification(issuer.id, revokeReason);
      alert('Verification revoked.');
      setRevokeReason('');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Revocation failed.');
    } finally {
      setAdminLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dnsToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercentage = Math.min((issuer.endorsement_count || 0) / 5 * 100, 100);

  return (
    <div className="space-y-8">
      {/* --- PROFILE HEADER CARD --- */}
      <div className="protocol-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 flex gap-2">
          <VerificationBadge status={issuer.verification_status} size="md" showText />
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-4xl overflow-hidden font-bold">
            {issuer.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={issuer.logo_url} alt={issuer.name} className="w-full h-full object-cover" />
            ) : (
              issuer.name.charAt(0)
            )}
          </div>
          <div className="space-y-2 max-w-xl">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {issuer.name}
            </h1>
            <p className="text-sm text-muted leading-relaxed">{issuer.description || 'No description provided.'}</p>
            {issuer.domain && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
                <Globe className="w-3.5 h-3.5" />
                <span>{issuer.domain}</span>
                {issuer.domain_verified ? (
                  <span className="text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">Verified Domain</span>
                ) : (
                  <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">Pending Verification</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MAIN COLUMNS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Verification Controls (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Domain DNS Verification Section */}
          <div className="protocol-panel p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-base">DNS Domain Verification</h3>
                <p className="text-xs text-muted">Verify your domain to get an Official Verified Gold checkmark badge.</p>
              </div>
            </div>

            {dnsMessage && (
              <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-400">
                {dnsMessage}
              </div>
            )}
            {dnsError && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                {dnsError}
              </div>
            )}

            {!issuer.domain_verified ? (
              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. mit.edu"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    disabled={!!dnsToken}
                    className="flex-grow bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all disabled:opacity-50"
                  />
                  {!dnsToken ? (
                    <button
                      onClick={handleRequestDNS}
                      disabled={dnsLoading || !domainInput}
                      className="btn-stellar !py-2.5 !px-5"
                    >
                      {dnsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get DNS Token'}
                    </button>
                  ) : (
                    <button
                      onClick={() => { setDnsToken(''); setDnsMessage(''); setDnsError(''); }}
                      className="btn-stellar-ghost !py-2.5 !px-5"
                    >
                      Change Domain
                    </button>
                  )}
                </div>

                {dnsToken && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">1. Create a DNS TXT Record</span>
                      <p className="text-xs text-zinc-400">Type: <code className="bg-white/5 px-1.5 py-0.5 rounded text-white font-mono">TXT</code></p>
                      <p className="text-xs text-zinc-400">Host/Name: <code className="bg-white/5 px-1.5 py-0.5 rounded text-white font-mono">@</code> or your subdomain</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">2. Value / Content</span>
                      <div className="flex gap-2 items-center bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2">
                        <span className="text-xs font-mono text-indigo-300 select-all truncate flex-grow">{dnsToken}</span>
                        <button
                          onClick={copyToClipboard}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-muted hover:text-white transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleVerifyDNS}
                        disabled={dnsVerifyLoading}
                        className="btn-stellar flex items-center gap-2"
                      >
                        {dnsVerifyLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Checking DNS...
                          </>
                        ) : (
                          <>
                            Verify DNS Record <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-green-500/10 bg-green-500/5 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Verified Domain</h4>
                  <p className="text-xs text-muted mt-1">Your domain <span className="font-mono text-indigo-300">{issuer.domain}</span> has been authenticated successfully.</p>
                </div>
              </div>
            )}
          </div>

          {/* Fallback Email Verification Section */}
          {!issuer.domain_verified && (
            <div className="protocol-panel p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base">Fallback Email Verification</h3>
                  <p className="text-xs text-muted">Don&apos;t have DNS access? Send a verification email to your official domain email address.</p>
                </div>
              </div>

              {emailMessage && (
                <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-400">
                  {emailMessage}
                </div>
              )}
              {emailError && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                  {emailError}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="email"
                    placeholder={`e.g. admin@${issuer.domain || 'domain.com'}`}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-grow bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                  <button
                    onClick={handleRequestEmail}
                    disabled={emailLoading || !issuer.domain}
                    className="btn-stellar-ghost !py-2.5 !px-5"
                  >
                    {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Email'}
                  </button>
                </div>
                {!issuer.domain && (
                  <p className="text-[10px] text-yellow-500/80">⚠️ Claim a domain first in the DNS section above before sending the email.</p>
                )}

                <div className="flex gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Enter verification code / token"
                    value={emailTokenInput}
                    onChange={(e) => setEmailTokenInput(e.target.value)}
                    className="flex-grow bg-white/[0.03] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                  <button
                    onClick={handleVerifyEmail}
                    disabled={emailVerifyLoading || !emailTokenInput}
                    className="btn-stellar !py-2.5 !px-6"
                  >
                    {emailVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Endorse Other Issuers Portal */}
          <div className="protocol-panel p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-base">Verify Peer Issuers</h3>
                <p className="text-xs text-muted">Show trust by endorsing other active issuers. Note: You must be verified yourself to endorse peers.</p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {allIssuers.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">No other issuers registered on the network.</div>
              ) : (
                allIssuers.map((other) => (
                  <div key={other.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center font-bold text-xs">
                        {other.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-1.5">
                          {other.name}
                          <VerificationBadge status={other.verification_status} />
                        </h4>
                        <p className="text-[10px] text-muted">{other.domain || 'no domain'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEndorse(other.id)}
                      disabled={endorseLoading === other.id || issuer.verification_status === 'unverified'}
                      className="btn-stellar-ghost !py-1.5 !px-3.5 !text-[10px] flex items-center gap-1.5"
                    >
                      {endorseLoading === other.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Endorse
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reputation Stats & Endorsements Received (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Peer Endorsements Received Tracker */}
          <div className="protocol-panel p-6 space-y-5">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Endorsements Received
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <span className="text-muted">Goal to Community Verified</span>
                <span className="text-indigo-400 font-bold">{issuer.endorsement_count || 0} / 5</span>
              </div>
              <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden border border-white/[0.06]">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${progressPercentage}%` }} 
                />
              </div>
              {issuer.verification_status === 'unverified' && (
                <p className="text-[10px] text-muted italic">Reach 5 endorsements from verified issuers to upgrade to Community Verified.</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">Endorsers List</span>
              {endorsements.length === 0 ? (
                <p className="text-xs text-muted italic">No endorsements received yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {endorsements.map((e: any) => (
                    <div key={e.id} className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl">
                      <div className="w-6 h-6 rounded-md bg-white/[0.03] flex items-center justify-center font-bold text-[10px]">
                        {e.name.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <span className="text-xs font-bold text-foreground block">{e.name}</span>
                        <span className="text-[9px] text-muted font-mono">{e.domain || 'No domain'}</span>
                      </div>
                      <VerificationBadge status={e.verification_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trust Score Card */}
          <div className="protocol-panel p-6 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Reputation Metrics
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-center">
                <span className="text-[9px] font-mono text-muted uppercase tracking-wider block mb-1">Trust Score</span>
                <span className="text-2xl font-bold text-indigo-400">92%</span>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl text-center">
                <span className="text-[9px] font-mono text-muted uppercase tracking-wider block mb-1">Endorsements</span>
                <span className="text-2xl font-bold text-foreground">{issuer.endorsement_count || 0}</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-muted font-mono pt-2">
              <div className="flex justify-between">
                <span>DNS Verified:</span>
                <span className={issuer.domain_verified ? 'text-green-400' : 'text-yellow-500'}>
                  {issuer.domain_verified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Domain:</span>
                <span className="text-foreground">{issuer.domain || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="text-foreground truncate w-24 text-right">{issuer.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Admin Override controls (Simulator for testing & evaluation) */}
          {isAdmin && (
            <div className="p-6 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Admin Simulator</h3>
              </div>
              
              <p className="text-[10px] text-muted leading-relaxed">Directly verify or revoke this issuer&apos;s verification tier status using admin simulated controls.</p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleAdminVerify}
                  disabled={adminLoading}
                  className="w-full btn-stellar !py-2 !text-[10px] flex items-center justify-center gap-1.5"
                >
                  {adminLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Force Official Verify'}
                </button>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for revocation"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-red-500/40 rounded-xl px-3 py-2 text-[10px] outline-none transition-all"
                  />
                  <button
                    onClick={handleAdminRevoke}
                    disabled={adminLoading || !revokeReason}
                    className="w-full py-2 rounded-xl border border-red-500/20 bg-red-500/5 text-[10px] font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-1.5"
                  >
                    {adminLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Force Revoke Verification'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
