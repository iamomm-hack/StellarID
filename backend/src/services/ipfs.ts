import axios from 'axios';
import { hashData } from '../utils/crypto';

const IPFS_API_URL = process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001';
const IPFS_PROJECT_ID = process.env.IPFS_PROJECT_ID || '';
const IPFS_PROJECT_SECRET = process.env.IPFS_PROJECT_SECRET || '';

export async function uploadToIPFS(data: string): Promise<string> {
  if (!IPFS_PROJECT_ID || !IPFS_PROJECT_SECRET) {
    // Fallback: generate a deterministic hash as simulated IPFS hash
    console.warn('[IPFS] No credentials configured — returning simulated hash');
    const hash = hashData(data);
    return `Qm${hash.substring(0, 44)}`;
  }

  try {
    const auth = Buffer.from(`${IPFS_PROJECT_ID}:${IPFS_PROJECT_SECRET}`).toString('base64');

    const formData = new FormData();
    formData.append('file', new Blob([data], { type: 'application/json' }));

    const response = await axios.post(`${IPFS_API_URL}/api/v0/add`, formData, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
    });

    console.log(`[IPFS] Uploaded: ${response.data.Hash}`);
    return response.data.Hash;
  } catch (err: any) {
    console.error(`[IPFS] Upload failed: ${err.message}`);
    // Return simulated hash as fallback
    const hash = hashData(data);
    return `Qm${hash.substring(0, 44)}`;
  }
}

export async function getFromIPFS(hash: string): Promise<string> {
  try {
    const response = await axios.get(`https://ipfs.io/ipfs/${hash}`, {
      timeout: 10000,
    });
    return JSON.stringify(response.data);
  } catch (err: any) {
    console.error(`[IPFS] Fetch failed for ${hash}: ${err.message}`);
    throw new Error(`Failed to fetch from IPFS: ${hash}`);
  }
}
