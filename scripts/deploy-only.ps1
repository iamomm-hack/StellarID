# StellarID v2.0.0 — Direct Mainnet Deployment (PowerShell)
Write-Host "Deploying StellarID contracts to Stellar Mainnet (skipping compilation)..."

if ($null -eq $env:STELLAR_SECRET_KEY -or $env:STELLAR_SECRET_KEY -eq "") {
    Write-Error "Error: STELLAR_SECRET_KEY is not set."
    exit 1
}

# Create build folder
New-Item -ItemType Directory -Force -Path build/mainnet | Out-Null

Write-Host ""
Write-Host "=== Step 1: Deploying credential_nft to Mainnet ==="
stellar contract deploy --no-cache --fee 10000000 `
  --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/credential_nft_id.txt -NoNewline -Encoding utf8

Write-Host ""
Write-Host "=== Step 2: Deploying revocation_registry to Mainnet ==="
stellar contract deploy --no-cache --fee 10000000 `
  --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/revocation_registry_id.txt -NoNewline -Encoding utf8

Write-Host ""
Write-Host "=== Step 3: Deploying disclosure_contract to Mainnet ==="
stellar contract deploy --no-cache --fee 10000000 `
  --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/disclosure_contract_id.txt -NoNewline -Encoding utf8

$nft_id = (Get-Content build/mainnet/credential_nft_id.txt -Raw).Trim()
$rev_id = (Get-Content build/mainnet/revocation_registry_id.txt -Raw).Trim()
$disc_id = (Get-Content build/mainnet/disclosure_contract_id.txt -Raw).Trim()

Write-Host ""
Write-Host "=== Mainnet Deployment Complete! ==="
Write-Host "CREDENTIAL_NFT_CONTRACT_ID=$nft_id"
Write-Host "REVOCATION_CONTRACT_ID=$rev_id"
Write-Host "DISCLOSURE_CONTRACT_ID=$disc_id"
