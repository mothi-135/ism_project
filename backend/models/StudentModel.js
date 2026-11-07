const db = require('../db');

// Map frontend towns to database location IDs
const TOWN_MAP = {
  'naidupet': 1,
  'naidupeta': 1,
  'sullurupet': 2,
  'sullurpeta': 2,
  'tirupati': 3,
  'tirupathi': 3,
  'nellore': 1,
  'kadapa': 1,
  'nandyal': 1,
  'proddatur': 1,
  'badvel': 1
};

// Returns the code_id from the pincodes table (FK target), NOT the pincode string
async function ensurePincodeExists(pincode, locationId) {
  const pinStr = String(pincode || '524126').trim().replace(/[^0-9]/g, '') || '524126';
  const res = await db.query('SELECT code_id FROM pincodes WHERE pincode = $1', [pinStr]);
  if (res.rows.length > 0) {
    return res.rows[0].code_id;
  }
  
  // If not found, insert it and return the new code_id
  const maxRes = await db.query('SELECT COALESCE(MAX(code_id), 0) as max_id FROM pincodes');
  const nextId = maxRes.rows[0].max_id + 1;
  await db.query(
    'INSERT INTO pincodes (code_id, pincode, location_id) VALUES ($1, $2, $3)',
    [nextId, pinStr, locationId]
  );
  return nextId;
}

function mapDbRowToStudent(row) {
  const weakSubjects = [];
  if (row.tel) weakSubjects.push('Telugu');
  if (row.hindi) weakSubjects.push('Hindi');
  if (row.eng) weakSubjects.push('English');
  if (row.math) weakSubjects.push('Mathematics');
  if (row.phy) weakSubjects.push('Physics');
  if (row.bio) weakSubjects.push('Biology');
  if (row.chem) weakSubjects.push('Chemistry');
  if (row.social) weakSubjects.push('Social Studies');

  // Format grade correctly (e.g. 9 -> "9th")
  let gradeStr = '9th';
  if (row.grade) {
    const rawGrade = String(row.grade).trim();
    if (/^\d+(st|nd|rd|th)$/i.test(rawGrade)) {
      gradeStr = rawGrade;
    } else {
      const gNum = parseInt(rawGrade);
      if (gNum === 1) gradeStr = '1st';
      else if (gNum === 2) gradeStr = '2nd';
      else if (gNum === 3) gradeStr = '3rd';
      else if (!isNaN(gNum)) gradeStr = `${gNum}th`;
      else gradeStr = rawGrade;
    }
  }

  // Determine slot string
  let slotsArray = [];
  if (row.slot_ids && row.slot_ids.length > 0) {
    if (row.slot_ids.includes(1)) slotsArray.push('5:30 am - 7:30 am');
    if (row.slot_ids.includes(4)) slotsArray.push('5:30 pm - 7:30 pm');
    else if (row.slot_ids.includes(3)) slotsArray.push('5:00 pm - 7:00 pm');
    if (row.slot_ids.includes(8)) slotsArray.push('7:30 pm - 9:00 pm');
  }
  const slotStr = slotsArray.length > 0 ? slotsArray.join(', ') : (row.slot_ids?.length ? 'Flexible Evening' : 'Unassigned');

  return {
    id: `S${String(row.id).padStart(3, '0')}`,
    dbId: row.id,
    name: row.name || 'Student',
    gender: row.gender === 'F' ? 'Female' : row.gender === 'M' ? 'Male' : (row.gender || 'Other'),
    aadhaar: row.aadhaar || '',
    schoolCity: row.schoolCity || '',
    academicYear: row.academicYear || '',
    caste: row.caste || '',
    religion: row.religion || '',
    fatherName: row.fatherName || row.parent || '',
    fatherPhone: row.fatherPhone || row.phone || '',
    fatherOccupation: row.fatherOccupation || '',
    motherName: row.motherName || '',
    motherPhone: row.motherPhone || '',
    motherOccupation: row.motherOccupation || '',
    landmark: row.landmark || '',
    pincode: String(row.pincode || ''),
    preferredGender: row.preferredGender || 'No Preference',
    slot: slotStr,
    slots: slotsArray,
    slot_ids: row.slot_ids || [],
    joiningDate: row.joiningDate || new Date().toISOString(),
    email: row.email || 'student@ism.com',
    grade: gradeStr,
    school: row.school || '',
    board: row.board || 'CBSE',
    additionalRequirements: row.additionalRequirements || '',
    weakSubjects: weakSubjects,
    town: row.town || 'Naidupet',
    tutor: row.tutor ? `T${String(row.tutor).padStart(3, '0')}` : null,
    fees: Number(row.fees || 2000),
    feesPaid: row.feesPaid !== undefined ? row.feesPaid : false,
    phone: row.fatherPhone || row.phone || '',
    parent: row.fatherName || row.parent || '',
    address: row.address || '',
    status: row.status || 'pending'
  };
}

