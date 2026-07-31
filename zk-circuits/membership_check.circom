/**
 * StellarID — Membership Verification Circuit
 * ==============================================
 * Groth16 ZK-SNARK circuit that proves a user's membership tier
 * meets a required level WITHOUT revealing their actual tier.
 *
 * Circuit type:  membership_check
 * Proving system: Groth16 (BN128 curve)
 * Trusted setup:  Hermez Powers of Tau 2^12
 *
 * Tier encoding (numeric):
 *   0 = None, 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Platinum
 *
 * Privacy guarantees:
 * - membershipTier is a PRIVATE input (never leaves the browser)
 * - credentialNFTId is PRIVATE (links proof to a specific on-chain credential)
 * - Only the boolean result (hasRequiredTier) and Poseidon commitment are public
 *
 * Example: Prove "My tier >= Gold (3)" without revealing exact tier.
 *
 * @version 2.0.0
 * @author StellarID Protocol Team
 * @license MIT
 */

pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template MembershipCheck() {
    // ─── Private Inputs (never transmitted to server) ────────────────
    signal input membershipTier;   // User's numeric membership tier (0-4)
    signal input credentialNFTId;  // On-chain credential NFT token ID

    // ─── Public Inputs (visible to verifier) ─────────────────────────
    signal input requiredTier;     // Minimum tier level required (e.g. 3 = Gold)

    // ─── Outputs ─────────────────────────────────────────────────────
    signal output hasRequiredTier; // 1 if tier >= requiredTier, 0 otherwise
    signal output proofHash;       // Poseidon hash commitment of private data

    // ─── Tier Comparison ─────────────────────────────────────────────
    // GreaterEqThan(4) supports values up to 2^4 = 16 (sufficient for tier levels)
    component gte = GreaterEqThan(4);
    gte.in[0] <== membershipTier;
    gte.in[1] <== requiredTier;
    hasRequiredTier <== gte.out;

    // ─── Privacy-Preserving Commitment ───────────────────────────────
    component hasher = Poseidon(2);
    hasher.inputs[0] <== membershipTier;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

// Public input: requiredTier only
component main {public [requiredTier]} = MembershipCheck();
