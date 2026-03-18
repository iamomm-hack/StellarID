pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template MembershipCheck() {
    signal input membershipTier;
    signal input credentialNFTId;
    signal input requiredTier;

    signal output hasRequiredTier;
    signal output proofHash;

    component gte = GreaterEqThan(4);
    gte.in[0] <== membershipTier;
    gte.in[1] <== requiredTier;
    hasRequiredTier <== gte.out;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== membershipTier;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

component main {public [requiredTier]} = MembershipCheck();
