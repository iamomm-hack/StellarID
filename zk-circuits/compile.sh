#!/bin/bash
set -e
mkdir -p build

for circuit in age_check income_check residency_check membership_check; do
    echo "=== Compiling $circuit ==="

    circom ${circuit}.circom --r1cs --wasm --sym -o build/

    echo "Generating zkey for $circuit..."
    npx snarkjs groth16 setup build/${circuit}.r1cs pot12_final.ptau \
      build/${circuit}_0000.zkey

    npx snarkjs zkey contribute build/${circuit}_0000.zkey \
      build/${circuit}_final.zkey \
      --name="StellarID Contribution" \
      -e="stellarid random entropy $(date)"

    npx snarkjs zkey export verificationkey \
      build/${circuit}_final.zkey \
      build/${circuit}_verification_key.json

    echo "$circuit done."
done
echo "All circuits compiled successfully!"
