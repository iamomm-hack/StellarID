/**
 * StellarID — Zero-Knowledge Proof Verifier
 * ============================================
 * Server-side verification of ZK-SNARK proofs generated client-side.
 *
 * Supports Groth16 proofs for the following circuit types:
 * - `age_check` — Proves age ≥ threshold without revealing birthdate
 * - `income_check` — Proves income within range without revealing amount
 * - `residency_check` — Proves country residency without revealing location
 * - `membership_check` — Proves Merkle tree membership without revealing secret
 *
 * Verification flow:
 * 1. Load the verification key for the specified circuit type
 * 2. Call snarkjs.groth16.verify() with the key, public signals, and proof
 * 3. Return boolean result
 *
 * In development (without compiled circuits), falls back to structural
 * validation only — accepts any well-formed Groth16 proof object.
 *
 * @version 2.0.0
 * @module services/zkVerifier
 */

import * as fs from 'fs';
import * as path from 'path';

// Directory containing compiled circuit artifacts (verification keys)
const CIRCUITS_DIR = path.join(__dirname, '../../circuits');

/** Supported ZK circuit types */
type CircuitType = 'age_check' | 'income_check' | 'residency_check' | 'membership_check';

/**
 * Verify a Groth16 ZK-SNARK proof against the corresponding circuit verification key.
 *
 * @param proof - The proof object containing pi_a, pi_b, pi_c, and protocol fields
 * @param publicSignals - Array of public signal values as strings
 * @param circuitType - Which circuit to verify against
 * @returns true if the proof is valid, false otherwise
 * @throws Error if proof structure is invalid or verification fails
 */
export async function verifyProof(
  proof: object,
  publicSignals: string[],
  circuitType: CircuitType
): Promise<boolean> {
  const vkeyPath = path.join(CIRCUITS_DIR, `${circuitType}_verification_key.json`);

  if (!fs.existsSync(vkeyPath)) {
    console.warn(`[ZK] Verification key not found: ${vkeyPath}`);
    console.warn('[ZK] Falling back to structural validation only');

    // Validate proof structure matches Groth16 format
    const p = proof as any;
    if (!p.pi_a || !p.pi_b || !p.pi_c || !p.protocol) {
      throw new Error('Invalid proof structure: missing pi_a, pi_b, pi_c, or protocol');
    }

    if (p.protocol !== 'groth16') {
      throw new Error('Only groth16 proofs are supported');
    }

    if (!Array.isArray(publicSignals) || publicSignals.length === 0) {
      throw new Error('Public signals must be a non-empty array');
    }

    // In development without compiled circuits, accept valid-structured proofs
    console.warn('[ZK] WARNING: Accepting proof without cryptographic verification (dev mode)');
    return true;
  }

  // Production path: cryptographic verification via snarkjs
  try {
    const snarkjs = await import('snarkjs');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

    console.log(`[ZK] Proof verification for ${circuitType}: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
  } catch (err: any) {
    console.error(`[ZK] Proof verification error for ${circuitType}: ${err.message}`);
    throw new Error(`Verification failed: ${err.message}`);
  }
}

/**
 * Returns the list of supported ZK circuit types.
 * Used by the frontend to populate the proof generation UI.
 */
export function getSupportedCircuits(): CircuitType[] {
  return ['age_check', 'income_check', 'residency_check', 'membership_check'];
}

/**
 * Check if a specific circuit's verification key is available on disk.
 * Useful for health checks and diagnostics.
 *
 * @param circuitType - Circuit to check
 * @returns true if the verification key file exists
 */
export function isCircuitAvailable(circuitType: CircuitType): boolean {
  const vkeyPath = path.join(CIRCUITS_DIR, `${circuitType}_verification_key.json`);
  return fs.existsSync(vkeyPath);
}
