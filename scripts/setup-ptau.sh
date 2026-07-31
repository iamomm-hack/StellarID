#!/bin/bash
# StellarID v2.0.0 — Powers of Tau Setup Script
echo "Setting up Powers of Tau..."
cd zk-circuits

if [ ! -f "pot12_final.ptau" ]; then
  echo "Downloading Hermez ceremony ptau file..."
  curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau \
    -o pot12_final.ptau
  echo "ptau file downloaded."
else
  echo "ptau file already exists, skipping."
fi
