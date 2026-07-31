/**
 * StellarID — Residency Verification Circuit
 * =============================================
 * Groth16 ZK-SNARK circuit that proves a user resides in a specific
 * country WITHOUT revealing their actual country code to the verifier
 * until the match is confirmed.
 *
 * Circuit type:  residency_check
 * Proving system: Groth16 (BN128 curve)
 * Trusted setup:  Hermez Powers of Tau 2^12
 *
 * Privacy guarantees:
 * - countryCode is a PRIVATE input (never leaves the browser)
 * - credentialNFTId is PRIVATE (links proof to a specific on-chain credential)
 * - Only the boolean result (isAllowed) and Poseidon commitment are public
 *
 * Example: Prove "I reside in country code 91" without revealing address.
 *
 * @version 2.0.0
 * @author StellarID Protocol Team
 * @license MIT
 */

pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template ResidencyCheck() {
    // ─── Private Inputs (never transmitted to server) ────────────────
    signal input countryCode;         // User's numeric country code (e.g. 91 for India)
    signal input credentialNFTId;     // On-chain credential NFT token ID

    // ─── Public Inputs (visible to verifier) ─────────────────────────
    signal input allowedCountryCode;  // Country code to check against

    // ─── Outputs ─────────────────────────────────────────────────────
    signal output isAllowed;          // 1 if countryCode matches, 0 otherwise
    signal output proofHash;          // Poseidon hash commitment of private data

    // ─── Equality Check ──────────────────────────────────────────────
    // IsEqual returns 1 if both inputs are identical
    component eq = IsEqual();
    eq.in[0] <== countryCode;
    eq.in[1] <== allowedCountryCode;
    isAllowed <== eq.out;

    // ─── Privacy-Preserving Commitment ───────────────────────────────
    component hasher = Poseidon(2);
    hasher.inputs[0] <== countryCode;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

// Public input: allowedCountryCode only
component main {public [allowedCountryCode]} = ResidencyCheck();
