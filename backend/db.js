const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
        ? false
        : { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
