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
      INSERT INTO student_personal_info (s_id, s_name, s_gender, s_grade, school_name, s_school_name, board, s_board, parent_name, phone, address, landmark)
      VALUES ($1, 'Demo Student One', 'Male', '10th', 'St. Johns High School', 'St. Johns High School', 'CBSE', 'CBSE', 'Parent One', '9876543210', '123 Student Street, Naidupet', 'Near Clock Tower')
      ON CONFLICT (s_id) DO UPDATE SET s_school_name = EXCLUDED.s_school_name, s_board = EXCLUDED.s_board;
    `, [sId]);
    await client.query(`
      INSERT INTO student_parent_info (s_id, father_name, father_mobile, father_occupation, mother_name, mother_mobile, mother_occupation)
      VALUES ($1, 'Parent One', '9876543210', 'Engineer', 'Mother One', '9876543211', 'Homemaker')
      ON CONFLICT (s_id) DO NOTHING;
    `, [sId]);
    console.log('✅ Student seeded: student1@example.com / ism@123');

    // 4. Tutor: tutor1@example.com / ism@123
    const tId = await upsertDemoUser('tutor1@example.com', 'ism@123', 4, 1);
    await client.query(`
      INSERT INTO tutor_personal_info (t_id, t_name, gender, t_gender, qualification, experience_years, phone, t_phone, address, landmark, loyalty_points, is_verified, t_caste, t_religion)
      VALUES ($1, 'Demo Tutor One', 'Female', 'Female', 'M.Sc Mathematics', 5, '9123456789', '9123456789', '456 Tutor Avenue, Naidupet', 'Near Railway Station', 100, TRUE, 'OBC', 'HINDU')
      ON CONFLICT (t_id) DO UPDATE SET t_gender = EXCLUDED.t_gender, t_phone = EXCLUDED.t_phone, t_caste = EXCLUDED.t_caste, t_religion = EXCLUDED.t_religion;
    `, [tId]);
    await client.query(`
      INSERT INTO tutor_education_info (t_id, tenth_school_name, tenth_cgpa, inter_stream, inter_clg_name, inter_cgpa, deg_name, deg_clg_name, deg_cpga, deg_cgpa, deg_passing_year, occupation, experience)
      VALUES ($1, 'ZPHS School', 9.5, 'MPC', 'Junior College', 9.2, 'M.Sc Mathematics', 'University', 8.5, 8.5, 2018, 'Teacher', '5 years')
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
