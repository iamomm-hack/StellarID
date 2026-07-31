#!/bin/bash
# StellarID v2.0.0 — Mainnet Smart Contract Deployment Script
echo "Building and Deploying StellarID contracts to Stellar Mainnet..."

if [ -z "$STELLAR_SECRET_KEY" ]; then
  echo "Error: STELLAR_SECRET_KEY (Mainnet Secret Key) is not set."
  echo "Please run: export STELLAR_SECRET_KEY=\"your_mainnet_secret_key_starting_with_S\""
  exit 1
fi

echo ""
echo "=== Step 1: Building Rust Contracts in Release Mode ==="
cd contracts/credential_nft && cargo build --target wasm32-unknown-unknown --release && cd ../..
cd contracts/revocation_registry && cargo build --target wasm32-unknown-unknown --release && cd ../..
cd contracts/disclosure_contract && cargo build --target wasm32-unknown-unknown --release && cd ../..

echo ""
echo "=== Step 2: Optimizing Contract Size and Gas Fees ==="
stellar contract optimize --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.wasm
stellar contract optimize --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.wasm
stellar contract optimize --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.wasm

# Create build folder to store IDs
mkdir -p build/mainnet

echo ""
echo "=== Step 3: Deploying credential_nft to Mainnet ==="
stellar contract deploy \
  --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.optimized.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network mainnet \
  > build/mainnet/credential_nft_id.txt

echo ""
echo "=== Step 4: Deploying revocation_registry to Mainnet ==="
stellar contract deploy \
  --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.optimized.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network mainnet \
  > build/mainnet/revocation_registry_id.txt

echo ""
echo "=== Step 5: Deploying disclosure_contract to Mainnet ==="
stellar contract deploy \
  --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.optimized.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network mainnet \
  > build/mainnet/disclosure_contract_id.txt

echo ""
echo "=== Mainnet Deployment Complete! ==="
echo "Update your .env / Render env variables with these Mainnet Contract IDs:"
echo "  CREDENTIAL_NFT_CONTRACT_ID=$(cat build/mainnet/credential_nft_id.txt)"
echo "  REVOCATION_CONTRACT_ID=$(cat build/mainnet/revocation_registry_id.txt)"
echo "  DISCLOSURE_CONTRACT_ID=$(cat build/mainnet/disclosure_contract_id.txt)"
