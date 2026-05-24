import pool from './src/db';

async function check() {
  try {
    const users = await pool.query('SELECT id, stellar_address, email, github_username FROM users');
    console.log('--- USERS ---');
    console.log(users.rows);

    const credentials = await pool.query('SELECT c.id, c.user_id, c.credential_type, c.nft_token_id, c.stellar_tx_hash FROM credentials c');
    console.log('--- CREDENTIALS ---');
    console.log(credentials.rows);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

check();
