'use client';
import { useState } from 'react';

interface ProofResult {
  proof: object;
  publicSignals: string[];
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
        '/circuits/age_check.wasm',
        '/circuits/age_check_final.zkey'
      );
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
      const input = { exactIncome, credentialNFTId, incomeThreshold };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/circuits/income_check.wasm',
        '/circuits/income_check_final.zkey'
      );
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
      const input = { countryCode, credentialNFTId, allowedCountryCode };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/circuits/residency_check.wasm',
        '/circuits/residency_check_final.zkey'
      );
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
      const input = { membershipTier, credentialNFTId, requiredTier };
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/circuits/membership_check.wasm',
        '/circuits/membership_check_final.zkey'
      );
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