const StudentModel = {
  findAll: async (month, year) => {
    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();
    const query = `
      SELECT 
        u.user_id as id,
        spi.s_name as name,
        spi.s_gender as gender,
        COALESCE(spi.s_adhaar_num, '') as aadhaar,
        COALESCE(spi.s_school_city, '') as "schoolCity",
        COALESCE(spi.s_academic_year, '') as "academicYear",
        COALESCE(spi.s_caste, '') as caste,
        COALESCE(spi.s_religion, '') as religion,
        COALESCE(s_par.father_name, '') as "fatherName",
        COALESCE(s_par.father_mobile, '') as "fatherPhone",
        COALESCE(s_par.father_occupation, '') as "fatherOccupation",
        COALESCE(s_par.mother_name, '') as "motherName",
        COALESCE(s_par.mother_mobile, '') as "motherPhone",
        COALESCE(s_par.mother_occupation, '') as "motherOccupation",
        COALESCE(sli.landmark, '') as landmark,
        p.pincode as pincode,
        sp.tutor_gender as "preferredGender",
        ARRAY(SELECT sts2.slot_id FROM student_time_slot sts2 WHERE sts2.s_id = u.user_id) as slot_ids,
        u.created_at as "joiningDate",
        u.email,
        spi.s_grade as grade,
        COALESCE(spi.s_school_name, '') as school,
        COALESCE(spi.s_board, '') as board,
        sp.additional_requirements as "additionalRequirements",
        l.location_name as town,
        ai.t_id as tutor,
        ai.confirmed_fee as fees,
        EXISTS (
          SELECT 1 FROM payement_history ph 
          WHERE ph.pairng_id = ai.d_id 
            AND EXTRACT(MONTH FROM ph.billing_period_start) = $1 
            AND EXTRACT(YEAR FROM ph.billing_period_start) = $2
            AND ph.payment_status = 'PAID'
        ) as "feesPaid",
        COALESCE(s_par.father_name, '') as parent,
        COALESCE(s_par.father_mobile, '') as phone,
        sli.s_address as address,
        sp.tel, sp.hindi, sp.eng, sp.math, sp.phy, sp.bio, sp.chem, sp.social,
        CASE WHEN ai.t_id IS NOT NULL THEN 'active' ELSE 'pending' END as status
      FROM users u
      LEFT JOIN student_personal_info spi ON u.user_id = spi.s_id
      LEFT JOIN student_parent_info s_par ON u.user_id = s_par.s_id
      LEFT JOIN student_location_info sli ON u.user_id = sli.s_id
      LEFT JOIN pincodes p ON sli.pincode::VARCHAR = p.code_id::VARCHAR
      LEFT JOIN locations l ON sli.town_id = l.location_id
      LEFT JOIN student_preferences sp ON u.user_id = sp.s_id
      LEFT JOIN assigned_info ai ON u.user_id = ai.s_id
      WHERE u.role_id = 3
      ORDER BY u.user_id DESC
    `;
    const result = await db.query(query, [m, y]);
    return result.rows.map(mapDbRowToStudent);
  },

  findById: async (id, month, year) => {
    // Check if ID is a formatted string S001 or raw integer
    const dbId = typeof id === 'string' && id.startsWith('S') 
      ? parseInt(id.slice(1)) 
      : parseInt(id);

    const m = month || (new Date().getMonth() + 1);
    const y = year || new Date().getFullYear();

    const query = `
      SELECT 
        u.user_id as id,
        spi.s_name as name,
        spi.s_gender as gender,
        COALESCE(spi.s_adhaar_num, '') as aadhaar,
        COALESCE(spi.s_school_city, '') as "schoolCity",
        COALESCE(spi.s_academic_year, '') as "academicYear",
        COALESCE(spi.s_caste, '') as caste,
        COALESCE(spi.s_religion, '') as religion,
        COALESCE(s_par.father_name, '') as "fatherName",
        COALESCE(s_par.father_mobile, '') as "fatherPhone",
        COALESCE(s_par.father_occupation, '') as "fatherOccupation",
        COALESCE(s_par.mother_name, '') as "motherName",
        COALESCE(s_par.mother_mobile, '') as "motherPhone",
        COALESCE(s_par.mother_occupation, '') as "motherOccupation",
        COALESCE(sli.landmark, '') as landmark,
        p.pincode as pincode,
        sp.tutor_gender as "preferredGender",
        ARRAY(SELECT sts2.slot_id FROM student_time_slot sts2 WHERE sts2.s_id = u.user_id) as slot_ids,
        u.created_at as "joiningDate",
        u.email,
        spi.s_grade as grade,
        COALESCE(spi.s_school_name, '') as school,
        COALESCE(spi.s_board, '') as board,
        sp.additional_requirements as "additionalRequirements",
        l.location_name as town,
        ai.t_id as tutor,
        ai.confirmed_fee as fees,
        EXISTS (
          SELECT 1 FROM payement_history ph 
          WHERE ph.pairng_id = ai.d_id 
            AND EXTRACT(MONTH FROM ph.billing_period_start) = $2 
            AND EXTRACT(YEAR FROM ph.billing_period_start) = $3
            AND ph.payment_status = 'PAID'
        ) as "feesPaid",
        COALESCE(s_par.father_name, '') as parent,
        COALESCE(s_par.father_mobile, '') as phone,
        sli.s_address as address,
        sp.tel, sp.hindi, sp.eng, sp.math, sp.phy, sp.bio, sp.chem, sp.social,
        CASE WHEN ai.t_id IS NOT NULL THEN 'active' ELSE 'pending' END as status
      FROM users u
      LEFT JOIN student_personal_info spi ON u.user_id = spi.s_id
      LEFT JOIN student_parent_info s_par ON u.user_id = s_par.s_id
      LEFT JOIN student_location_info sli ON u.user_id = sli.s_id
      LEFT JOIN pincodes p ON sli.pincode::VARCHAR = p.code_id::VARCHAR
      LEFT JOIN locations l ON sli.town_id = l.location_id
      LEFT JOIN student_preferences sp ON u.user_id = sp.s_id
      LEFT JOIN assigned_info ai ON u.user_id = ai.s_id
      WHERE u.user_id = $1
    `;
    const result = await db.query(query, [dbId, m, y]);
    if (result.rows.length === 0) return null;
    return mapDbRowToStudent(result.rows[0]);
  },

  findByTown: async (town, month, year) => {
    const students = await StudentModel.findAll(month, year);
    return students.filter(s => s.town.toLowerCase() === town.toLowerCase());
  },

  create: async (studentData) => {
    // Generate a default email and password if not provided
    const cleanName = studentData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = studentData.email || `${cleanName || 'student'}_${Date.now()}@gmail.com`;
    const password = 'ism@123';
    
    const townLower = (studentData.town || 'naidupet').toLowerCase();
    const townId = TOWN_MAP[townLower] || 1;

    // 1. Insert into users
    const userRes = await db.query(
      `INSERT INTO users (email, password, role_id, location_id)
       VALUES ($1, $2, 3, $3)
       RETURNING user_id`,
      [email, password, townId]
    );
    const userId = userRes.rows[0].user_id;

    // Parse grade (e.g. "9th" -> 9)
    const gradeVal = parseInt(studentData.grade) || 9;
    const genderChar = (studentData.gender || 'Male').startsWith('F') ? 'F' : 'M';

    // Safely process and truncate new fields to match VARCHAR bounds in database
    const cleanAadhaar = (studentData.aadhaar || String(Math.floor(100000000000 + Math.random() * 900000000000))).replace(/[^0-9]/g, '').slice(0, 15);
    const cleanSchoolCity = (studentData.schoolCity || studentData.town || 'Naidupet').slice(0, 50);
    const cleanCaste = (studentData.caste || 'OBC').slice(0, 5);
    const cleanReligion = (studentData.religion || 'HINDU').slice(0, 10);

    // 2. Insert into student_personal_info
    await db.query(
      `INSERT INTO student_personal_info (s_id, s_name, s_adhaar_num, s_gender, s_grade, s_school_name, s_school_city, s_caste, s_religion, s_board, s_academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        (studentData.name || 'Student').slice(0, 50),
        cleanAadhaar,
        genderChar,
        gradeVal,
        (studentData.school || '').slice(0, 50),
        cleanSchoolCity,
        cleanCaste,
        cleanReligion,
        (studentData.board || 'CBSE').slice(0, 50),
        (studentData.academicYear || '').slice(0, 20)
      ]
    );

    // 3. Insert into student_parent_info
    await db.query(
      `INSERT INTO student_parent_info (s_id, father_name, father_mobile, father_occupation, mother_name, mother_mobile, mother_occupation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        (studentData.fatherName || studentData.parent || 'Father').slice(0, 50),
        (studentData.fatherPhone || studentData.phone || '0000000000').slice(0, 10),
        (studentData.fatherOccupation || '').slice(0, 50),
        (studentData.motherName || 'Mother').slice(0, 50),
        (studentData.motherPhone || '').slice(0, 10),
        (studentData.motherOccupation || '').slice(0, 50)
      ]
    );

    // 4. Insert into student_location_info
    const pincodeVal = await ensurePincodeExists(studentData.pincode, townId);
    await db.query(
      `INSERT INTO student_location_info (s_id, s_address, landmark, town_id, pincode)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        studentData.address || '',
        studentData.landmark || '',
        townId,
        pincodeVal
      ]
    );

    // 5. Insert into student_preferences
    const wSubs = studentData.weakSubjects || [];
    const prefGenderChar = (studentData.preferredGender || 'No Preference').startsWith('M') ? 'M'
      : (studentData.preferredGender || 'No Preference').startsWith('F') ? 'F' : 'N';
    await db.query(
      `INSERT INTO student_preferences (s_id, tel, hindi, eng, math, phy, bio, chem, social, tutor_gender, tutot_religion, additional_requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        userId,
        wSubs.includes('Telugu'),
        wSubs.includes('Hindi'),
        wSubs.includes('English'),
        wSubs.includes('Mathematics'),
        wSubs.includes('Physics'),
        wSubs.includes('Biology'),
        wSubs.includes('Chemistry'),
        wSubs.includes('Social Studies') || wSubs.includes('Social'),
        prefGenderChar,
        'ANY',
        studentData.additionalRequirements || ''
      ]
    );

    // 6. Insert into student_time_slot
    const slotsToInsert = [];
    if (Array.isArray(studentData.slots) && studentData.slots.length > 0) {
      for (const slotStr of studentData.slots) {
        let slotId = 3; // default
        if (slotStr.includes('5:30 am')) slotId = 1;
        else if (slotStr.includes('5:30 pm')) slotId = 4;
        else if (slotStr.includes('7:30 pm')) slotId = 8;
        slotsToInsert.push(slotId);
      }
    } else {
      slotsToInsert.push(3); // default evening fallback
    }

    // Insert each selected slot for default day (Monday)
    for (const sid of new Set(slotsToInsert)) {
      await db.query(
        `INSERT INTO student_time_slot (s_id, day_id, slot_id)
         VALUES ($1, 1, $2) ON CONFLICT DO NOTHING`,
        [userId, sid]
      ).catch(e => {}); // Ignore duplicate constraint errors if any
    }

    return StudentModel.findById(userId);
  },

  update: async (id, updateData) => {
    const dbId = typeof id === 'string' && id.startsWith('S') 
      ? parseInt(id.slice(1)) 
      : parseInt(id);

    // Handle student-tutor assignment or basic updates
    if (updateData.tutor) {
      const tutorId = typeof updateData.tutor === 'string' && updateData.tutor.startsWith('T')
        ? parseInt(updateData.tutor.slice(1))
        : parseInt(updateData.tutor);

      // Check if assignment exists
      const existing = await db.query(
        `SELECT * FROM assigned_info WHERE s_id = $1`,
        [dbId]
      );

      if (existing.rows.length > 0) {
        await db.query(
          `UPDATE assigned_info 
           SET t_id = $1 
           WHERE s_id = $2`,
          [tutorId, dbId]
        );
      } else {
        // Look up a valid pincode code_id for the student's location
        const stuLoc = await db.query(
          `SELECT pincode FROM student_location_info WHERE s_id = $1`,
          [dbId]
        );
        const pincodeCodeId = stuLoc.rows.length > 0 ? stuLoc.rows[0].pincode : 1;

        await db.query(
          `INSERT INTO assigned_info (t_id, s_id, start_slot, end_slot, join_date, confirmed_fee, pincode)
           VALUES ($1, $2, 3, 4, CURRENT_DATE, 2000, $3)`,
          [tutorId, dbId, pincodeCodeId]
        );
      }
    }

    return StudentModel.findById(dbId);
  }
};

module.exports = StudentModel;
