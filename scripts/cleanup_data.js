// scripts/cleanup_data.js
// Truncate test data for tutors, students, assignments, and payment history.
// Run this before re‑seeding to ensure a clean state.

const db = require('../backend/db');

async function truncateTables() {
  try {
    console.log('🧹 Starting cleanup...');
    // Disable FK checks if needed (PostgreSQL handles order with CASCADE)
    await db.query(`TRUNCATE TABLE loyalty_payments RESTART IDENTITY CASCADE;`);
    await db.query(`TRUNCATE TABLE assigned_info RESTART IDENTITY CASCADE;`);
    await db.query(`TRUNCATE TABLE tutor_student_pairings RESTART IDENTITY CASCADE;`);
    // Remove tutor and student user records (role_id 4 = tutor, 3 = student)
    await db.query(`DELETE FROM users WHERE role_id IN (3, 4);`);
    console.log('✅ Cleanup completed.');
  } catch (err) {
    console.error('❌ Cleanup error:', err);
  } finally {
    process.exit(0);
  }
}

truncateTables();
