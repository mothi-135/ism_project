const db = require('../db');
const createBaseTables = require('./createBaseTables');

async function initializeDatabase() {
  console.log('🔄 Initializing database schema updates...');
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 0. Bootstrap: Create all base tables in exact dependency order
    await createBaseTables(client);

    // 1. Create tutor_student_pairings table
    console.log('Creating table: tutor_student_pairings...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutor_student_pairings (
        id SERIAL PRIMARY KEY,
        t_id INT NOT NULL REFERENCES tutor_personal_info(t_id) ON DELETE CASCADE,
        s_id INT NOT NULL REFERENCES student_personal_info(s_id) ON DELETE CASCADE,
        local_admin_id INT REFERENCES users(user_id) ON DELETE SET NULL,
        monthly_fee NUMERIC NOT NULL,
        joining_date DATE DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE (t_id, s_id)
      );
    `);

    // 2. Create loyalty_payments table
    console.log('Creating table: loyalty_payments...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_payments (
        id SERIAL PRIMARY KEY,
        pairing_id INT NOT NULL REFERENCES tutor_student_pairings(id) ON DELETE CASCADE,
        amount_paid NUMERIC NOT NULL,
        billing_period_start DATE NOT NULL,
        billing_period_end DATE NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
        paid_at TIMESTAMP
      );
    `);

    // 3. Migrate existing assignments from assigned_info to tutor_student_pairings
    console.log('Migrating existing assignments to tutor_student_pairings...');
    await client.query(`
      INSERT INTO tutor_student_pairings (t_id, s_id, local_admin_id, monthly_fee, joining_date, is_active)
      SELECT 
        ai.t_id, 
        ai.s_id, 
        (
          SELECT u.user_id 
          FROM users u
          JOIN pincodes p ON u.location_id = p.location_id
          WHERE p.code_id = ai.pincode AND u.role_id = 2
          LIMIT 1
        ) as local_admin_id,
        ai.confirmed_fee,
        ai.join_date,
        TRUE
      FROM assigned_info ai
      ON CONFLICT (t_id, s_id) DO UPDATE
      SET local_admin_id = EXCLUDED.local_admin_id,
          monthly_fee = EXCLUDED.monthly_fee,
          joining_date = EXCLUDED.joining_date,
          is_active = TRUE;
    `);

    // 4. Create trigger to keep assigned_info and tutor_student_pairings in sync
    console.log('Creating sync trigger sync_assigned_to_pairings...');
    await client.query(`
      CREATE OR REPLACE FUNCTION sync_assigned_to_pairings()
      RETURNS TRIGGER AS $$
      DECLARE
          admin_id INT;
      BEGIN
          IF (TG_OP = 'DELETE') THEN
              UPDATE tutor_student_pairings
              SET is_active = FALSE
              WHERE t_id = OLD.t_id AND s_id = OLD.s_id;
              RETURN OLD;
          END IF;

          -- Resolve local admin for the pincode in assigned_info
          SELECT u.user_id INTO admin_id
          FROM users u
          JOIN pincodes p ON u.location_id = p.location_id
          WHERE p.code_id = NEW.pincode AND u.role_id = 2
          LIMIT 1;

          INSERT INTO tutor_student_pairings (t_id, s_id, local_admin_id, monthly_fee, joining_date, is_active)
          VALUES (NEW.t_id, NEW.s_id, admin_id, NEW.confirmed_fee, NEW.join_date, TRUE)
          ON CONFLICT (t_id, s_id) DO UPDATE
          SET local_admin_id = EXCLUDED.local_admin_id,
              monthly_fee = EXCLUDED.monthly_fee,
              joining_date = EXCLUDED.joining_date,
              is_active = TRUE;

          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_sync_assigned ON assigned_info;
    `);

    await client.query(`
      CREATE TRIGGER trigger_sync_assigned
      AFTER INSERT OR UPDATE OR DELETE ON assigned_info
      FOR EACH ROW EXECUTE FUNCTION sync_assigned_to_pairings();
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema initialized and trigger created successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize database schema:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = initializeDatabase;
