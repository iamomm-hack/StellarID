import axios from 'axios';
import { hashData } from '../utils/crypto';

const PINATA_API_KEY = process.env.IPFS_PROJECT_ID || '';
const PINATA_SECRET = process.env.IPFS_PROJECT_SECRET || '';

export async function uploadToIPFS(data: string): Promise<string> {
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    // Fallback: generate a deterministic hash as simulated IPFS hash
    console.warn('[IPFS] No Pinata credentials configured — returning simulated hash');
    const hash = hashData(data);
    return `Qm${hash.substring(0, 44)}`;
  }

  try {
    const jsonData = JSON.parse(data);

    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: jsonData,
        pinataMetadata: { name: `stellarid-${Date.now()}` },
      },
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
          'Content-Type': 'application/json',
        },
        maxContentLength: 10 * 1024 * 1024,
      }
    );

    console.log(`[IPFS] Pinned to Pinata: ${response.data.IpfsHash}`);
    return response.data.IpfsHash;
  } catch (err: any) {
    console.error(`[IPFS] Pinata upload failed: ${err.message}`);
    const hash = hashData(data);
    return `Qm${hash.substring(0, 44)}`;
  }
}

export async function getFromIPFS(hash: string): Promise<string> {
  try {
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`, {
      timeout: 10000,
    });
    return JSON.stringify(response.data);
  } catch (err: any) {
    console.error(`[IPFS] Fetch failed for ${hash}: ${err.message}`);
    throw new Error(`Failed to fetch from IPFS: ${hash}`);
  }
}

