const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(poolConfig);

// Handle idle client errors so serverless/cloud disconnects (like Neon timeouts) don't crash the server
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL/Neon client:', err.message || err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
