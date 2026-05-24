import { Router, Response } from 'express';
import multer from 'multer';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { uploadToIPFS } from '../services/ipfs';
import { bulkQueue } from '../services/bulkQueue';
import { processBulkIssuanceJob } from '../services/bulkWorker';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

// Helper to parse CSV buffer using csv-parser
function parseCSV(buffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

// POST /upload — Upload CSV and trigger bulk issuance
router.post(
  '/upload',
  authMiddleware,
  upload.single('csv'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { job_name, credential_template } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No CSV file uploaded' });
        return;
      }

      if (!job_name || !credential_template) {
        res.status(400).json({ error: 'Missing job_name or credential_template' });
        return;
      }

      let parsedTemplate;
      try {
        parsedTemplate = typeof credential_template === 'string'
          ? JSON.parse(credential_template)
          : credential_template;
      } catch (err) {
        res.status(400).json({ error: 'Invalid JSON format for credential_template' });
        return;
      }

      // Check if user is a registered issuer
      const issuerResult = await query(
        "SELECT id, name FROM issuers WHERE REGEXP_REPLACE(stellar_address, '\\s+', '', 'g') = REGEXP_REPLACE($1, '\\s+', '', 'g')",
        [req.user!.stellar_address]
      );

      if (issuerResult.rows.length === 0) {
        res.status(403).json({ error: 'You are not a registered issuer' });
        return;
      }

      const issuer = issuerResult.rows[0];

      // Parse CSV rows
      let rows: any[];
      try {
        rows = await parseCSV(file.buffer);
      } catch (err: any) {
        res.status(400).json({ error: `Failed to parse CSV: ${err.message}` });
        return;
      }

      if (rows.length === 0) {
        res.status(400).json({ error: 'CSV file is empty' });
        return;
      }

      if (rows.length > 1000) {
        res.status(400).json({ error: 'CSV exceeds maximum limit of 1000 rows' });
        return;
      }

      // Validate columns and rows
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validatedRecipients: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // CSV is 1-indexed plus header row

        // Find email key case-insensitively
        const emailKey = Object.keys(row).find((k) => k.toLowerCase() === 'email');
        const email = emailKey ? row[emailKey]?.trim() : undefined;

        if (!email) {
          errors.push(`Row ${rowNum}: Email address is required`);
          continue;
        }

        if (!emailRegex.test(email)) {
          errors.push(`Row ${rowNum}: Invalid email format: "${email}"`);
          continue;
        }

        // Optional columns
        const walletKey = Object.keys(row).find((k) => k.toLowerCase() === 'wallet_address' || k.toLowerCase() === 'wallet');
        const wallet = walletKey ? row[walletKey]?.trim() : undefined;

        if (wallet && !/^G[A-Z2-7]{55}$/.test(wallet)) {
          errors.push(`Row ${rowNum}: Invalid Stellar wallet address format: "${wallet}"`);
          continue;
        }

        // Collect custom fields
        const customFields: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          const lowerKey = key.toLowerCase();
          if (lowerKey !== 'email' && lowerKey !== 'wallet_address' && lowerKey !== 'wallet') {
            customFields[key] = typeof value === 'string' ? value.trim() : value;
          }
        }

        validatedRecipients.push({
          email,
          wallet,
          customFields,
        });
      }

      if (errors.length > 0) {
        res.status(400).json({ error: 'CSV validation failed', details: errors });
        return;
      }

      // Upload CSV to IPFS for record trail
      let ipfsHash = '';
      try {
        ipfsHash = await uploadToIPFS(file.buffer.toString());
      } catch (ipfsErr) {
        console.warn('CSV IPFS upload failed, continuing without IPFS hash');
      }

      // Create Bulk Issuance Job
      const jobInsertResult = await query(
        `INSERT INTO bulk_issuance_jobs (issuer_id, job_name, credential_template, total_recipients, csv_ipfs_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, total_recipients`,
        [
          issuer.id,
          job_name,
          JSON.stringify(parsedTemplate),
          validatedRecipients.length,
          ipfsHash || null,
        ]
      );

      const job = jobInsertResult.rows[0];

      // Batch insert bulk recipients
      for (const recipient of validatedRecipients) {
        await query(
          `INSERT INTO bulk_issuance_recipients (job_id, recipient_email, recipient_wallet, custom_fields)
           VALUES ($1, $2, $3, $4)`,
          [
            job.id,
            recipient.email.toLowerCase(),
            recipient.wallet || null,
            JSON.stringify(recipient.customFields),
          ]
        );
      }

      // Enqueue job to Redis queue (BullMQ) with fallback
      let enqueued = false;
      try {
        await Promise.race([
          bulkQueue.add('process-job', { jobId: job.id }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000))
        ]);
        enqueued = true;
      } catch (err: any) {
        console.warn(`⚠️ BullMQ/Redis enqueue failed (${err.message}). Falling back to in-memory processing...`);
      }

      if (!enqueued) {
        // Run in background without awaiting so we return the HTTP response immediately
        processBulkIssuanceJob(job.id).catch((err) => {
          console.error(`❌ In-memory job processing failed for job ${job.id}:`, err);
        });
      }

      const estimatedMinutes = Math.ceil(validatedRecipients.length / (10 * 60)) + 1; // Rate is 10/sec

      res.status(201).json({
        job_id: job.id,
        total_recipients: job.total_recipients,
        estimated_completion_minutes: estimatedMinutes,
      });
    } catch (err: any) {
      console.error('Bulk upload error:', err.message);
      res.status(500).json({ error: 'Failed to process bulk upload' });
    }
  }
);

