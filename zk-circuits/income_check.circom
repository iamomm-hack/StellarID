/**
 * StellarID — Income Verification Circuit
 * ==========================================
 * Groth16 ZK-SNARK circuit that proves a user's income meets a minimum
 * threshold WITHOUT revealing the exact income amount.
 *
 * Circuit type:  income_check
 * Proving system: Groth16 (BN128 curve)
 * Trusted setup:  Hermez Powers of Tau 2^12
 *
 * Privacy guarantees:
 * - exactIncome is a PRIVATE input (never leaves the browser)
 * - credentialNFTId is PRIVATE (links proof to a specific on-chain credential)
 * - Only the boolean result (meetsThreshold) and Poseidon commitment are public
 *
 * Example: Prove "My income >= $50,000" without revealing exact salary.
 *
 * @version 2.0.0
 * @author StellarID Protocol Team
 * @license MIT
 */

pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template IncomeCheck() {
    // ─── Private Inputs (never transmitted to server) ────────────────
    signal input exactIncome;      // User's exact income in smallest unit
    signal input credentialNFTId;  // On-chain credential NFT token ID

    // ─── Public Inputs (visible to verifier) ─────────────────────────
    signal input incomeThreshold;  // Minimum income to prove (e.g. 50000)

    // ─── Outputs ─────────────────────────────────────────────────────
    signal output meetsThreshold;  // 1 if income >= threshold, 0 otherwise
    signal output proofHash;       // Poseidon hash commitment of private data

    // ─── Threshold Comparison ────────────────────────────────────────
    // GreaterEqThan(32) supports values up to 2^32 (~4.2B, sufficient for income)
    component gte = GreaterEqThan(32);
    gte.in[0] <== exactIncome;
    gte.in[1] <== incomeThreshold;
    meetsThreshold <== gte.out;

    // ─── Privacy-Preserving Commitment ───────────────────────────────
    component hasher = Poseidon(2);
    hasher.inputs[0] <== exactIncome;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

// Public input: incomeThreshold only
component main {public [incomeThreshold]} = IncomeCheck();
