const StellarSdk = require('stellar-sdk');
const axios = require('axios');

async function generate() {
  console.log("Generating new Stellar Testnet account for Fee Sponsorship...");
  const pair = StellarSdk.Keypair.random();
  
  console.log(`\nPublic Key (G...): ${pair.publicKey()}`);
  console.log(`Secret Key (S...): ${pair.secret()}`);
  
  console.log('\nFunding account with 10,000 test XLM via Friendbot...');
  
  try {
    await axios.get(`https://friendbot.stellar.org/?addr=${pair.publicKey()}`);
    console.log('✅ Account successfully funded and ready to use!');
    console.log('\nCopy the Secret Key above and paste it into your .env and Render!');
  } catch (error) {
    console.error('❌ Failed to fund account:', error.message);
  }
}

generate();
