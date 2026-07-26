require('dotenv').config();
const initializeDatabase = require('./db/initDb');

async function runMigration() {
  try {
    console.log('🚀 Running database migration against PostgreSQL...');
    await initializeDatabase();
    console.log('✅ Database migrations and schema initialization completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database migration failed:', err.message || err);
    process.exit(1);
  }
}

runMigration();
