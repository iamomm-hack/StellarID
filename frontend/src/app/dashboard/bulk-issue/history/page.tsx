'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWalletStore } from '../../../../store/walletStore';
import api from '../../../../lib/api';
import {
  History, ArrowLeft, Loader2, AlertTriangle, RefreshCw,
  Download, Eye, EyeOff, Calendar, Award, CheckCircle2,
  XCircle, Play, ChevronRight, Inbox, Copy, ExternalLink
} from 'lucide-react';

interface BulkJob {
  id: string;
  issuer_id: string;
  job_name: string;
  credential_template: any;
  total_recipients: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  status: string;
  csv_ipfs_hash: string | null;
  error_log: Array<{ email: string; reason: string }>;
  created_at: string;
  completed_at: string | null;
}

export default function BulkIssueHistoryPage() {
  const { address, isConnected } = useWalletStore();
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIssuer, setIsCheckingIssuer] = useState(true);
  const [isNotIssuer, setIsNotIssuer] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [retryingJobIds, setRetryingJobIds] = useState<Record<string, boolean>>({});
  const [recipients, setRecipients] = useState<Record<string, any[]>>({});
  const [loadingRecipients, setLoadingRecipients] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchRecipients = async (jobId: string) => {
    if (recipients[jobId] || loadingRecipients[jobId]) return;
    try {
      setLoadingRecipients((prev) => ({ ...prev, [jobId]: true }));
      const res = await api.get(`/bulk/jobs/${jobId}/recipients`);
      setRecipients((prev) => ({ ...prev, [jobId]: res.data.recipients }));
    } catch (err) {
      console.error('Error fetching recipients:', err);
    } finally {
      setLoadingRecipients((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  useEffect(() => {
    if (expandedJobId) {
      fetchRecipients(expandedJobId);
    }
  }, [expandedJobId]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Authenticate organizer role
  useEffect(() => {
    async function checkIssuerStatus() {
      if (!address || !isConnected) return;
      try {
        setIsCheckingIssuer(true);
        const res = await api.get('/issuers');
        const userIssuer = res.data.find(
          (i: any) => i.stellar_address?.toLowerCase() === address.toLowerCase()
        );
        if (userIssuer) {
          setIsNotIssuer(false);
        } else {
          setIsNotIssuer(true);
        }
      } catch (err) {
        console.error('Error fetching issuers:', err);
        setIsNotIssuer(true);
      } finally {
        setIsCheckingIssuer(false);
      }
    }
    checkIssuerStatus();
  }, [address, isConnected]);

  // Fetch jobs list
  const fetchJobs = async () => {
    if (isNotIssuer) return;
    try {
      setIsLoading(true);
      const res = await api.get(`/bulk/jobs?page=${page}&limit=10`);
      setJobs(res.data.jobs);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching bulk jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingIssuer && !isNotIssuer) {
      fetchJobs();
    }
  }, [isCheckingIssuer, isNotIssuer, page]);

  const handleRetryFailed = async (jobId: string) => {
    try {
      setRetryingJobIds((prev) => ({ ...prev, [jobId]: true }));
      await api.post(`/bulk/jobs/${jobId}/retry-failed`);
      alert('Failed recipients have been successfully re-queued for processing!');
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to retry job.');
    } finally {
      setRetryingJobIds((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25';
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/25';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border-red-500/25';
      default:
        return 'bg-gray-500/10 text-gray-400 border-white/10';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-white">
        <div className="protocol-panel max-w-md w-full p-10 text-center border border-white/10 rounded-2xl bg-gray-900">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Wallet Disconnected</h1>
          <p className="text-sm text-gray-400 mb-6">Please connect your Stellar wallet to view history.</p>
          <Link href="/dashboard" className="btn-stellar py-2.5 px-6 inline-block rounded-xl bg-violet-600 text-sm">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (isCheckingIssuer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-xs font-mono tracking-widest text-gray-500">VERIFYING ORGANIZER AUTHORITY...</p>
        </div>
      </div>
    );
  }

  if (isNotIssuer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-white">
        <div className="protocol-panel max-w-md w-full p-10 text-center border border-white/10 rounded-2xl bg-gray-900">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-sm text-gray-400 mb-6">You must be registered as an Authorized Issuer to access history.</p>
          <Link href="/dashboard" className="btn-stellar py-2.5 px-6 inline-block rounded-xl bg-violet-600 text-sm">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="w-8 h-8 text-violet-500" />
              Bulk Issuance History
            </h1>
            <p className="text-xs text-gray-400 mt-1">Audit trail and batch controls for organizers</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/bulk-issue"
              className="flex items-center gap-1.5 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition text-xs font-mono text-gray-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Uploader
            </Link>
          </div>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="protocol-panel p-16 text-center border border-white/10 rounded-2xl bg-gray-900 flex flex-col items-center">
            <Inbox className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-bold mb-1">No Jobs Found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              You haven't created any bulk issuance jobs yet. Use the uploader to get started.
            </p>
            <Link
              href="/dashboard/bulk-issue"
              className="btn-stellar py-2 px-5 rounded-xl bg-violet-600 text-xs font-bold"
            >
              Start New Issuance
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const template = job.credential_template || {};
              const progressPercentage = Math.round((job.processed_count / job.total_recipients) * 100) || 0;

              return (
                <div
                  key={job.id}
                  className="protocol-panel border border-white/10 rounded-2xl bg-gray-900 overflow-hidden transition hover:border-white/20"
                >
                  {/* Job Primary Row */}
                  <div
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {job.job_name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                        <span>Type: {template.credentialType || 'stellar_hackathon_winner'}</span>
                        <span>Total: {job.total_recipients}</span>
                      </div>
                    </div>

                    {/* Compact progress / counts */}
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <span className="block text-[10px] font-mono text-gray-500">PROCESSED / SUCCESS / FAILED</span>
                        <div className="mt-1 flex items-center gap-1.5 font-mono text-sm font-bold justify-end">
                          <span className="text-white">{job.processed_count}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-green-400">{job.success_count}</span>
                          <span className="text-gray-600">/</span>
                          <span className="text-red-500">{job.failed_count}</span>
                        </div>
                      </div>

                      <div className="p-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition text-gray-400">
                        <ChevronRight className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-gray-950/40 p-5 space-y-6">
                      {/* Progress Bar in Details */}
                      {job.status === 'processing' && (
                        <div className="space-y-1 bg-gray-950 p-4 border border-white/5 rounded-xl">
                          <div className="flex justify-between text-xs font-mono text-gray-400">
                            <span>PROGRESS: {progressPercentage}%</span>
                            <span>{job.processed_count} / {job.total_recipients} processed</span>
                          </div>
                          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-white/5">
                            <div
                              style={{ width: `${progressPercentage}%` }}
                              className="h-full bg-violet-600 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side: Template Info */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Credential Template Details</h4>
                          <div className="bg-gray-950 p-4 border border-white/5 rounded-xl space-y-2 text-xs">
                            <div>
                              <span className="text-gray-500 block">Description:</span>
                              <p className="text-gray-300 mt-0.5">{template.credentialData?.description || 'No description provided.'}</p>
                            </div>
                            {template.expiresAt && (
                              <div>
                                <span className="text-gray-500">Expires At:</span>
                                <span className="text-gray-300 ml-1.5 font-mono">{new Date(template.expiresAt).toLocaleDateString()}</span>
                              </div>
                            )}
                            {job.csv_ipfs_hash && (
                              <div>
                                <span className="text-gray-500">CSV IPFS Audit Hash:</span>
                                <span className="text-violet-400 font-mono ml-1.5 truncate block max-w-xs">{job.csv_ipfs_hash}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Execution Metrics */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Execution Summary</h4>
                          <div className="bg-gray-950 p-4 border border-white/5 rounded-xl space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <span className="font-bold text-white uppercase">{job.status}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Succeeded:</span>
                              <span className="font-bold text-green-400">{job.success_count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Failed:</span>
                              <span className="font-bold text-red-500">{job.failed_count}</span>
                            </div>
                            {job.completed_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Completed:</span>
                                <span className="text-gray-300 font-mono">{new Date(job.completed_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error Log Panel */}
                      {job.failed_count > 0 && job.error_log && job.error_log.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">Error Details</h4>
                          <div className="border border-red-500/20 bg-red-950/5 rounded-xl overflow-hidden text-xs">
                            <div className="divide-y divide-red-950/20 max-h-40 overflow-y-auto">
                              {job.error_log.map((log, i) => (
                                <div key={i} className="p-3 flex justify-between gap-4">
                                  <span className="font-semibold text-gray-300">{log.email}</span>
                                  <span className="text-red-400 text-right">{log.reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Batch Recipients List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Batch Recipients & Claim Control</h4>
                        {loadingRecipients[job.id] ? (
                          <div className="flex items-center gap-2 py-4 justify-center text-xs font-mono text-gray-500 bg-gray-950/60 rounded-xl border border-white/5">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                            LOADING RECIPIENTS...
                          </div>
                        ) : recipients[job.id]?.length > 0 ? (
                          <div className="border border-white/5 bg-gray-950 rounded-xl overflow-hidden text-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-white/5 bg-white/5 text-[10px] font-mono text-gray-400 uppercase">
                                    <th className="p-3">Recipient</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Action / Info</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  {recipients[job.id].map((rec) => {
                                    const claimUrl = rec.claim_token
                                      ? `${window.location.origin}/claim/${rec.claim_token}`
                                      : null;
                                    return (
                                      <tr key={rec.id} className="hover:bg-white/5 transition">
                                        <td className="p-3">
                                          <div className="font-semibold text-gray-200">{rec.recipient_email}</div>
                                          {rec.recipient_wallet && (
                                            <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{rec.recipient_wallet}</div>
                                          )}
                                        </td>
                                        <td className="p-3">
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            rec.status === 'sent'
                                              ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                                              : rec.status === 'failed'
                                              ? 'bg-red-500/10 text-red-500 border border-red-500/25'
                                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25'
                                          }`}>
                                            {rec.status === 'sent' ? 'Succeeded' : rec.status}
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {claimUrl ? (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  navigator.clipboard.writeText(claimUrl);
                                                  setCopiedToken(rec.claim_token);
                                                  setTimeout(() => setCopiedToken(null), 2000);
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold transition"
                                              >
                                                <Copy className="w-3 h-3" />
                                                {copiedToken === rec.claim_token ? 'Copied!' : 'Copy Link'}
                                              </button>
                                              <a
                                                href={claimUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 text-gray-400 hover:text-white transition flex items-center justify-center border border-white/5 rounded hover:bg-white/5"
                                                title="Open Claim Page"
                                              >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                              </a>
                                              {rec.error_message && (
                                                <span className="text-[10px] text-yellow-500 font-sans" title={rec.error_message}>
                                                  ⚠️ Sandbox Mode
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-red-400 text-[10px] block max-w-[200px] whitespace-normal break-words">
                                              {rec.error_message || 'N/A'}
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs text-gray-500 bg-gray-950/60 rounded-xl border border-white/5">
                            No recipients found for this job.
                          </div>
                        )}
                      </div>

                      {/* Controls Footer */}
                      <div className="flex justify-end gap-3 pt-2">
                        {job.failed_count > 0 && (
                          <>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/bulk/jobs/${job.id}/error-report`}
                              className="flex items-center gap-1.5 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-semibold transition"
                              download
                            >
                              <Download className="w-3.5 h-3.5" /> Export Report CSV
                            </a>

                            <button
                              onClick={() => handleRetryFailed(job.id)}
                              disabled={retryingJobIds[job.id]}
                              className="flex items-center gap-1.5 px-4 py-2 border border-violet-500/30 text-violet-400 hover:bg-violet-500/5 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                            >
                              {retryingJobIds[job.id] ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Retrying...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5" /> Retry Failed
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 border border-white/10 rounded-lg text-xs hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
