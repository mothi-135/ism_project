async function createBaseTables(client) {
  console.log('📦 Verifying and creating base database schema (Bootstrap Migration)...');

  // 1. Roles table
  await client.query(`
    CREATE TABLE IF NOT EXISTS roles (
      role_id SERIAL PRIMARY KEY,
      role_name VARCHAR(50) UNIQUE NOT NULL
    );
  `);

  // Seed default roles if empty
  await client.query(`
    INSERT INTO roles (role_id, role_name) VALUES 
      (1, 'Super Admin'),
      (2, 'Local Admin'),
      (3, 'Student'),
      (4, 'Tutor')
    ON CONFLICT (role_id) DO NOTHING;
  `);

  // 2. Locations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS locations (
      location_id SERIAL PRIMARY KEY,
      location_name VARCHAR(100) NOT NULL,
      city_name VARCHAR(100) DEFAULT 'Nellore'
    );
  `);

  // 3. Pincodes table
  await client.query(`
    CREATE TABLE IF NOT EXISTS pincodes (
      code_id SERIAL PRIMARY KEY,
      location_id INT REFERENCES locations(location_id) ON DELETE CASCADE,
      pincode VARCHAR(20) UNIQUE
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS pincodes 
      ALTER COLUMN pincode TYPE VARCHAR(20) USING pincode::VARCHAR;
  `);

  // 4. Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role_id INT REFERENCES roles(role_id) ON DELETE RESTRICT,
      location_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Student Personal Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_personal_info (
      s_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      s_name VARCHAR(150) NOT NULL,
      s_gender VARCHAR(20),
      s_grade VARCHAR(50),
      school_name VARCHAR(150),
      s_school_name VARCHAR(150),
      s_school_city VARCHAR(50),
      board VARCHAR(150),
      s_board VARCHAR(150),
      parent_name VARCHAR(150),
      phone VARCHAR(20),
      address TEXT,
      landmark VARCHAR(150),
      aadhaar VARCHAR(20),
      s_adhaar_num VARCHAR(20),
      caste VARCHAR(50),
      s_caste VARCHAR(50),
      religion VARCHAR(50),
      s_religion VARCHAR(50),
      father_name VARCHAR(150),
      father_phone VARCHAR(20),
      father_occupation VARCHAR(100),
      mother_name VARCHAR(150),
      mother_phone VARCHAR(20),
      mother_occupation VARCHAR(100),
      additional_requirements TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS student_personal_info 
      ADD COLUMN IF NOT EXISTS s_school_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS s_school_city VARCHAR(50),
      ADD COLUMN IF NOT EXISTS s_board VARCHAR(150),
      ADD COLUMN IF NOT EXISTS s_adhaar_num VARCHAR(20),
      ADD COLUMN IF NOT EXISTS s_caste VARCHAR(50),
      ADD COLUMN IF NOT EXISTS s_religion VARCHAR(50);
  `);

  // 5b. Student Parent Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_parent_info (
      s_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      father_name VARCHAR(150),
      father_mobile VARCHAR(20),
      father_occupation VARCHAR(100),
      mother_name VARCHAR(150),
      mother_mobile VARCHAR(20),
      mother_occupation VARCHAR(100)
    );
  `);

  // 6. Student Preferences
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_preferences (
      s_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      tel BOOLEAN DEFAULT FALSE,
      hindi BOOLEAN DEFAULT FALSE,
      eng BOOLEAN DEFAULT FALSE,
      math BOOLEAN DEFAULT FALSE,
      phy BOOLEAN DEFAULT FALSE,
      bio BOOLEAN DEFAULT FALSE,
      chem BOOLEAN DEFAULT FALSE,
      social BOOLEAN DEFAULT FALSE,
      tutor_gender VARCHAR(20),
      tutot_religion VARCHAR(50),
      tutor_religion VARCHAR(50),
      additional_requirements TEXT
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS student_preferences 
      ADD COLUMN IF NOT EXISTS additional_requirements TEXT,
      ADD COLUMN IF NOT EXISTS tutot_religion VARCHAR(50),
      ADD COLUMN IF NOT EXISTS tutor_religion VARCHAR(50);
  `);

  // 7. Student Location Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_location_info (
      id SERIAL PRIMARY KEY,
      s_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      location_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      town_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      s_address TEXT,
      landmark VARCHAR(150),
      pincode VARCHAR(20)
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS student_location_info 
      ADD COLUMN IF NOT EXISTS location_id INT,
      ADD COLUMN IF NOT EXISTS town_id INT,
      ADD COLUMN IF NOT EXISTS s_address TEXT,
      ADD COLUMN IF NOT EXISTS landmark VARCHAR(150),
      ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
  `);

  // 8. Student Time Slot
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_time_slot (
      id SERIAL PRIMARY KEY,
      s_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      day_id INT DEFAULT 1,
      slot_id INT
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS student_time_slot 
      ADD COLUMN IF NOT EXISTS day_id INT DEFAULT 1;
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_slot_unique ON student_time_slot (s_id, day_id, slot_id);
  `);

  // 9. Tutor Personal Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_personal_info (
      t_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      t_name VARCHAR(150) NOT NULL,
      gender VARCHAR(20),
      t_gender VARCHAR(20),
      qualification VARCHAR(150),
      experience_years INT DEFAULT 0,
      phone VARCHAR(20),
      t_phone VARCHAR(20),
      address TEXT,
      landmark VARCHAR(150),
      aadhaar VARCHAR(20),
      t_adhaar_num VARCHAR(20),
      caste VARCHAR(50),
      t_caste VARCHAR(50),
      religion VARCHAR(50),
      t_religion VARCHAR(50),
      loyalty_points INT DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS tutor_personal_info 
      ADD COLUMN IF NOT EXISTS t_gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS t_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS t_adhaar_num VARCHAR(20),
      ADD COLUMN IF NOT EXISTS t_caste VARCHAR(50),
      ADD COLUMN IF NOT EXISTS t_religion VARCHAR(50);
  `);

  // 9b. Tutor Education Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_education_info (
      t_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      tenth_school_name VARCHAR(150),
      tenth_cgpa NUMERIC,
      inter_stream VARCHAR(50),
      inter_clg_name VARCHAR(150),
      inter_cgpa NUMERIC,
      deg_name VARCHAR(150),
      deg_clg_name VARCHAR(150),
      deg_cpga NUMERIC,
      deg_cgpa NUMERIC,
      deg_passing_year INT,
      occupation VARCHAR(100),
      experience VARCHAR(50)
    );
  `);

  // 10. Tutor Preference Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_preference_info (
      t_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      tel BOOLEAN DEFAULT FALSE,
      hindi BOOLEAN DEFAULT FALSE,
      eng BOOLEAN DEFAULT FALSE,
      math BOOLEAN DEFAULT FALSE,
      phy BOOLEAN DEFAULT FALSE,
      bio BOOLEAN DEFAULT FALSE,
      chem BOOLEAN DEFAULT FALSE,
      social BOOLEAN DEFAULT FALSE,
      start_grade VARCHAR(20),
      end_grade VARCHAR(20),
      pincode1 VARCHAR(20),
      pincode2 VARCHAR(20),
      pincode3 VARCHAR(20)
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS tutor_preference_info 
      ADD COLUMN IF NOT EXISTS pincode1 VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pincode2 VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pincode3 VARCHAR(20);
  `);

  // 11. Tutor Location Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_location_info (
      id SERIAL PRIMARY KEY,
      t_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      location_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      town INT REFERENCES locations(location_id) ON DELETE SET NULL,
      full_address TEXT,
      landmark VARCHAR(150),
      pincode VARCHAR(20),
      pincodes INT[]
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS tutor_location_info 
      ADD COLUMN IF NOT EXISTS location_id INT,
      ADD COLUMN IF NOT EXISTS town INT,
      ADD COLUMN IF NOT EXISTS full_address TEXT,
      ADD COLUMN IF NOT EXISTS landmark VARCHAR(150),
      ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
      ADD COLUMN IF NOT EXISTS pincodes INT[];
  `);

  // 12. Tutor Availability Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_availability_info (
      id SERIAL PRIMARY KEY,
      t_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      day_id INT,
      slot_id INT,
      availability VARCHAR(50) DEFAULT 'AVAILABLE'
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS tutor_availability_info 
      ALTER COLUMN availability TYPE VARCHAR(50) USING (CASE WHEN availability=true OR availability='true' OR availability='AVAILABLE' THEN 'AVAILABLE' ELSE 'UNAVAILABLE' END);
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tutor_avail_unique ON tutor_availability_info (t_id, day_id, slot_id);
  `);

  // 13. Assigned Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS assigned_info (
      assign_id SERIAL PRIMARY KEY,
      d_id SERIAL,
      t_id INT REFERENCES tutor_personal_info(t_id) ON DELETE CASCADE,
      s_id INT REFERENCES student_personal_info(s_id) ON DELETE CASCADE,
      start_slot INT DEFAULT 3,
      end_slot INT DEFAULT 4,
      confirmed_fee NUMERIC NOT NULL DEFAULT 0,
      join_date DATE DEFAULT CURRENT_DATE,
      pincode INT,
      status VARCHAR(20) DEFAULT 'active',
      UNIQUE (t_id, s_id)
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS assigned_info 
      ADD COLUMN IF NOT EXISTS d_id INT,
      ADD COLUMN IF NOT EXISTS start_slot INT DEFAULT 3,
      ADD COLUMN IF NOT EXISTS end_slot INT DEFAULT 4,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
  `);

  // 14. Payment History
  await client.query(`
    CREATE TABLE IF NOT EXISTS payement_history (
      id SERIAL PRIMARY KEY,
      s_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      amount_paid NUMERIC NOT NULL DEFAULT 0,
      billing_period_start DATE NOT NULL,
      billing_period_end DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'paid',
      payment_status VARCHAR(20) DEFAULT 'PAID',
      pairng_id INT,
      pairing_id INT,
      paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await client.query(`
    ALTER TABLE IF EXISTS payement_history 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PAID',
      ADD COLUMN IF NOT EXISTS pairng_id INT,
      ADD COLUMN IF NOT EXISTS pairing_id INT;
  `);

  // 15. Seed default locations if empty
  await client.query(`
    INSERT INTO locations (location_id, location_name, city_name) VALUES 
      (1, 'Naidupet', 'Nellore'),
      (2, 'Sullurupet', 'Nellore'),
      (3, 'Gudur', 'Nellore'),
      (4, 'Venkatagiri', 'Nellore')
    ON CONFLICT (location_id) DO NOTHING;
  `);

  // 16. Seed Demo Credentials (Global Admin, Local Admin, Student, Tutor)
  console.log('🌱 Seeding Demo Credentials into users and personal info tables...');

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

  // 2. Local Admin: mothi@gmail.com / ism@123
  await upsertDemoUser('mothi@gmail.com', 'ism@123', 2, 1);

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

  console.log('✅ Base database schema and Demo Credentials verified and created successfully!');
}

module.exports = createBaseTables;
