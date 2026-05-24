import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query('SELECT id, name, stellar_address, verified FROM issuers');
    console.log('--- ISSUERS IN DB ---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('---------------------');
  } catch (err: any) {
    console.error('Error fetching issuers:', err.message);
  } finally {
    await client.end();
  }
}

main();
