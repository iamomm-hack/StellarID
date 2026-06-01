Write-Host "Building and Deploying StellarID contracts to Stellar Mainnet..."

if ($null -eq $env:STELLAR_SECRET_KEY -or $env:STELLAR_SECRET_KEY -eq "") {
    Write-Error "Error: STELLAR_SECRET_KEY (Mainnet Secret Key) is not set."
    Write-Host "Please run: `$env:STELLAR_SECRET_KEY='your_mainnet_secret_key_starting_with_S'"
    exit 1
}

Write-Host ""
Write-Host "=== Step 1: Building Rust Contracts in Release Mode ==="
Set-Location contracts/credential_nft
cargo build --target wasm32-unknown-unknown --release
Set-Location ../revocation_registry
cargo build --target wasm32-unknown-unknown --release
Set-Location ../disclosure_contract
cargo build --target wasm32-unknown-unknown --release
Set-Location ../..

Write-Host ""
Write-Host "=== Step 2: Optimizing Contract Size and Gas Fees ==="
stellar contract optimize --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.wasm
stellar contract optimize --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.wasm
stellar contract optimize --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.wasm

# Create build folder to store IDs
New-Item -ItemType Directory -Force -Path build/mainnet | Out-Null

Write-Host ""
Write-Host "=== Step 3: Deploying credential_nft to Mainnet ==="
stellar contract deploy `
  --wasm contracts/credential_nft/target/wasm32-unknown-unknown/release/credential_nft.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/credential_nft_id.txt -NoNewline -Encoding utf8

Write-Host ""
Write-Host "=== Step 4: Deploying revocation_registry to Mainnet ==="
stellar contract deploy `
  --wasm contracts/revocation_registry/target/wasm32-unknown-unknown/release/revocation_registry.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/revocation_registry_id.txt -NoNewline -Encoding utf8

Write-Host ""
Write-Host "=== Step 5: Deploying disclosure_contract to Mainnet ==="
stellar contract deploy `
  --wasm contracts/disclosure_contract/target/wasm32-unknown-unknown/release/disclosure_contract.optimized.wasm `
  --source "$env:STELLAR_SECRET_KEY" `
  --network mainnet `
  | Out-File -FilePath build/mainnet/disclosure_contract_id.txt -NoNewline -Encoding utf8

$nft_id = (Get-Content build/mainnet/credential_nft_id.txt -Raw).Trim()
$rev_id = (Get-Content build/mainnet/revocation_registry_id.txt -Raw).Trim()
$disc_id = (Get-Content build/mainnet/disclosure_contract_id.txt -Raw).Trim()

Write-Host ""
Write-Host "=== Mainnet Deployment Complete! ==="
Write-Host "Update your .env / Render env variables with these Mainnet Contract IDs:"
Write-Host "  CREDENTIAL_NFT_CONTRACT_ID=$nft_id"
Write-Host "  REVOCATION_CONTRACT_ID=$rev_id"
Write-Host "  DISCLOSURE_CONTRACT_ID=$disc_id"
