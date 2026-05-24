const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const users = await pool.query('SELECT * FROM users');
  console.log('USERS:', users.rows);
  const credentials = await pool.query('SELECT * FROM credentials');
  console.log('CREDENTIALS:', credentials.rows);
  process.exit(0);
}

run().catch(console.error);
