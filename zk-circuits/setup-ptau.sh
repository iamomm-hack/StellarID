#!/bin/bash
set -e
echo "Generating PTAU file..."
npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="random text"
npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
echo "Done!"
