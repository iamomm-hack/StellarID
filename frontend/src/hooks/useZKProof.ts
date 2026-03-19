'use client';
import { useState } from 'react';

interface ProofResult {
  proof: object;
  publicSignals: string[];
}

const CIRCUITS_BASE_PATH = process.env.NEXT_PUBLIC_CIRCUITS_BASE_PATH || '/circuits';
const ALLOW_MOCK_PROOFS = false; // Mock proof fallback disabled to enforce real ZK proof flow

function createMockProof(publicSignals: string[]): ProofResult {
  return {
    proof: {
      pi_a: ['0', '0', '1'],
      pi_b: [['0', '0'], ['0', '0'], ['1', '0']],
      pi_c: ['0', '0', '1'],
      protocol: 'groth16',
      curve: 'bn128',
    },
    publicSignals,
  };
}

function buildSetupError(filePath: string): string {
  return `Missing or invalid circuit file: ${filePath}. Run circuit setup first: (1) compile circuits, (2) copy artifacts to frontend/public/circuits, then restart frontend.`;
}

async function loadArtifactAsBlobUrl(filePath: string, expectedWasm = false): Promise<string> {
  const response = await fetch(filePath, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(buildSetupError(filePath));
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.length < 4) {
    throw new Error(buildSetupError(filePath));
  }

  // If server returned an HTML error page, first bytes are usually '<!DO' (3C 21 44 4F)
  const looksLikeHtml = bytes[0] === 0x3c && bytes[1] === 0x21 && bytes[2] === 0x44 && bytes[3] === 0x4f;
  if (looksLikeHtml) {
    throw new Error(buildSetupError(filePath));
  }

  if (expectedWasm) {
    const isWasm = bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d;
    if (!isWasm) {
      throw new Error(buildSetupError(filePath));
    }
  }

  return URL.createObjectURL(new Blob([bytes]));
}

async function loadCircuitArtifacts(circuitName: string): Promise<{ wasmBlobUrl: string; zkeyBlobUrl: string }> {
  const wasmPath = `${CIRCUITS_BASE_PATH}/${circuitName}.wasm`;
  const zkeyPath = `${CIRCUITS_BASE_PATH}/${circuitName}_final.zkey`;

  const wasmBlobUrl = await loadArtifactAsBlobUrl(wasmPath, true);
  const zkeyBlobUrl = await loadArtifactAsBlobUrl(zkeyPath, false);

  return { wasmBlobUrl, zkeyBlobUrl };
}

export function useZKProof() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);

  const generateAgeProof = async (
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    credentialNFTId: number,
    minAge: number
  ): Promise<ProofResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const snarkjs = await import('snarkjs');
      let wasmBlobUrl = '';
      let zkeyBlobUrl = '';
      try {
        const artifacts = await loadCircuitArtifacts('age_check');
        wasmBlobUrl = artifacts.wasmBlobUrl;
        zkeyBlobUrl = artifacts.zkeyBlobUrl;
      } catch (artifactErr) {
        if (ALLOW_MOCK_PROOFS) {
          const mock = createMockProof(['1', String(minAge), String(credentialNFTId)]);
          setResult(mock);
          return mock;
        }
        throw artifactErr;
      }
      const now = new Date();
      const input = {
        birthYear,
        birthMonth,
        birthDay,
        credentialNFTId,
        currentYear: now.getFullYear(),
        currentMonth: now.getMonth() + 1,
        minAge,
      };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmBlobUrl,
        zkeyBlobUrl
      );
      URL.revokeObjectURL(wasmBlobUrl);
      URL.revokeObjectURL(zkeyBlobUrl);
      const proofResult = { proof, publicSignals };
      setResult(proofResult);
      return proofResult;
    } catch (err: any) {
      setError(err.message || 'Proof generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateIncomeProof = async (
    exactIncome: number,
    credentialNFTId: number,
    incomeThreshold: number
  ): Promise<ProofResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const snarkjs = await import('snarkjs');
      let wasmBlobUrl = '';
      let zkeyBlobUrl = '';
      try {
        const artifacts = await loadCircuitArtifacts('income_check');
        wasmBlobUrl = artifacts.wasmBlobUrl;
        zkeyBlobUrl = artifacts.zkeyBlobUrl;
      } catch (artifactErr) {
        if (ALLOW_MOCK_PROOFS) {
          const mock = createMockProof(['1', String(incomeThreshold), String(credentialNFTId)]);
          setResult(mock);
          return mock;
        }
        throw artifactErr;
      }
      const input = { exactIncome, credentialNFTId, incomeThreshold };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmBlobUrl,
        zkeyBlobUrl
      );
      URL.revokeObjectURL(wasmBlobUrl);
      URL.revokeObjectURL(zkeyBlobUrl);
      const proofResult = { proof, publicSignals };
      setResult(proofResult);
      return proofResult;
    } catch (err: any) {
      setError(err.message || 'Proof generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateResidencyProof = async (
    countryCode: number,
    credentialNFTId: number,
    allowedCountryCode: number
  ): Promise<ProofResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const snarkjs = await import('snarkjs');
      let wasmBlobUrl = '';
      let zkeyBlobUrl = '';
      try {
        const artifacts = await loadCircuitArtifacts('residency_check');
        wasmBlobUrl = artifacts.wasmBlobUrl;
        zkeyBlobUrl = artifacts.zkeyBlobUrl;
      } catch (artifactErr) {
        if (ALLOW_MOCK_PROOFS) {
          const mock = createMockProof(['1', String(allowedCountryCode), String(credentialNFTId)]);
          setResult(mock);
          return mock;
        }
        throw artifactErr;
      }
      const input = { countryCode, credentialNFTId, allowedCountryCode };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmBlobUrl,
        zkeyBlobUrl
      );
      URL.revokeObjectURL(wasmBlobUrl);
      URL.revokeObjectURL(zkeyBlobUrl);
      const proofResult = { proof, publicSignals };
      setResult(proofResult);
      return proofResult;
    } catch (err: any) {
      setError(err.message || 'Proof generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const generateMembershipProof = async (
    membershipTier: number,
    credentialNFTId: number,
    requiredTier: number
  ): Promise<ProofResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const snarkjs = await import('snarkjs');
      let wasmBlobUrl = '';
      let zkeyBlobUrl = '';
      try {
        const artifacts = await loadCircuitArtifacts('membership_check');
        wasmBlobUrl = artifacts.wasmBlobUrl;
        zkeyBlobUrl = artifacts.zkeyBlobUrl;
      } catch (artifactErr) {
        if (ALLOW_MOCK_PROOFS) {
          const mock = createMockProof(['1', String(requiredTier), String(credentialNFTId)]);
          setResult(mock);
          return mock;
        }
        throw artifactErr;
      }
      const input = { membershipTier, credentialNFTId, requiredTier };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmBlobUrl,
        zkeyBlobUrl
      );
      URL.revokeObjectURL(wasmBlobUrl);
      URL.revokeObjectURL(zkeyBlobUrl);
      const proofResult = { proof, publicSignals };
      setResult(proofResult);
      return proofResult;
    } catch (err: any) {
      setError(err.message || 'Proof generation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateAgeProof,
    generateIncomeProof,
    generateResidencyProof,
    generateMembershipProof,
    loading,
    error,
    result,
  };
}
