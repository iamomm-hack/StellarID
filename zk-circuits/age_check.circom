pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template AgeCheck() {
    signal input birthYear;
    signal input birthMonth;
    signal input birthDay;
    signal input credentialNFTId;

    signal input currentYear;
    signal input currentMonth;
    signal input minAge;

    signal output isOldEnough;
    signal output proofHash;

    signal ageYears;
    ageYears <== currentYear - birthYear;

    component gte = GreaterEqThan(8);
    gte.in[0] <== ageYears;
    gte.in[1] <== minAge;
    isOldEnough <== gte.out;

    component hasher = Poseidon(4);
    hasher.inputs[0] <== birthYear;
    hasher.inputs[1] <== birthMonth;
    hasher.inputs[2] <== birthDay;
    hasher.inputs[3] <== credentialNFTId;
    proofHash <== hasher.out;
}

component main {public [currentYear, currentMonth, minAge]} = AgeCheck();
