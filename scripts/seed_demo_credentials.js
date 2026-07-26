// scripts/seed_demo_credentials.js
// Standalone script to seed or update Demo Credentials into the database
require('dotenv').config({ path: require('path').resolve(__dirname, '../backend/.env') });
const db = require('../backend/db');

async function seedCredentials() {
  console.log('🌱 Seeding Demo Credentials into database...');
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Helper to upsert demo user safely
    async function upsertDemoUser(email, password, roleId, locationId) {
      const res = await client.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (res.rows.length > 0) {
        const userId = res.rows[0].user_id;
        await client.query('UPDATE users SET password = $1, role_id = $2, location_id = $3, is_active = TRUE WHERE user_id = $4', [password, roleId, locationId, userId]);
        return userId;
      } else {
        const insertRes = await client.query('INSERT INTO users (email, password, role_id, location_id, is_active) VALUES ($1, $2, $3, $4, TRUE) RETURNING user_id', [email, password, roleId, locationId]);
        return insertRes.rows[0].user_id;
      }
    }

    // 1. Global Admin: sravan@gmail.com / ism@123
    await upsertDemoUser('sravan@gmail.com', 'ism@123', 1, 1);
    console.log('✅ Global Admin seeded: sravan@gmail.com / ism@123');

    // 2. Local Admin: mothi@gmail.com / ism@123
    await upsertDemoUser('mothi@gmail.com', 'ism@123', 2, 1);
    console.log('✅ Local Admin seeded: mothi@gmail.com / ism@123');

    // 3. Student: student1@example.com / ism@123
    const sId = await upsertDemoUser('student1@example.com', 'ism@123', 3, 1);
    await client.query(`
      INSERT INTO student_personal_info (s_id, s_name, s_gender, s_grade, school_name, board, parent_name, phone, address, landmark)
      VALUES ($1, 'Demo Student One', 'Male', '10th', 'St. Johns High School', 'CBSE', 'Parent One', '9876543210', '123 Student Street, Naidupet', 'Near Clock Tower')
      ON CONFLICT (s_id) DO NOTHING;
    `, [sId]);
    console.log('✅ Student seeded: student1@example.com / ism@123');

    // 4. Tutor: tutor1@example.com / ism@123
    const tId = await upsertDemoUser('tutor1@example.com', 'ism@123', 4, 1);
    await client.query(`
      INSERT INTO tutor_personal_info (t_id, t_name, gender, qualification, experience_years, phone, address, landmark, loyalty_points, is_verified)
      VALUES ($1, 'Demo Tutor One', 'Female', 'M.Sc Mathematics', 5, '9123456789', '456 Tutor Avenue, Naidupet', 'Near Railway Station', 100, TRUE)
      ON CONFLICT (t_id) DO NOTHING;
    `, [tId]);
    console.log('✅ Tutor seeded: tutor1@example.com / ism@123');

    await client.query('COMMIT');
    console.log('🎉 All Demo Credentials seeded successfully!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed demo credentials:', err.message || err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedCredentials();
