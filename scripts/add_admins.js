// scripts/add_admins.js
// Inserts two town admin users (role_id = 2) for the towns 'Sullurpet' and 'Tirupati'.
// Run after the DB schema is initialized.

const db = require('../backend/db');
//

async function addAdmin(townName) {
  // Resolve location_id from locations table
  const locRes = await db.query('SELECT location_id FROM locations WHERE location_name ILIKE $1', [townName]);
  const locationId = locRes.rows.length > 0 ? locRes.rows[0].location_id : null;
  if (!locationId) {
    console.warn(`⚠️ Town '${townName}' not found in locations table. Skipping.`);
    return;
  }
  const email = `${townName.toLowerCase().replace(/\s+/g, '')}_admin@example.com`;
  const password = 'admin123'; // dev password, stored plain for simplicity

  // Insert admin user (role_id 2 = town_admin)
  await db.query(
    `INSERT INTO users (email, password, role_id, location_id)
     VALUES ($1, $2, 2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [email, password, locationId]
  );
  console.log(`✅ Added admin for ${townName}`);
}

(async () => {
  console.log('🔧 Adding town admins...');
  await addAdmin('Sullurpet');
  await addAdmin('Tirupati');
  console.log('✅ Admin insertion complete.');
  process.exit(0);
})();
