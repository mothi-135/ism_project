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
      pincode INT UNIQUE
    );
  `);

  // 4. Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role_id INT REFERENCES roles(role_id) ON DELETE SET NULL,
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
      board VARCHAR(50),
      parent_name VARCHAR(150),
      phone VARCHAR(20),
      address TEXT,
      landmark VARCHAR(150),
      aadhaar VARCHAR(20),
      caste VARCHAR(50),
      religion VARCHAR(50),
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
      tutor_gender VARCHAR(20)
    );
  `);

  // 7. Student Location Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_location_info (
      id SERIAL PRIMARY KEY,
      s_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      location_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      pincode INT
    );
  `);

  // 8. Student Time Slot
  await client.query(`
    CREATE TABLE IF NOT EXISTS student_time_slot (
      id SERIAL PRIMARY KEY,
      s_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      slot_id INT
    );
  `);

  // 9. Tutor Personal Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_personal_info (
      t_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      t_name VARCHAR(150) NOT NULL,
      gender VARCHAR(20),
      qualification VARCHAR(150),
      experience_years INT DEFAULT 0,
      phone VARCHAR(20),
      address TEXT,
      landmark VARCHAR(150),
      aadhaar VARCHAR(20),
      caste VARCHAR(50),
      religion VARCHAR(50),
      loyalty_points INT DEFAULT 0,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      end_grade VARCHAR(20)
    );
  `);

  // 11. Tutor Location Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_location_info (
      id SERIAL PRIMARY KEY,
      t_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      location_id INT REFERENCES locations(location_id) ON DELETE SET NULL,
      pincodes INT[]
    );
  `);

  // 12. Tutor Availability Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS tutor_availability_info (
      id SERIAL PRIMARY KEY,
      t_id INT REFERENCES users(user_id) ON DELETE CASCADE,
      day_id INT,
      slot_id INT,
      availability BOOLEAN DEFAULT TRUE
    );
  `);

  // 13. Assigned Info
  await client.query(`
    CREATE TABLE IF NOT EXISTS assigned_info (
      assign_id SERIAL PRIMARY KEY,
      t_id INT REFERENCES tutor_personal_info(t_id) ON DELETE CASCADE,
      s_id INT REFERENCES student_personal_info(s_id) ON DELETE CASCADE,
      confirmed_fee NUMERIC NOT NULL DEFAULT 0,
      join_date DATE DEFAULT CURRENT_DATE,
      pincode INT,
      UNIQUE (t_id, s_id)
    );
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
      paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ Base database schema verified and created successfully!');
}

module.exports = createBaseTables;
