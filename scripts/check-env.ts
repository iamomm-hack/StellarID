import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

interface CheckResult {
  name: string;
  status: 'OK' | 'FAIL' | 'WARN' | 'MISSING';
  message: string;
}

async function checkPostgres(): Promise<CheckResult> {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    return { name: 'PostgreSQL', status: 'OK', message: `Connected at ${result.rows[0].now}` };
  } catch (err: any) {
    return { name: 'PostgreSQL', status: 'FAIL', message: err.message };
  }
}

async function checkRedis(): Promise<CheckResult> {
  try {
    // Simple TCP check
    const net = await import('net');
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(3000);
      client.connect(6379, 'localhost', () => {
        client.write('PING\r\n');
      });
      client.on('data', (data) => {
        client.destroy();
        if (data.toString().includes('PONG')) {
          resolve({ name: 'Redis', status: 'OK', message: 'PONG received' });
        } else {
          resolve({ name: 'Redis', status: 'FAIL', message: 'Unexpected response' });
        }
      });
      client.on('error', (err) => {
        resolve({ name: 'Redis', status: 'FAIL', message: err.message });
      });
      client.on('timeout', () => {
        client.destroy();
        resolve({ name: 'Redis', status: 'FAIL', message: 'Connection timeout' });
      });
    });
  } catch (err: any) {
    return { name: 'Redis', status: 'FAIL', message: err.message };
  }
}

async function checkStellar(): Promise<CheckResult> {
  try {
    const url = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const response = await axios.get(url, { timeout: 5000 });
    return { name: 'Stellar Testnet', status: 'OK', message: `Network version: ${response.data.network_passphrase || 'connected'}` };
  } catch (err: any) {
    return { name: 'Stellar Testnet', status: 'FAIL', message: err.message };
  }
}

function checkEnvVar(name: string, warnLength?: number): CheckResult {
  const value = process.env[name];
  if (!value || value.includes('your_') || value.includes('_here')) {
    return { name, status: 'MISSING', message: 'Not configured' };
  }
  if (warnLength && value.length < warnLength) {
    return { name, status: 'WARN', message: `Set but only ${value.length} chars (recommend ≥${warnLength})` };
  }
  return { name, status: 'OK', message: 'Configured' };
}

function checkCircuits(): CheckResult {
  const wasmPath = path.join(__dirname, '../frontend/public/circuits/age_check.wasm');
  if (fs.existsSync(wasmPath)) {
    return { name: 'ZK Circuits', status: 'OK', message: 'age_check.wasm found' };
  }
  return { name: 'ZK Circuits', status: 'MISSING', message: 'Run: make compile' };
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   StellarID Environment Check        ║');
  console.log('╚══════════════════════════════════════╝\n');

  const checks: CheckResult[] = [];

  // Infrastructure
  checks.push(await checkPostgres());
  checks.push(await checkRedis());
  checks.push(await checkStellar());

  // Environment variables
  checks.push(checkEnvVar('CREDENTIAL_NFT_CONTRACT_ID'));
  checks.push(checkEnvVar('REVOCATION_CONTRACT_ID'));
  checks.push(checkEnvVar('DISCLOSURE_CONTRACT_ID'));
  checks.push(checkEnvVar('JWT_SECRET', 32));
  checks.push(checkEnvVar('GITHUB_CLIENT_ID'));

  // Circuits
  checks.push(checkCircuits());

  // Print results
  let hasFailure = false;
  for (const check of checks) {
    const icon =
      check.status === 'OK' ? '✓' :
      check.status === 'WARN' ? '⚠' :
      check.status === 'MISSING' ? '○' : '✗';
    const color =
      check.status === 'OK' ? '\x1b[32m' :
      check.status === 'WARN' ? '\x1b[33m' :
      '\x1b[31m';

    console.log(`  ${color}${icon}\x1b[0m ${check.name.padEnd(30)} ${check.message}`);

    if (check.status === 'FAIL') hasFailure = true;
  }

  console.log('');

  if (hasFailure) {
    console.log('\x1b[31m  Some checks failed. Fix issues before deploying.\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m  All checks passed! Ready to go.\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
