const db = require('../db');

// Map DB role names to the lowercase role strings the frontend expects
const ROLE_MAP = {
  'GLOBAL ADMIN': 'globaladmin',
  'SUPER ADMIN': 'globaladmin',
  'GLOBALADMIN': 'globaladmin',
  'ADMIN': 'admin',
  'LOCAL ADMIN': 'admin',
  'TOWN ADMIN': 'admin',
  'STUDENT': 'student',
  'TUTOR': 'tutor',
};

const UserModel = {
  authenticate: async (email, password) => {
    // 1. Find user by email, joining roles and locations
    const userResult = await db.query(
      `SELECT u.user_id, u.email, u.password, u.role_id, u.location_id,
              r.role_name, l.location_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.role_id
       LEFT JOIN locations l ON u.location_id = l.location_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userResult.rows.length === 0) return null;

    const row = userResult.rows[0];

    // 2. Verify password (plain-text comparison for now)
    if (row.password !== password) return null;

    // 3. Map the DB role to the frontend role string
    const roleName = row.role_name ? row.role_name.toUpperCase() : '';
    const role = ROLE_MAP[roleName];
    if (!role) return null;

    // 4. Build the base user object
    const user = {
      id: row.user_id,
      email: row.email,
      role: role,
      town: row.location_name || null,
    };

    // 5. Resolve the display name based on role
    if (role === 'globaladmin') {
      user.name = 'Global Admin';
    } else if (role === 'admin') {
      // No admin_personal_info table exists; derive name from email
      user.name = row.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    } else if (role === 'tutor') {
      const tutorRes = await db.query(
        `SELECT t_name FROM tutor_personal_info WHERE t_id = $1`,
        [row.user_id]
      );
      user.name = tutorRes.rows.length > 0 ? tutorRes.rows[0].t_name : 'Tutor';
    } else if (role === 'student') {
      const studentRes = await db.query(
        `SELECT s_name FROM student_personal_info WHERE s_id = $1`,
        [row.user_id]
      );
      user.name = studentRes.rows.length > 0 ? studentRes.rows[0].s_name : 'Student';
    }

    return user;
  }
};

module.exports = UserModel;
