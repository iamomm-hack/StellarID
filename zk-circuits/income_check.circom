pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

template IncomeCheck() {
    signal input exactIncome;
    signal input credentialNFTId;
    signal input incomeThreshold;

    signal output meetsThreshold;
    signal output proofHash;

    component gte = GreaterEqThan(32);
    gte.in[0] <== exactIncome;
    gte.in[1] <== incomeThreshold;
    meetsThreshold <== gte.out;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== exactIncome;
    hasher.inputs[1] <== credentialNFTId;
    proofHash <== hasher.out;
}

component main {public [incomeThreshold]} = IncomeCheck();
