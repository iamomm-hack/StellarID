import { Router, Response } from 'express';
import { query } from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateApiKey } from '../utils/crypto';

const router = Router();

// POST / — Register a new platform
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, webhookUrl, allowedCredentialTypes } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Platform name is required' });
      return;
    }

    const apiKey = generateApiKey();

    const result = await query(
      `INSERT INTO platforms (name, api_key, webhook_url, allowed_credential_types)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, api_key, created_at`,
      [name, apiKey, webhookUrl || null, JSON.stringify(allowedCredentialTypes || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error('Create platform error:', err.message);
    res.status(500).json({ error: 'Failed to create platform' });
  }
});

// GET / — List platforms (admin)
router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, allowed_credential_types, rate_limit_per_minute, created_at
       FROM platforms
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error('Fetch platforms error:', err.message);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// POST /:id/rotate-key — Rotate API key
router.post('/:id/rotate-key', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const newApiKey = generateApiKey();

    const result = await query(
      'UPDATE platforms SET api_key = $1 WHERE id = $2 RETURNING id, name, api_key',
      [newApiKey, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Platform not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Rotate key error:', err.message);
    res.status(500).json({ error: 'Failed to rotate API key' });
  }
});

export default router;