// GET /jobs — Paginated list of bulk jobs for authenticated issuer
router.get('/jobs', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Resolve issuer ID
    const issuerResult = await query(
      "SELECT id FROM issuers WHERE REGEXP_REPLACE(stellar_address, '\\s+', '', 'g') = REGEXP_REPLACE($1, '\\s+', '', 'g')",
      [req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(403).json({ error: 'You are not a registered issuer' });
      return;
    }

    const issuerId = issuerResult.rows[0].id;

    // Fetch jobs
    const result = await query(
      `SELECT * FROM bulk_issuance_jobs 
       WHERE issuer_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [issuerId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*)::int as total FROM bulk_issuance_jobs WHERE issuer_id = $1',
      [issuerId]
    );

    res.json({
      jobs: result.rows,
      pagination: {
        total: countResult.rows[0].total,
        page,
        limit,
        pages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (err: any) {
    console.error('Fetch bulk jobs error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bulk jobs' });
  }
});

// GET /jobs/:job_id/status — Fetch progress status & details
router.get('/jobs/:job_id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;

    const result = await query(
      `SELECT * FROM bulk_issuance_jobs WHERE id = $1`,
      [job_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const job = result.rows[0];
    const remaining = job.total_recipients - job.processed_count;
    const estimatedRemainingMinutes = Math.ceil(remaining / (10 * 60)); // 10 emails/sec

    res.json({
      job_id: job.id,
      job_name: job.job_name,
      status: job.status,
      progress: {
        total: job.total_recipients,
        processed: job.processed_count,
        success: job.success_count,
        failed: job.failed_count,
      },
      estimated_remaining_minutes: estimatedRemainingMinutes,
      error_log: job.error_log,
      created_at: job.created_at,
      completed_at: job.completed_at,
    });
  } catch (err: any) {
    console.error('Fetch job status error:', err.message);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// GET /jobs/:job_id/status/live — Real-time progress updates via Server-Sent Events (SSE)
router.get('/jobs/:job_id/status/live', async (req, res) => {
  const { job_id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendProgress = async () => {
    try {
      const result = await query('SELECT * FROM bulk_issuance_jobs WHERE id = $1', [job_id]);
      if (result.rows.length === 0) {
        res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
        clearInterval(intervalId);
        res.end();
        return;
      }

      const job = result.rows[0];
      res.write(`data: ${JSON.stringify(job)}\n\n`);

      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(intervalId);
        res.end();
      }
    } catch (err) {
      clearInterval(intervalId);
      res.end();
    }
  };

  // Run immediately and then poll every 1s
  await sendProgress();
  const intervalId = setInterval(sendProgress, 1000);

  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// POST /jobs/:job_id/retry-failed — Re-queue failed recipients
router.post('/jobs/:job_id/retry-failed', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;

    // Verify job belongs to issuer
    const issuerResult = await query(
      "SELECT id FROM issuers WHERE REGEXP_REPLACE(stellar_address, '\\s+', '', 'g') = REGEXP_REPLACE($1, '\\s+', '', 'g')",
      [req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(403).json({ error: 'You are not a registered issuer' });
      return;
    }

    const issuerId = issuerResult.rows[0].id;

    const jobCheck = await query(
      'SELECT * FROM bulk_issuance_jobs WHERE id = $1 AND issuer_id = $2',
      [job_id, issuerId]
    );

    if (jobCheck.rows.length === 0) {
      res.status(404).json({ error: 'Job not found or access denied' });
      return;
    }

    const job = jobCheck.rows[0];

    if (job.status !== 'completed' && job.status !== 'failed') {
      res.status(400).json({ error: 'Job is not completed yet' });
      return;
    }

    if (job.failed_count === 0) {
      res.status(400).json({ error: 'No failed recipients to retry' });
      return;
    }

    // Set failed recipients to queued
    await query(
      `UPDATE bulk_issuance_recipients 
       SET status = 'queued', error_message = NULL 
       WHERE job_id = $1 AND status = 'failed'`,
      [job_id]
    );

    // Update job counters & status
    const remainingFailed = 0;
    const remainingSuccess = job.success_count;
    const remainingProcessed = job.success_count; // Reset processed count to successes since we retry the failed ones

    await query(
      `UPDATE bulk_issuance_jobs 
       SET status = 'queued', processed_count = $1, failed_count = $2, success_count = $3, completed_at = NULL 
       WHERE id = $4`,
      [remainingProcessed, remainingFailed, remainingSuccess, job_id]
    );

    // Add back to BullMQ queue with fallback
    let enqueued = false;
    try {
      await Promise.race([
        bulkQueue.add('process-job', { jobId: job_id }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 2000))
      ]);
      enqueued = true;
    } catch (err: any) {
      console.warn(`⚠️ BullMQ/Redis retry enqueue failed (${err.message}). Falling back to in-memory processing...`);
    }

    if (!enqueued) {
      processBulkIssuanceJob(job_id).catch((err) => {
        console.error(`❌ In-memory job processing failed for job ${job_id}:`, err);
      });
    }

    res.json({ success: true, message: 'Failed recipients re-queued for processing' });
  } catch (err: any) {
    console.error('Retry failed job error:', err.message);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// GET /jobs/:job_id/recipients — Get all recipients for a job (including claim tokens for succeeded ones)
router.get('/jobs/:job_id/recipients', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { job_id } = req.params;

    // Verify job belongs to issuer
    const issuerResult = await query(
      "SELECT id FROM issuers WHERE REGEXP_REPLACE(stellar_address, '\\s+', '', 'g') = REGEXP_REPLACE($1, '\\s+', '', 'g')",
      [req.user!.stellar_address]
    );

    if (issuerResult.rows.length === 0) {
      res.status(403).json({ error: 'You are not a registered issuer' });
      return;
    }

    const issuerId = issuerResult.rows[0].id;

    const jobCheck = await query(
      'SELECT id FROM bulk_issuance_jobs WHERE id = $1 AND issuer_id = $2',
      [job_id, issuerId]
    );

    if (jobCheck.rows.length === 0) {
      res.status(404).json({ error: 'Job not found or access denied' });
      return;
    }

    const result = await query(
      `SELECT r.id, r.recipient_email, r.recipient_wallet, r.status, r.error_message, r.processed_at, pc.claim_token
       FROM bulk_issuance_recipients r
       LEFT JOIN pending_credentials pc ON r.pending_credential_id = pc.id
       WHERE r.job_id = $1
       ORDER BY r.id ASC`,
      [job_id]
    );

    res.json({ recipients: result.rows });
  } catch (err: any) {
    console.error('Fetch job recipients error:', err.message);
    res.status(500).json({ error: 'Failed to fetch job recipients' });
  }
});

// GET /jobs/:job_id/error-report — Download failed recipients list as CSV
router.get('/jobs/:job_id/error-report', async (req, res) => {
  try {
    const { job_id } = req.params;

    const recipientsResult = await query(
      `SELECT recipient_email, recipient_wallet, error_message, processed_at 
       FROM bulk_issuance_recipients 
       WHERE job_id = $1 AND status = 'failed'`,
      [job_id]
    );

    let csvContent = 'Email,Wallet,Error Message,Processed At\n';
    for (const r of recipientsResult.rows) {
      csvContent += `"${r.recipient_email}","${r.recipient_wallet || ''}","${(r.error_message || '').replace(/"/g, '""')}","${r.processed_at || ''}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=job_${job_id}_errors.csv`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('Export error report error:', err.message);
    res.status(500).send('Failed to generate error report');
  }
});

export default router;
