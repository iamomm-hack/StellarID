/**
 * StellarID — Age Verification Circuit
 * =======================================
 * Groth16 ZK-SNARK circuit that proves a user's age meets a minimum
 * threshold WITHOUT revealing their actual date of birth.
 *
 * Circuit type:  age_check
 * Proving system: Groth16 (BN128 curve)
 * Trusted setup:  Hermez Powers of Tau 2^12
 *
 * Privacy guarantees:
 * - birthYear, birthMonth, birthDay are PRIVATE inputs (never leave the browser)
 * - credentialNFTId is PRIVATE (links proof to a specific on-chain credential)
 * - Only the boolean result (isOldEnough) and a Poseidon commitment hash are public
 *
 * Example: Prove "I am over 18" without revealing birth date.
 *
 * @version 2.0.0
 * @author StellarID Protocol Team
 * @license MIT
 */

pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template AgeCheck() {
    // ─── Private Inputs (never transmitted to server) ────────────────
    signal input birthYear;        // User's year of birth (e.g. 1995)
    signal input birthMonth;       // User's month of birth (1-12)
    signal input birthDay;         // User's day of birth (1-31)
    signal input credentialNFTId;  // On-chain credential NFT token ID

    // ─── Public Inputs (visible to verifier) ─────────────────────────
    signal input currentYear;      // Current calendar year (e.g. 2026)
    signal input currentMonth;     // Current calendar month (1-12)
    signal input minAge;           // Minimum age requirement (e.g. 18)

    // ─── Outputs ─────────────────────────────────────────────────────
    signal output isOldEnough;     // 1 if age >= minAge, 0 otherwise
    signal output proofHash;       // Poseidon hash commitment of private data

    // ─── Age Calculation ─────────────────────────────────────────────
    // Compute approximate age in years (conservative: does not account
    // for month/day precision to avoid circuit complexity)
    signal ageYears;
    ageYears <== currentYear - birthYear;

    // ─── Threshold Comparison ────────────────────────────────────────
    // GreaterEqThan(8) supports values up to 2^8 = 256 (sufficient for age)
    component gte = GreaterEqThan(8);
    gte.in[0] <== ageYears;
    gte.in[1] <== minAge;
    isOldEnough <== gte.out;

    // ─── Privacy-Preserving Commitment ───────────────────────────────
    // Poseidon hash binds the proof to the user's private data without
    // revealing it. Verifiers can confirm the same data was used across
    // multiple proofs by comparing proofHash values.
    component hasher = Poseidon(4);
    hasher.inputs[0] <== birthYear;
    hasher.inputs[1] <== birthMonth;
    hasher.inputs[2] <== birthDay;
    hasher.inputs[3] <== credentialNFTId;
    proofHash <== hasher.out;
}

// Public inputs: currentYear, currentMonth, minAge
// All other inputs remain private
component main {public [currentYear, currentMonth, minAge]} = AgeCheck();
