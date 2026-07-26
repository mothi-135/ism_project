// scripts/export_test_data.js
// Queries the DB for all tutors and students and writes a markdown report.
// The report is saved as `artifacts/test_data_overview.md`.

const fs = require('fs');
const path = require('path');
const db = require('../backend/db');

async function fetchStudents() {
  const res = await db.query(`SELECT u.user_id as id, spi.s_name as name, u.email, l.location_name as town,
    spi.s_grade as grade, spi.s_gender as gender,
    ARRAY(SELECT sts2.slot_id FROM student_time_slot sts2 WHERE sts2.s_id = u.user_id) as slot_ids,
    sp.tel, sp.hindi, sp.eng, sp.math, sp.phy, sp.bio, sp.chem, sp.social,
    sp.tutor_gender as preferred_gender

    FROM users u
    LEFT JOIN student_personal_info spi ON u.user_id = spi.s_id
    LEFT JOIN locations l ON u.location_id = l.location_id
    LEFT JOIN student_preferences sp ON u.user_id = sp.s_id
    WHERE u.role_id = 3
    ORDER BY u.user_id ASC`);
  return res.rows;
}

async function fetchTutors() {
  const res = await db.query(`SELECT u.user_id as id, tpi.t_name as name, u.email, l.location_name as town,
    tpre.tel, tpre.hindi, tpre.eng, tpre.math, tpre.phy, tpre.bio, tpre.chem, tpre.social,
    tpre.start_grade, tpre.end_grade,
    ARRAY(SELECT slot_id FROM tutor_availability_info WHERE t_id = u.user_id) as slot_ids
    FROM users u
    LEFT JOIN tutor_personal_info tpi ON u.user_id = tpi.t_id
    LEFT JOIN locations l ON u.location_id = l.location_id
    LEFT JOIN tutor_preference_info tpre ON u.user_id = tpre.t_id
    WHERE u.role_id = 4
    ORDER BY u.user_id ASC`);
  return res.rows;
}

function formatWeakSubjects(row) {
  const subs = [];
  if (row.tel) subs.push('Telugu');
  if (row.hindi) subs.push('Hindi');
  if (row.eng) subs.push('English');
  if (row.math) subs.push('Mathematics');
  if (row.phy) subs.push('Physics');
  if (row.bio) subs.push('Biology');
  if (row.chem) subs.push('Chemistry');
  if (row.social) subs.push('Social Studies');
  return subs.join(', ');
}

function gradeRange(start, end) {
  const ord = n => n===1?'1st':n===2?'2nd':n===3?'3rd':`${n}th`;
  return `${ord(start)} to ${ord(end)}`;
}

(async () => {
  const students = await fetchStudents();
  const tutors = await fetchTutors();
  const lines = [];
  lines.push('# Test Data Overview');
  lines.push('');
  lines.push('## Students');
  lines.push('| ID | Name | Email | Town | Grade | Gender | Weak Subjects | Preferred Tutor Gender | Slots |');
  lines.push('|----|------|-------|------|-------|--------|---------------|------------------------|-------|');
  students.forEach(s => {
    const weak = formatWeakSubjects(s);
    const pref = s.preferred_gender || 'No Preference';
    const slots = (s.slot_ids || []).join(', ');
    lines.push(`| S${String(s.id).padStart(3,'0')} | ${s.name} | ${s.email} | ${s.town} | ${s.grade} | ${s.gender} | ${weak || 'None'} | ${pref} | ${slots} |`);
  });
  lines.push('');
  lines.push('## Tutors');
  lines.push('| ID | Name | Email | Town | Subjects | Grades | Availability Slots |');
  lines.push('|----|------|-------|------|----------|--------|----------------------|');
  tutors.forEach(t => {
    const subjects = formatWeakSubjects(t);
    const grades = gradeRange(t.start_grade, t.end_grade);
    const slots = (t.slot_ids || []).join(', ');
    lines.push(`| T${String(t.id).padStart(3,'0')} | ${t.name} | ${t.email} | ${t.town} | ${subjects || 'None'} | ${grades} | ${slots} |`);
  });

  const outPath = path.resolve(__dirname, '..', 'artifacts', 'test_data_overview.md');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log('✅ Test data markdown written to', outPath);
  process.exit(0);
})();
