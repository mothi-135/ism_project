const db = require('../db');

function mapDbRowToAdmin(row) {
  // Derive a name from email if not present
  const derivedName = row.email.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: `A${String(row.id).padStart(3, '0')}`,
    dbId: row.id,
    name: derivedName,
    town: row.town || 'Naidupet',
    email: row.email,
    students: Number(row.student_count || 0),
    tutors: Number(row.tutor_count || 0),
    revenue: Number(row.revenue || 0),
    phone: `90000${String(row.id).padStart(5, '0')}`,
    joiningDate: row.joiningDate || new Date().toISOString(),
    roleLevel: row.role_id === 1 ? 'global_admin' : 'town_admin'
  };
}

const AdminModel = {
  findAll: async () => {
    // Query admins and calculate students, tutors, and revenue in their locations dynamically
    const query = `
      SELECT 
        u.user_id as id,
        u.email,
        u.role_id,
        u.created_at as "joiningDate",
        l.location_name as town,
        (SELECT COUNT(*) FROM users s_u 
         LEFT JOIN student_location_info sli ON s_u.user_id = sli.s_id 
         WHERE s_u.role_id = 3 AND sli.town_id = u.location_id) as student_count,
        (SELECT COUNT(*) FROM users t_u 
         LEFT JOIN tutor_location_info tli ON t_u.user_id = tli.t_id 
         WHERE t_u.role_id = 4 AND tli.town = u.location_id) as tutor_count,
        (SELECT COALESCE(SUM(ai.confirmed_fee), 0) FROM assigned_info ai
         LEFT JOIN student_location_info sli ON ai.s_id = sli.s_id
         WHERE sli.town_id = u.location_id) as revenue
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.location_id
      WHERE u.role_id IN (1, 2)
      ORDER BY u.user_id ASC
    `;
    const result = await db.query(query);
    return result.rows.map(mapDbRowToAdmin);
  },

  findById: async (id) => {
    const dbId = typeof id === 'string' && id.startsWith('A')
      ? parseInt(id.slice(1))
      : parseInt(id);

    const admins = await AdminModel.findAll();
    return admins.find(a => a.dbId === dbId) || null;
  },

  findByTown: async (town) => {
    const admins = await AdminModel.findAll();
    return admins.find(a => a.town.toLowerCase() === town.toLowerCase()) || null;
  }
};

module.exports = AdminModel;
