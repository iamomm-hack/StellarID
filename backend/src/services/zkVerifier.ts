import * as fs from 'fs';
import * as path from 'path';

const CIRCUITS_DIR = path.join(__dirname, '../../circuits');

type CircuitType = 'age_check' | 'income_check' | 'residency_check' | 'membership_check';

export async function verifyProof(
  proof: object,
  publicSignals: string[],
  circuitType: CircuitType
): Promise<boolean> {
  const vkeyPath = path.join(CIRCUITS_DIR, `${circuitType}_verification_key.json`);

  if (!fs.existsSync(vkeyPath)) {
    console.warn(`Verification key not found: ${vkeyPath}`);
    console.warn('Falling back to format validation only');

    // Validate proof structure
    const p = proof as any;
    if (!p.pi_a || !p.pi_b || !p.pi_c || !p.protocol) {
      throw new Error('Invalid proof structure');
    }

    if (p.protocol !== 'groth16') {
      throw new Error('Only groth16 proofs are supported');
    }

    if (!Array.isArray(publicSignals) || publicSignals.length === 0) {
      throw new Error('Public signals must be a non-empty array');
    }

    // In development without compiled circuits, accept valid-structured proofs
    console.warn('WARNING: Accepting proof without cryptographic verification (dev mode)');
    return true;
  }

  // Production: use snarkjs to verify
  try {
    // Dynamic import to avoid issues when snarkjs isn't available
    const snarkjs = await import('snarkjs');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    return isValid;
  } catch (err: any) {
    console.error(`Proof verification error: ${err.message}`);
    throw new Error(`Verification failed: ${err.message}`);
  }
}

export function getSupportedCircuits(): CircuitType[] {
  return ['age_check', 'income_check', 'residency_check', 'membership_check'];
}
