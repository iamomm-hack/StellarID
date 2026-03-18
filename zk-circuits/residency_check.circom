pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template ResidencyCheck() {
    signal input countryCode;
    signal input credentialNFTId;
    signal input allowedCountryCode;

    signal output isAllowed;
    signal output proofHash;

    component eq = IsEqual();
    eq.in[0] <== countryCode;
    eq.in[1] <== allowedCountryCode;
    isAllowed <== eq.out;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== countryCode;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

component main {public [allowedCountryCode]} = ResidencyCheck();
