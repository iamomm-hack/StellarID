import axios from 'axios';
import * as StellarSdk from 'stellar-sdk';

const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const STELLAR_NETWORK_PASSPHRASE = process.env.STELLAR_PASSPHRASE || StellarSdk.Networks.TESTNET;
const CREDENTIAL_NFT_CONTRACT_ID = process.env.CREDENTIAL_NFT_CONTRACT_ID || '';
const FEE_SPONSOR_SECRET = process.env.FEE_SPONSOR_SECRET || '';

// Initialize Stellar server
const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);

// =============================================================================
// FEE SPONSORSHIP - Gasless Transactions
// =============================================================================

/**
 * Sponsor a transaction's fees using fee bump
 * Users don't pay any XLM - sponsor covers all fees
 */
export async function sponsorTransaction(
  innerTransaction: StellarSdk.Transaction,
  maxFee: string = '100000' // 0.01 XLM max
): Promise<{ txHash: string; sponsored: boolean }> {
  if (!FEE_SPONSOR_SECRET) {
    console.warn('[Fee Sponsor] No sponsor secret configured - fees not sponsored');
    return { txHash: '', sponsored: false };
  }

  try {
    const sponsorKeypair = StellarSdk.Keypair.fromSecret(FEE_SPONSOR_SECRET);
    
    // Create fee bump transaction
    const feeBumpTx = StellarSdk.TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair,
      maxFee,
      innerTransaction,
      STELLAR_NETWORK_PASSPHRASE
    );
    
    // Sign with sponsor key
    feeBumpTx.sign(sponsorKeypair);
    
    // Submit to network
    const response = await server.submitTransaction(feeBumpTx);
    
    console.log(`[Fee Sponsor] Transaction sponsored successfully`);
    console.log(`  Hash: ${response.hash}`);
    console.log(`  Sponsor: ${sponsorKeypair.publicKey()}`);
    
    return { txHash: response.hash, sponsored: true };
  } catch (err: any) {
    console.error('[Fee Sponsor] Failed to sponsor transaction:', err.message);
    return { txHash: '', sponsored: false };
  }
}

/**
 * Build a transaction with fee sponsorship (account sponsorship)
 * Sponsor pays for account creation fees
 */
export async function buildSponsoredTransaction(
  sourcePublicKey: string,
  sponsorSecretKey?: string
): Promise<{ transaction: StellarSdk.Transaction; sponsored: boolean }> {
  const sponsorSecret = sponsorSecretKey || FEE_SPONSOR_SECRET;
  
  if (!sponsorSecret) {
    throw new Error('Fee sponsor secret key required');
  }

  const sponsorKeypair = StellarSdk.Keypair.fromSecret(sponsorSecret);
  const sourceAccount = await server.loadAccount(sponsorKeypair.publicKey());
  
  // Build transaction with sponsor as source (pays fees)
  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: '100000', // 0.01 XLM
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  });

  // Begin sponsoring future reserves for the user
  txBuilder.addOperation(
    StellarSdk.Operation.beginSponsoringFutureReserves({
      sponsoredId: sourcePublicKey,
    })
  );

  // End sponsoring
  txBuilder.addOperation(
    StellarSdk.Operation.endSponsoringFutureReserves({
      source: sourcePublicKey,
    })
  );

  txBuilder.setTimeout(300);
  const transaction = txBuilder.build();
  
  // Sign with sponsor
  transaction.sign(sponsorKeypair);

  console.log(`[Fee Sponsor] Built sponsored transaction for ${sourcePublicKey}`);
  
  return { transaction, sponsored: true };
}

/**
 * Get sponsor account balance and status
 */
export async function getSponsorStatus(): Promise<{
  address: string;
  balance: string;
  canSponsor: boolean;
  transactionsRemaining: number;
}> {
  if (!FEE_SPONSOR_SECRET) {
    return { address: '', balance: '0', canSponsor: false, transactionsRemaining: 0 };
  }

  try {
    const sponsorKeypair = StellarSdk.Keypair.fromSecret(FEE_SPONSOR_SECRET);
    const account = await server.loadAccount(sponsorKeypair.publicKey());
    
    const xlmBalance = account.balances.find(
      (b: any) => b.asset_type === 'native'
    );
    const balance = xlmBalance ? xlmBalance.balance : '0';
    const balanceNum = parseFloat(balance);
    
    // Estimate: 0.01 XLM per transaction
    const transactionsRemaining = Math.floor(balanceNum / 0.01);
    
    return {
      address: sponsorKeypair.publicKey(),
      balance,
      canSponsor: balanceNum > 1, // Need at least 1 XLM
      transactionsRemaining,
    };
  } catch (err: any) {
    console.error('[Fee Sponsor] Failed to get sponsor status:', err.message);
    return { address: '', balance: '0', canSponsor: false, transactionsRemaining: 0 };
  }
}

