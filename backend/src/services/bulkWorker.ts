import { Worker } from 'bullmq';
import { query } from '../db';
import { connectionOptions } from './bulkQueue';
import { sendClaimInvitationEmail, sendBulkSummaryEmail } from './email';

// Helper to delay execution (rate limiting)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Extracted Job Processing Function to allow both BullMQ worker and in-memory fallback
export async function processBulkIssuanceJob(jobId: string): Promise<void> {
  console.log(`🚀 Processing bulk issuance job: ${jobId}`);

  // Update job status to processing
  await query(
    `UPDATE bulk_issuance_jobs 
     SET status = 'processing' 
     WHERE id = $1`,
    [jobId]
  );

  // Fetch the job details
  const jobResult = await query(
    `SELECT j.*, i.name as issuer_name, u.email as issuer_email 
     FROM bulk_issuance_jobs j
     JOIN issuers i ON j.issuer_id = i.id
     JOIN users u ON REGEXP_REPLACE(i.stellar_address, '\\s+', '', 'g') = REGEXP_REPLACE(u.stellar_address, '\\s+', '', 'g')
     WHERE j.id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    throw new Error(`Job ${jobId} not found`);
  }

  const dbJob = jobResult.rows[0];
  const template = dbJob.credential_template;

  // Fetch queued recipients for this job
  const recipientsResult = await query(
    `SELECT * FROM bulk_issuance_recipients 
     WHERE job_id = $1 AND status = 'queued'
     ORDER BY id ASC`,
    [jobId]
  );

  const recipients = recipientsResult.rows;
  console.log(`Found ${recipients.length} queued recipients for job ${jobId}`);

  let processedCount = dbJob.processed_count || 0;
  let successCount = dbJob.success_count || 0;
  let failedCount = dbJob.failed_count || 0;
  const errorLogs: Array<{ email: string; reason: string }> = Array.isArray(dbJob.error_log) ? dbJob.error_log : [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const recipient of recipients) {
    const email = recipient.recipient_email;
    const wallet = recipient.recipient_wallet;
    const custom = recipient.custom_fields || {};

    processedCount++;

    try {
      // 1. Email format check
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // 2. Wallet format check if provided
      if (wallet && !/^G[A-Z2-7]{55}$/.test(wallet)) {
        throw new Error('Invalid Stellar wallet address format');
      }

      // Merge template data with custom overrides
      // Schema requires claim_data inside pending_credentials. Let's merge properly.
      const mergedCredentialData = {
        ...template.credentialData,
        ...custom,
      };

      // Determine expiration
      const expiresAt = template.expiresAt
        ? new Date(template.expiresAt)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // 3. Create pending credential row
      const pendingResult = await query(
        `INSERT INTO pending_credentials (issuer_id, recipient_email, recipient_wallet, credential_type, credential_data, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, claim_token, expires_at`,
        [
          dbJob.issuer_id,
          email.toLowerCase(),
          wallet || null,
          template.credentialType || dbJob.job_name,
          JSON.stringify(mergedCredentialData),
          expiresAt,
        ]
      );

      const pending = pendingResult.rows[0];
      const claimUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/claim/${pending.claim_token}`;

      // 4. Send claim invitation email
      let emailSent = false;
      let emailError: string | null = null;
      try {
        emailSent = await sendClaimInvitationEmail(
          email,
          dbJob.issuer_name,
          template.credentialType || dbJob.job_name,
          claimUrl,
          expiresAt
        );
      } catch (err: any) {
        emailError = err.message;
      }

      if (!emailSent) {
        console.warn(`[Email Service] Failed to send email to ${email}. (Sandbox mode?)`);
        emailError = emailError || 'Resend failed to deliver claim email';
      }

      // 5. Mark recipient as sent (succeeded generation)
      await query(
        `UPDATE bulk_issuance_recipients 
         SET status = 'sent', pending_credential_id = $1, error_message = $2, processed_at = NOW() 
         WHERE id = $3`,
        [pending.id, emailError, recipient.id]
      );

      successCount++;
    } catch (err: any) {
      console.error(`Error processing recipient ${email}:`, err.message);
      failedCount++;
      errorLogs.push({ email, reason: err.message });

      // Update recipient record as failed
      await query(
        `UPDATE bulk_issuance_recipients 
         SET status = 'failed', error_message = $1, processed_at = NOW() 
         WHERE id = $2`,
        [err.message, recipient.id]
      );
    }

    // Update progress in database
    await query(
      `UPDATE bulk_issuance_jobs 
       SET processed_count = $1, success_count = $2, failed_count = $3, error_log = $4 
       WHERE id = $5`,
      [processedCount, successCount, failedCount, JSON.stringify(errorLogs), jobId]
    );

    // Rate limit throttle: max 10 emails/second -> 100ms delay per loop
    await delay(100);
  }

  // Mark job as completed or failed
  const finalStatus = failedCount === dbJob.total_recipients ? 'failed' : 'completed';

  await query(
    `UPDATE bulk_issuance_jobs 
     SET status = $1, completed_at = NOW() 
     WHERE id = $2`,
    [finalStatus, jobId]
  );

  // Send summary email to the organizer
  try {
    const errorReportUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/v1/bulk/jobs/${jobId}/error-report`;
    await sendBulkSummaryEmail(
      dbJob.issuer_email,
      dbJob.job_name,
      successCount,
      failedCount,
      errorReportUrl
    );
  } catch (emailErr: any) {
    console.warn('Failed to send summary email to organizer:', emailErr.message);
  }

  console.log(`✅ Bulk issuance job completed for: ${jobId}. Success: ${successCount}, Failed: ${failedCount}`);
}

// Setup BullMQ worker
export const bulkWorker = new Worker(
  'bulk-issuance',
  async (job) => {
    const { jobId } = job.data;
    await processBulkIssuanceJob(jobId);
  },
  {
    connection: connectionOptions,
    concurrency: parseInt(process.env.BULL_CONCURRENCY || '5'),
  }
);

bulkWorker.on('error', (err) => {
  console.warn('⚠️ BullMQ Worker: Redis connection error (using in-memory fallback):', err.message);
});
