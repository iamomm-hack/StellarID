#!/bin/bash
echo "Deploying StellarID contracts to Stellar testnet..."

if [ -z "$STELLAR_SECRET_KEY" ]; then
  echo "Error: STELLAR_SECRET_KEY not set"
  exit 1
fi

echo ""
echo "=== Deploying credential_nft ==="
soroban contract deploy \
  --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network testnet \
  2>&1 | tee /tmp/credential_nft_id.txt

echo ""
echo "=== Deploying revocation_registry ==="
soroban contract deploy \
  --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network testnet \
  2>&1 | tee /tmp/revocation_registry_id.txt

echo ""
echo "=== Deploying disclosure_contract ==="
soroban contract deploy \
  --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.wasm \
  --source "$STELLAR_SECRET_KEY" \
  --network testnet \
  2>&1 | tee /tmp/disclosure_contract_id.txt

echo ""
echo "=== Deployment Complete ==="
echo "Update your .env with these contract IDs:"
echo "  CREDENTIAL_NFT_CONTRACT_ID=$(cat /tmp/credential_nft_id.txt)"
echo "  REVOCATION_CONTRACT_ID=$(cat /tmp/revocation_registry_id.txt)"
echo "  DISCLOSURE_CONTRACT_ID=$(cat /tmp/disclosure_contract_id.txt)"