// =============================================================================
// MULTI-SIGNATURE LOGIC - Multi-party Credential Approval
// =============================================================================

/**
 * Create a multi-signature credential approval request
 * Requires N of M signers to approve before credential is issued
 */
export async function createMultiSigCredentialRequest(
  credentialData: {
    ownerAddress: string;
    credentialType: string;
    claimHash: string;
    expiresAt: number;
  },
  requiredSigners: string[], // Public keys of required signers
  threshold: number // Number of signatures required
): Promise<{
  requestId: string;
  transaction: string; // XDR encoded
  requiredSignatures: number;
  signers: string[];
}> {
  if (threshold > requiredSigners.length) {
    throw new Error('Threshold cannot exceed number of signers');
  }

  // Generate unique request ID
  const requestId = `msig_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // For now, create a placeholder transaction that would call the contract
  // In production, this would build actual Soroban contract call
  console.log(`[MultiSig] Creating credential approval request:`);
  console.log(`  Request ID: ${requestId}`);
  console.log(`  Owner: ${credentialData.ownerAddress}`);
  console.log(`  Type: ${credentialData.credentialType}`);
  console.log(`  Required Signers: ${requiredSigners.length}`);
  console.log(`  Threshold: ${threshold}`);

  // Build a dummy transaction structure for demonstration
  // In production, this would be a real pre-auth transaction
  const txXDR = Buffer.from(JSON.stringify({
    requestId,
    credentialData,
    requiredSigners,
    threshold,
    createdAt: Date.now(),
  })).toString('base64');

  return {
    requestId,
    transaction: txXDR,
    requiredSignatures: threshold,
    signers: requiredSigners,
  };
}

/**
 * Add a signature to a multi-sig credential request
 */
export async function addSignatureToRequest(
  requestId: string,
  signerPublicKey: string,
  signature: string
): Promise<{
  requestId: string;
  signaturesCollected: number;
  signaturesRequired: number;
  isComplete: boolean;
  signers: { address: string; signed: boolean }[];
}> {
  console.log(`[MultiSig] Adding signature to request ${requestId}`);
  console.log(`  Signer: ${signerPublicKey}`);
  
  // In production, this would:
  // 1. Verify the signature against the transaction
  // 2. Store the signature in database
  // 3. Check if threshold is met
  // 4. If complete, submit the transaction
  
  // For demonstration, return mock status
  return {
    requestId,
    signaturesCollected: 1,
    signaturesRequired: 2,
    isComplete: false,
    signers: [
      { address: signerPublicKey, signed: true },
      { address: 'G...PENDING', signed: false },
    ],
  };
}

/**
 * Check status of a multi-sig request
 */
export async function getMultiSigRequestStatus(
  requestId: string
): Promise<{
  requestId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  signaturesCollected: number;
  signaturesRequired: number;
  signers: { address: string; signed: boolean; signedAt?: number }[];
  credentialId?: number;
  txHash?: string;
}> {
  console.log(`[MultiSig] Checking request status: ${requestId}`);
  
  // In production, fetch from database
  return {
    requestId,
    status: 'pending',
    signaturesCollected: 0,
    signaturesRequired: 2,
    signers: [],
  };
}

/**
 * Setup a multi-sig account for credential issuance
 * Creates an account that requires multiple signers
 */
export async function setupMultiSigAccount(
  masterSecretKey: string,
  additionalSigners: string[], // Public keys
  threshold: { low: number; med: number; high: number }
): Promise<{ accountId: string; txHash: string }> {
  try {
    const masterKeypair = StellarSdk.Keypair.fromSecret(masterSecretKey);
    const account = await server.loadAccount(masterKeypair.publicKey());
    
    let txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: '100000',
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    });

    // Add each additional signer one by one
    for (const signerPubKey of additionalSigners) {
      txBuilder = txBuilder.addOperation(
        StellarSdk.Operation.setOptions({
          signer: {
            ed25519PublicKey: signerPubKey,
            weight: 1,
          },
        })
      );
    }

    // Set thresholds
    txBuilder = txBuilder.addOperation(
      StellarSdk.Operation.setOptions({
        masterWeight: 1,
        lowThreshold: threshold.low,
        medThreshold: threshold.med,
        highThreshold: threshold.high,
      })
    );

    txBuilder = txBuilder.setTimeout(300);
    const transaction = txBuilder.build();
    transaction.sign(masterKeypair);

    const response = await server.submitTransaction(transaction);
    
    console.log(`[MultiSig] Account configured for multi-sig`);
    console.log(`  Account: ${masterKeypair.publicKey()}`);
    console.log(`  Signers: ${additionalSigners.length + 1}`);
    console.log(`  Thresholds: low=${threshold.low}, med=${threshold.med}, high=${threshold.high}`);
    
    return {
      accountId: masterKeypair.publicKey(),
      txHash: response.hash,
    };
  } catch (err: any) {
    console.error('[MultiSig] Failed to setup account:', err.message);
    throw err;
  }
}

// =============================================================================
// EXISTING FUNCTIONS (Updated)
// =============================================================================

export async function mintCredentialNFT(
  issuerSecretKey: string,
  ownerAddress: string,
  credentialType: string,
  claimHash: string,
  expiresAt: number,
  options?: { sponsorFees?: boolean }
): Promise<{ txHash: string; tokenId: number; sponsored: boolean }> {
  console.log(`[Stellar] Minting credential NFT:`);
  console.log(`  Owner: ${ownerAddress}`);
  console.log(`  Type: ${credentialType}`);
  console.log(`  Claim Hash: ${claimHash}`);
  console.log(`  Expires: ${new Date(expiresAt * 1000).toISOString()}`);
  console.log(`  Contract: ${CREDENTIAL_NFT_CONTRACT_ID}`);
  console.log(`  Fee Sponsored: ${options?.sponsorFees ?? false}`);

  // Verify account exists on testnet
  try {
    await axios.get(`${STELLAR_HORIZON_URL}/accounts/${ownerAddress}`);
  } catch {
    console.warn(`  Owner account not found on testnet — may need funding`);
  }

  // Check if fee sponsorship is requested and available
  let sponsored = false;
  if (options?.sponsorFees) {
    const sponsorStatus = await getSponsorStatus();
    sponsored = sponsorStatus.canSponsor;
    if (sponsored) {
      console.log(`  Fees will be sponsored by: ${sponsorStatus.address}`);
    }
  }

  // Return simulated result for development
  // In production, this builds and submits actual Soroban transaction
  const txHash = `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tokenId = Math.floor(Math.random() * 1000000);

  console.log(`  TX Hash: ${txHash}`);
  console.log(`  Token ID: ${tokenId}`);

  return { txHash, tokenId, sponsored };
}

export async function checkCredentialValidity(
  credentialId: number
): Promise<boolean> {
  // In production, this simulates a read-only Soroban contract call:
  // contract.call('is_valid', nativeToScVal(credentialId, { type: 'u64' }))
  //
  // For development, return true (credential is valid)
  console.log(`[Stellar] Checking credential validity: ${credentialId}`);

  if (!CREDENTIAL_NFT_CONTRACT_ID) {
    console.warn('  No contract deployed — returning true by default');
    return true;
  }

  return true;
}

export async function revokeCredential(
  issuerSecretKey: string,
  credentialId: number
): Promise<string> {
  // In production: Build and submit Soroban transaction calling 'revoke'
  console.log(`[Stellar] Revoking credential: ${credentialId}`);

  const txHash = `revoke_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log(`  TX Hash: ${txHash}`);

  return txHash;
}

export async function getAccount(address: string): Promise<any> {
  try {
    const response = await axios.get(`${STELLAR_HORIZON_URL}/accounts/${address}`);
    return response.data;
  } catch (err: any) {
    throw new Error(`Account not found: ${address}`);
  }
}
