'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useWalletStore } from '../../../store/walletStore';
import api, { issuersApi } from '../../../lib/api';
import {
  Upload, FileText, CheckCircle2, XCircle, ArrowRight,
  RefreshCw, Download, Plus, Trash2, HelpCircle, ChevronDown,
  ChevronUp, Loader2, Play, AlertTriangle, ArrowLeft, History
} from 'lucide-react';

type Step = 'upload' | 'progress' | 'summary';

interface PreviewRow {
  email: string;
  wallet_address?: string;
  [key: string]: any;
}

interface CustomField {
  key: string;
  value: string;
}

export default function BulkIssuePage() {
  const { address, isConnected } = useWalletStore();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [issuerId, setIssuerId] = useState<string>('');
  const [issuerName, setIssuerName] = useState<string>('');
  const [issuerStatus, setIssuerStatus] = useState<string>('unverified');
  const [isCheckingIssuer, setIsCheckingIssuer] = useState<boolean>(true);
  const [isNotIssuer, setIsNotIssuer] = useState<boolean>(false);

  // Form Fields
  const [jobName, setJobName] = useState('');
  const [credentialType, setCredentialType] = useState('stellar_hackathon_winner');
  const [credentialDesc, setCredentialDesc] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<PreviewRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [showCsvHelper, setShowCsvHelper] = useState(false);
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Job Progress State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('queued');
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [estRemainingMinutes, setEstRemainingMinutes] = useState(0);
  const [errorLog, setErrorLog] = useState<Array<{ email: string; reason: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Check if current user is an issuer
  useEffect(() => {
    async function checkIssuerStatus() {
      if (!address || !isConnected) return;
      try {
        setIsCheckingIssuer(true);
        const res = await issuersApi.getMe();
        if (res.data) {
          setIssuerId(res.data.id);
          setIssuerName(res.data.name);
          setIssuerStatus(res.data.verification_status);
          setIsNotIssuer(false);
        } else {
          setIsNotIssuer(true);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setIsNotIssuer(true);
        } else {
          console.error('Error fetching issuer profile:', err);
          setIsNotIssuer(true);
        }
      } finally {
        setIsCheckingIssuer(false);
      }
    }
    checkIssuerStatus();
  }, [address, isConnected]);

  // Polling Job Status (Fallback to axios polling for reliability and automated auth headers)
  useEffect(() => {
    if (!activeJobId || currentStep !== 'progress') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/bulk/jobs/${activeJobId}/status`);
        const { status, progress, estimated_remaining_minutes, error_log } = res.data;

        setJobStatus(status);
        setProcessedCount(progress.processed);
        setSuccessCount(progress.success);
        setFailedCount(progress.failed);
        setEstRemainingMinutes(estimated_remaining_minutes);
        if (error_log) setErrorLog(error_log);

        if (status === 'completed' || status === 'failed') {
          clearInterval(pollInterval);
          setCurrentStep('summary');
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [activeJobId, currentStep]);

  // CSV Drag and Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        await processCsvFile(file);
      } else {
        setCsvError('Only CSV files are supported.');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processCsvFile(e.target.files[0]);
    }
  };

  const processCsvFile = async (file: File) => {
    setCsvFile(file);
    setCsvError(null);
    setShowCsvPreview(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV file must contain a header row and at least one recipient row.');
          setCsvRows([]);
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const emailIndex = headers.findIndex((h) => h.toLowerCase() === 'email');

        if (emailIndex === -1) {
          setCsvError('CSV file must contain an "email" column.');
          setCsvRows([]);
          return;
        }

        const parsedRows: PreviewRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (columns.length < headers.length) continue; // Skip incomplete lines

          const rowData: PreviewRow = {
            email: columns[emailIndex],
          };

          headers.forEach((header, idx) => {
            if (idx !== emailIndex) {
              rowData[header] = columns[idx];
            }
          });

          parsedRows.push(rowData);
        }

        if (parsedRows.length > 1000) {
          setCsvError('Maximum of 1000 rows exceeded.');
          setCsvRows([]);
          setCsvFile(null);
          return;
        }

        setCsvRows(parsedRows);
      } catch (err) {
        setCsvError('Failed to parse CSV file. Please verify the format.');
      }
    };
    reader.readAsText(file);
  };

  // Add & Remove Custom Form Fields
  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
  };

  // Issue Credentials Submit
  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || csvRows.length === 0) {
      setCsvError('Please upload a valid CSV file.');
      return;
    }
    if (!jobName.trim()) {
      alert('Please enter a job/batch name.');
      return;
    }

    try {
      setIsSubmitting(true);

      const templateCustomFields: Record<string, string> = {};
      customFields.forEach((field) => {
        if (field.key.trim()) {
          templateCustomFields[field.key.trim()] = field.value;
        }
      });

      const template = {
        credentialType,
        expiresAt: expiresAt || null,
        credentialData: {
          description: credentialDesc,
          ...templateCustomFields,
        },
      };

      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('job_name', jobName);
      formData.append('credential_template', JSON.stringify(template));

      const response = await api.post('/bulk/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setActiveJobId(response.data.job_id);
      setTotalRecipients(response.data.total_recipients);
      setProcessedCount(0);
      setSuccessCount(0);
      setFailedCount(0);
      setJobStatus('queued');
      setCurrentStep('progress');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit bulk issuance job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Retry for Failed
  const handleRetryFailed = async () => {
    if (!activeJobId) return;
    try {
      setIsRetrying(true);
      await api.post(`/bulk/jobs/${activeJobId}/retry-failed`);
      setJobStatus('queued');
      setCurrentStep('progress');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to retry job.');
    } finally {
      setIsRetrying(false);
    }
  };

  // Clean form state to issue another batch
  const handleReset = () => {
    setCsvFile(null);
    setCsvRows([]);
    setJobName('');
    setCredentialDesc('');
    setExpiresAt('');
    setCustomFields([]);
    setActiveJobId(null);
    setErrorLog([]);
    setCurrentStep('upload');
  };

  // Auth/Issuer Safeguards
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-950 text-white">
        <div className="protocol-panel max-w-md w-full p-10 text-center border border-white/10 rounded-2xl bg-gray-900">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Wallet Disconnected</h1>
          <p className="text-sm text-gray-400 mb-6">Please connect your Stellar wallet to view the uploader.</p>
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
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Your Stellar address is not registered as an Authorized Issuer. Only verified hackathon organizers can access bulk issuance.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/dashboard" className="btn-stellar py-2.5 px-6 rounded-xl bg-violet-600 text-sm">
              Return to Control Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="tag-orange bg-violet-900/30 text-violet-400 text-xs px-2.5 py-0.5 rounded-full border border-violet-500/20">
                Issuer: {issuerName}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Bulk Credential Issuance</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/bulk-issue/history"
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition text-xs font-mono text-gray-300"
            >
              <History className="w-3.5 h-3.5" /> History
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 transition text-xs font-mono text-gray-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>

        {/* Stepper UI */}
        <div className="flex justify-between items-center mb-10 bg-gray-900/60 border border-white/5 rounded-2xl p-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 'upload' ? 'bg-violet-600 text-white' : 'bg-violet-950/50 text-violet-400 border border-violet-800/40'
            }`}>1</div>
            <span className={`text-xs md:text-sm font-semibold ${currentStep === 'upload' ? 'text-white' : 'text-gray-500'}`}>Template & CSV</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 'progress' ? 'bg-violet-600 text-white' : 'bg-violet-950/50 text-violet-400 border border-violet-800/40'
            }`}>2</div>
            <span className={`text-xs md:text-sm font-semibold ${currentStep === 'progress' ? 'text-white' : 'text-gray-500'}`}>Live Issuance</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep === 'summary' ? 'bg-violet-600 text-white' : 'bg-violet-950/50 text-violet-400 border border-violet-800/40'
            }`}>3</div>
            <span className={`text-xs md:text-sm font-semibold ${currentStep === 'summary' ? 'text-white' : 'text-gray-500'}`}>Results</span>
          </div>
        </div>

        {/* Dynamic Forms / Stepper Panels */}
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.form
              key="step-upload"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              onSubmit={handleIssueSubmit}
              className="space-y-6"
            >
              {issuerStatus === 'unverified' && (
                <div className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-400 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Issuer Verification Recommended</p>
                    <p className="text-zinc-400 leading-relaxed mt-0.5">
                      Your issuer profile is currently <strong>unverified</strong>. Credentials issued from unverified profiles display a muted status badge, which may reduce recipient trust.
                    </p>
                    <Link href="/dashboard/issuer-verification" className="text-indigo-400 hover:text-indigo-300 font-bold inline-block mt-2">
                      Verify Domain / Request Peer Endorsements &rarr;
                    </Link>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Resend Email Sandbox Mode Notice</p>
                  <p className="text-zinc-400 leading-relaxed mt-0.5">
                    If your Resend account is in sandbox/testing mode, emails will fail to deliver to non-verified addresses. If you are testing locally with arbitrary CSV emails, ensure <code>USE_MOCK_EMAIL=true</code> is set in the backend <code>.env</code> file.
                  </p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="protocol-panel p-6 border border-white/10 rounded-2xl bg-gray-900 space-y-4">
                <h2 className="text-lg font-bold mb-2">1. Define Credential Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-400">BATCH JOB NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Stellar Hackathon 2026 Winners"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      required
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-gray-400">CREDENTIAL TYPE</label>
                    <select
                      value={credentialType}
                      onChange={(e) => setCredentialType(e.target.value)}
                      className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="stellar_hackathon_winner">Stellar Hackathon Winner</option>
                      <option value="hackathon_winner">Hackathon Winner</option>
                      <option value="builder_certification">Builder Certification</option>
                      <option value="merit_badge">Merit Badge</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-400">CREDENTIAL DESCRIPTION</label>
                  <textarea
                    rows={3}
                    placeholder="Provide description of criteria..."
                    value={credentialDesc}
                    onChange={(e) => setCredentialDesc(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-400">EXPIRATION DATE (OPTIONAL)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full max-w-xs bg-gray-950 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500 text-gray-300"
                  />
                </div>
              </div>

              {/* Dynamic Metadata Fields */}
              <div className="protocol-panel p-6 border border-white/10 rounded-2xl bg-gray-900 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">2. Default Credential Metadata</h2>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="flex items-center gap-1 text-xs font-mono text-violet-400 hover:text-violet-300"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Define key-value pairs that apply to all credentials in this batch. (e.g. <code>event: Stellar Meridian</code>).
                  Values can be overridden per-recipient if matching headers are provided in the CSV.
                </p>

                {customFields.length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-white/5 rounded-xl text-gray-600 text-xs font-mono">
                    No custom metadata fields added.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Metadata Key (e.g. rank)"
                          value={field.key}
                          onChange={(e) => updateCustomField(idx, 'key', e.target.value)}
                          className="flex-1 bg-gray-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500"
                        />
                        <input
                          type="text"
                          placeholder="Default Value"
                          value={field.value}
                          onChange={(e) => updateCustomField(idx, 'value', e.target.value)}
                          className="flex-1 bg-gray-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-violet-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomField(idx)}
                          className="p-2 border border-white/10 rounded-xl hover:bg-red-950/20 hover:border-red-500/30 text-gray-500 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CSV Upload drag/drop zone */}
              <div className="protocol-panel p-6 border border-white/10 rounded-2xl bg-gray-900 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">3. Upload Recipients CSV</h2>
                  <button
                    type="button"
                    onClick={() => setShowCsvHelper(!showCsvHelper)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Format Instructions
                    {showCsvHelper ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {showCsvHelper && (
                  <div className="bg-gray-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs font-mono text-gray-400">
                    <p className="text-gray-200 font-bold">CSV Columns Specification:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong className="text-violet-400">email</strong> (Required): Recipient email address</li>
                      <li><strong>wallet_address</strong> (Optional): Target Stellar wallet address</li>
                      <li><strong>[custom headers]</strong>: Dynamically maps to custom metadata fields (e.g. <code>rank</code> or <code>score</code>)</li>
                    </ul>
                    <div className="bg-gray-900/60 p-2.5 rounded-lg mt-2 border border-white/5">
                      <p className="text-gray-300 font-bold mb-1">Example CSV Content:</p>
                      <code>
                        email,wallet_address,name,rank<br />
                        alice@test.com,GABC...,Alice Kumar,1st Place<br />
                        bob@test.com,,Bob Singh,Participant
                      </code>
                    </div>
                  </div>
                )}

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                    dragActive
                      ? 'border-violet-500 bg-violet-950/15 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'border-white/10 hover:border-violet-500/50 hover:bg-white/[0.01]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-4" />
                  <p className="text-sm font-semibold mb-1">
                    {csvFile ? csvFile.name : 'Drag & drop your CSV file here, or browse'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">Accepts .csv up to 1000 rows (Max 5MB)</p>
                  {csvRows.length > 0 && (
                    <span className="inline-block mt-4 text-[10px] font-mono bg-violet-900/30 text-violet-400 px-3 py-1 rounded-full border border-violet-500/20">
                      ✓ {csvRows.length} recipients detected
                    </span>
                  )}
                </div>

                {csvError && (
                  <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl flex items-center gap-3 text-xs text-red-400">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{csvError}</span>
                  </div>
                )}

                {csvRows.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCsvPreview(!showCsvPreview)}
                      className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {showCsvPreview ? 'Hide CSV Preview' : 'Show CSV Preview (First 5 rows)'}
                    </button>

                    {showCsvPreview && (
                      <div className="border border-white/10 rounded-xl overflow-hidden bg-gray-950">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/5 border-bottom border-white/10">
                            <tr>
                              <th className="p-3 font-mono text-gray-400">Email</th>
                              <th className="p-3 font-mono text-gray-400">Wallet Address</th>
                              {Object.keys(csvRows[0])
                                .filter((k) => k !== 'email' && k !== 'wallet_address')
                                .map((key) => (
                                  <th key={key} className="p-3 font-mono text-gray-400">{key}</th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {csvRows.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                <td className="p-3 font-medium">{row.email}</td>
                                <td className="p-3 font-mono text-gray-500 text-[10px] truncate max-w-[120px]">
                                  {row.wallet_address || '—'}
                                </td>
                                {Object.entries(row)
                                  .filter(([k]) => k !== 'email' && k !== 'wallet_address')
                                  .map(([_, v], i) => (
                                    <td key={i} className="p-3 text-gray-400">{v || '—'}</td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={isSubmitting || csvRows.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 border border-violet-500 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing Bulk Batch...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Issue {csvRows.length} Credentials
                  </>
                )}
              </button>
            </motion.form>
          )}

          {currentStep === 'progress' && (
            <motion.div
              key="step-progress"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="protocol-panel p-8 border border-white/10 rounded-2xl bg-gray-900 text-center space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-violet-500/25 bg-violet-950/15 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Issuing Credentials In Background</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">JOB STATUS: <span className="text-violet-400 uppercase">{jobStatus}</span></p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-gray-400">
                    <span>PROGRESS: {Math.round((processedCount / totalRecipients) * 100) || 0}%</span>
                    <span>{processedCount} / {totalRecipients}</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-950 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(processedCount / totalRecipients) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>

                {/* Stats Counters */}
                <div className="grid grid-cols-3 gap-4 bg-gray-950 border border-white/5 rounded-xl p-4">
                  <div className="text-center">
                    <span className="block text-[10px] font-mono text-gray-500">SUCCEEDED</span>
                    <span className="text-xl font-bold text-green-400 mt-1 block">{successCount}</span>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <span className="block text-[10px] font-mono text-gray-500">FAILED</span>
                    <span className="text-xl font-bold text-red-500 mt-1 block">{failedCount}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] font-mono text-gray-500">EST. REMAINING</span>
                    <span className="text-xl font-bold text-violet-400 mt-1 block">
                      {estRemainingMinutes > 0 ? `${estRemainingMinutes}m` : '<1m'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-400 bg-white/[0.02] p-4 rounded-xl border border-white/5 leading-relaxed">
                  Notice: This process runs asynchronously on the background worker. You can safely navigate away from this page;
                  the credentials will continue to issue in the background. We will email you a summary report when completed.
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'summary' && (
            <motion.div
              key="step-summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="protocol-panel p-8 border border-white/10 rounded-2xl bg-gray-900 text-center space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Issuance Batch Completed</h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">JOB ID: {activeJobId}</p>
                  </div>
                </div>

                {/* Final metrics summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 border border-white/5 rounded-xl p-4">
                  <div className="text-center">
                    <span className="block text-[10px] font-mono text-gray-500">TOTAL BATCH</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{totalRecipients}</span>
                  </div>
                  <div className="text-center border-l md:border-l border-white/5">
                    <span className="block text-[10px] font-mono text-gray-500">PROCESSED</span>
                    <span className="text-lg font-bold text-white mt-0.5 block">{processedCount}</span>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <span className="block text-[10px] font-mono text-gray-500">✅ SUCCESS</span>
                    <span className="text-lg font-bold text-green-400 mt-0.5 block">{successCount}</span>
                  </div>
                  <div className="text-center border-l border-white/5">
                    <span className="block text-[10px] font-mono text-gray-500">❌ FAILED</span>
                    <span className="text-lg font-bold text-red-500 mt-0.5 block">{failedCount}</span>
                  </div>
                </div>

                {/* Failed list breakdown */}
                {failedCount > 0 && (
                  <div className="space-y-4 text-left border border-white/10 rounded-2xl overflow-hidden bg-gray-950">
                    <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                        Failed Recipients ({failedCount})
                      </span>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'}/bulk/jobs/${activeJobId}/error-report`}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-mono"
                        download
                      >
                        <Download className="w-3.5 h-3.5" /> Export Report CSV
                      </a>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                      {errorLog.map((log, i) => (
                        <div key={i} className="p-3.5 flex justify-between items-start gap-4 text-xs">
                          <span className="font-semibold text-gray-300">{log.email}</span>
                          <span className="text-red-400 text-right max-w-sm">{log.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stepper control actions */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  {failedCount > 0 && (
                    <button
                      onClick={handleRetryFailed}
                      disabled={isRetrying}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 border border-red-500/40 bg-red-950/20 text-red-400 hover:bg-red-950/40 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Retrying Failed...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" /> Retry All Failed
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Issue Another Batch
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
