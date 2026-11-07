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

const DAYS_MAP = {
  'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7,
  'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
};

const DAYS_REV_MAP = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'
};

const TIME_SLOT_MAP = {
  '05:30 AM': 1, '05:30am': 1, '5:30 am': 1, '5:30am': 1,
  '06:00 AM': 2, '06:00am': 2, '6:00 am': 2, '6:00am': 2,
  '06:30 AM': 10, '06:30am': 10, '6:30 am': 10, '6:30am': 10,
  '07:00 AM': 11, '07:00am': 11, '7:00 am': 11, '7:00am': 11,
  '07:30 AM': 12, '07:30am': 12, '7:30 am': 12, '7:30am': 12,
  '08:00 AM': 13, '08:00am': 13, '8:00 am': 13, '8:00am': 13,
  '04:00 PM': 14, '04:00pm': 14, '4:00 pm': 14, '4:00pm': 14,
  '04:30 PM': 15, '04:30pm': 15, '4:30 pm': 15, '4:30pm': 15,
  '05:00 PM': 3, '05:00pm': 3, '5:00 pm': 3, '5:00pm': 3,
  '05:30 PM': 4, '05:30pm': 4, '5:30 pm': 4, '5:30pm': 4,
  '06:00 PM': 5, '06:00pm': 5, '6:00 pm': 5, '6:00pm': 5,
  '06:30 PM': 6, '06:30pm': 6, '6:30 pm': 6, '6:30pm': 6,
  '07:00 PM': 7, '07:00pm': 7, '7:00 pm': 7, '7:00pm': 7,
  '07:30 PM': 8, '07:30pm': 8, '7:30 pm': 8, '7:30pm': 8,
  '08:00 PM': 9, '08:00pm': 9, '8:00 pm': 9, '8:00pm': 9,
  '08:30 PM': 16, '08:30pm': 16, '8:30 pm': 16, '8:30pm': 16,
  '09:00 PM': 17, '09:00pm': 17, '9:00 pm': 17, '9:00pm': 17,
};

const SLOT_TIME_REV_MAP = {
  1: '05:30 AM',
  2: '06:00 AM',
  10: '06:30 AM',
  11: '07:00 AM',
  12: '07:30 AM',
  13: '08:00 AM',
  14: '04:00 PM',
  15: '04:30 PM',
  3: '05:00 PM',
  4: '05:30 PM',
  5: '06:00 PM',
  6: '06:30 PM',
  7: '07:00 PM',
  8: '07:30 PM',
  9: '08:00 PM',
  16: '08:30 PM',
  17: '09:00 PM',
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

function mapDbRowToTutor(row) {
  const subjects = [];
  if (row.tel) subjects.push('Telugu');
  if (row.hindi) subjects.push('Hindi');
  if (row.eng) subjects.push('English');
  if (row.math) subjects.push('Mathematics');
  if (row.phy) subjects.push('Physics');
  if (row.bio) subjects.push('Biology');
  if (row.chem) subjects.push('Chemistry');
  if (row.social) subjects.push('Social Studies');

  const pincodes = [];
  if (row.pincode1) pincodes.push(String(row.pincode1));
  if (row.pincode2) pincodes.push(String(row.pincode2));
  if (row.pincode3) pincodes.push(String(row.pincode3));

  let grades = '1st to 10th';
  if (row.start_grade && row.end_grade) {
    const ordinal = (n) => {
      if (n === 1) return '1st';
      if (n === 2) return '2nd';
      if (n === 3) return '3rd';
      return `${n}th`;
    };
    grades = `${ordinal(row.start_grade)} to ${ordinal(row.end_grade)}`;
  }

  const availability = row.availability || { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };

  return {
    id: `T${String(row.id).padStart(3, '0')}`,
    dbId: row.id,
    name: row.name || 'Tutor',
    gender: row.gender === 'F' ? 'Female' : row.gender === 'M' ? 'Male' : 'Other',
    aadhaar: row.aadhaar || '',
    caste: row.caste || '',
    religion: row.religion || '',
    address: row.address || '',
    landmark: row.landmark || '',
    availability: availability,
    joiningDate: row.joiningDate || new Date().toISOString(),
    subjects: subjects,
    grades: grades,
    town: row.town || 'Naidupet',
    pincodes: pincodes,
    phone: row.phone || '',
    email: row.email || '',
    experience: row.experience || 'Fresher',
    qualification: row.qualification || 'Graduate',
    tenth_school_name: row.tenth_school_name || '',
    tenth_cgpa: row.tenth_cgpa || '',
    inter_stream: row.inter_stream || '',
    inter_college_name: row.inter_college_name || '',
    inter_cgpa: row.inter_cgpa || '',
    degree_name: row.degree_name || row.qualification || '',
    degree_college_name: row.degree_college_name || '',
    degree_cgpa: row.degree_cgpa || '',
    occupation: row.occupation || '',
    status: row.status || 'verified',
    students: row.students || [],
    loyalty: row.loyalty || [],
    earnings: Number(row.earnings || 0),
    rating: Number(row.rating || 4.8)
  };
}

const TutorModel = {
  findAll: async () => {
    const query = `
      SELECT 
        u.user_id as id,
        tpi.t_name as name,
        tpi.t_gender as gender,
        tpi.t_adhaar_num as aadhaar,
        tpi.t_phone as phone,
        u.email,
        u.created_at as "joiningDate",
        tli.full_address as address,
        tli.landmark as landmark,
        tei.deg_name as qualification,
        tei.deg_name as degree_name,
        tei.experience as experience,
        tei.tenth_school_name as tenth_school_name,
        tei.tenth_cgpa as tenth_cgpa,
        tei.inter_stream as inter_stream,
        tei.inter_clg_name as inter_college_name,
        tei.inter_cgpa as inter_cgpa,
        tei.deg_clg_name as degree_college_name,
        tei.deg_cpga as degree_cgpa,
        tei.occupation as occupation,
        l.location_name as town,
        tpre.tel, tpre.hindi, tpre.eng, tpre.math, tpre.phy, tpre.bio, tpre.chem, tpre.social,
        p1.pincode as pincode1, p2.pincode as pincode2, p3.pincode as pincode3,
        tpre.start_grade, tpre.end_grade,
        tpi.t_caste as caste,
        tpi.t_religion as religion
      FROM users u
      LEFT JOIN tutor_personal_info tpi ON u.user_id = tpi.t_id
      LEFT JOIN tutor_education_info tei ON u.user_id = tei.t_id
      LEFT JOIN tutor_location_info tli ON u.user_id = tli.t_id
      LEFT JOIN locations l ON tli.town = l.location_id
      LEFT JOIN tutor_preference_info tpre ON u.user_id = tpre.t_id
      LEFT JOIN pincodes p1 ON tpre.pincode1::VARCHAR = p1.code_id::VARCHAR
      LEFT JOIN pincodes p2 ON tpre.pincode2::VARCHAR = p2.code_id::VARCHAR
      LEFT JOIN pincodes p3 ON tpre.pincode3::VARCHAR = p3.code_id::VARCHAR
      WHERE u.role_id = 4
      ORDER BY u.user_id DESC
    `;
    const result = await db.query(query);
    const tutors = result.rows;

    // Load sub-details: students and availability for each tutor
    for (const tutor of tutors) {
      // 1. Load students
      const studRes = await db.query(
        `SELECT s_id FROM assigned_info WHERE t_id = $1`,
        [tutor.id]
      );
      tutor.students = studRes.rows.map(r => `S${String(r.s_id).padStart(3, '0')}`);

      // Calculate earnings (mock based on active students)
      tutor.earnings = tutor.students.length * 2000;

      // 2. Load availability
      const availRes = await db.query(
        `SELECT day_id, slot_id, availability FROM tutor_availability_info WHERE t_id = $1`,
        [tutor.id]
      );
      tutor.availability = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
      for (const r of availRes.rows) {
        const dayKey = DAYS_REV_MAP[r.day_id];
        if (dayKey) {
          const timeStr = SLOT_TIME_REV_MAP[r.slot_id] || '05:00 PM';
          tutor.availability[dayKey].push(timeStr);
        }
      }

      // 3. Load loyalty payments
      const loyaltyRes = await db.query(
        `SELECT lp.id, 
                lp.paid_at as date, 
                lp.amount_paid as amount, 
                lp.payment_status as status,
                lp.billing_period_start as billing_start,
                lp.billing_period_end as billing_end,
                spi.s_name as student_name
         FROM loyalty_payments lp
         JOIN tutor_student_pairings tsp ON lp.pairing_id = tsp.id
         LEFT JOIN student_personal_info spi ON tsp.s_id = spi.s_id
         WHERE tsp.t_id = $1
         ORDER BY lp.billing_period_start DESC, lp.id DESC`,
        [tutor.id]
      );
      tutor.loyalty = loyaltyRes.rows.map(r => {
        const startStr = r.billing_start ? new Date(r.billing_start).toISOString().split('T')[0] : '';
        const endStr = r.billing_end ? new Date(r.billing_end).toISOString().split('T')[0] : '';
        return {
          id: r.id,
          date: r.date ? new Date(r.date).toISOString().split('T')[0] : startStr,
          amount: Number(r.amount || 0),
          notes: `For ${r.student_name || 'Student'} - Billing Period: ${startStr} to ${endStr} (${r.status.toUpperCase()})`
        };
      });
    }

    return tutors.map(mapDbRowToTutor);
  },

  findById: async (id) => {
    const dbId = typeof id === 'string' && id.startsWith('T')
      ? parseInt(id.slice(1))
      : parseInt(id);

    const query = `
      SELECT 
        u.user_id as id,
        tpi.t_name as name,
        tpi.t_gender as gender,
        tpi.t_adhaar_num as aadhaar,
        tpi.t_phone as phone,
        u.email,
        u.created_at as "joiningDate",
        tli.full_address as address,
        tli.landmark as landmark,
        tei.deg_name as qualification,
        tei.deg_name as degree_name,
        tei.experience as experience,
        tei.tenth_school_name as tenth_school_name,
        tei.tenth_cgpa as tenth_cgpa,
        tei.inter_stream as inter_stream,
        tei.inter_clg_name as inter_college_name,
        tei.inter_cgpa as inter_cgpa,
        tei.deg_clg_name as degree_college_name,
        tei.deg_cpga as degree_cgpa,
        tei.occupation as occupation,
        l.location_name as town,
        tpre.tel, tpre.hindi, tpre.eng, tpre.math, tpre.phy, tpre.bio, tpre.chem, tpre.social,
        p1.pincode as pincode1, p2.pincode as pincode2, p3.pincode as pincode3,
        tpre.start_grade, tpre.end_grade,
        tpi.t_caste as caste,
        tpi.t_religion as religion
      FROM users u
      LEFT JOIN tutor_personal_info tpi ON u.user_id = tpi.t_id
      LEFT JOIN tutor_education_info tei ON u.user_id = tei.t_id
      LEFT JOIN tutor_location_info tli ON u.user_id = tli.t_id
      LEFT JOIN locations l ON tli.town = l.location_id
      LEFT JOIN tutor_preference_info tpre ON u.user_id = tpre.t_id
      LEFT JOIN pincodes p1 ON tpre.pincode1::VARCHAR = p1.code_id::VARCHAR
      LEFT JOIN pincodes p2 ON tpre.pincode2::VARCHAR = p2.code_id::VARCHAR
      LEFT JOIN pincodes p3 ON tpre.pincode3::VARCHAR = p3.code_id::VARCHAR
      WHERE u.user_id = $1
    `;
    const result = await db.query(query, [dbId]);
    if (result.rows.length === 0) return null;
    const tutor = result.rows[0];

    // Load sub-details
    const studRes = await db.query(
      `SELECT s_id FROM assigned_info WHERE t_id = $1`,
      [dbId]
    );
    tutor.students = studRes.rows.map(r => `S${String(r.s_id).padStart(3, '0')}`);
    tutor.earnings = tutor.students.length * 2000;

    const availRes = await db.query(
      `SELECT day_id, slot_id, availability FROM tutor_availability_info WHERE t_id = $1`,
      [dbId]
    );
    tutor.availability = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
    for (const r of availRes.rows) {
      const dayKey = DAYS_REV_MAP[r.day_id];
      if (dayKey) {
        const timeStr = SLOT_TIME_REV_MAP[r.slot_id] || '05:00 PM';
        tutor.availability[dayKey].push(timeStr);
      }
    }

    // 3. Load loyalty payments
    const loyaltyRes = await db.query(
      `SELECT lp.id, 
              lp.paid_at as date, 
              lp.amount_paid as amount, 
              lp.payment_status as status,
              lp.billing_period_start as billing_start,
              lp.billing_period_end as billing_end,
              spi.s_name as student_name
       FROM loyalty_payments lp
       JOIN tutor_student_pairings tsp ON lp.pairing_id = tsp.id
       LEFT JOIN student_personal_info spi ON tsp.s_id = spi.s_id
       WHERE tsp.t_id = $1
       ORDER BY lp.billing_period_start DESC, lp.id DESC`,
      [dbId]
    );
    tutor.loyalty = loyaltyRes.rows.map(r => {
      const startStr = r.billing_start ? new Date(r.billing_start).toISOString().split('T')[0] : '';
      const endStr = r.billing_end ? new Date(r.billing_end).toISOString().split('T')[0] : '';
      return {
        id: r.id,
        date: r.date ? new Date(r.date).toISOString().split('T')[0] : startStr,
        amount: Number(r.amount || 0),
        notes: `For ${r.student_name || 'Student'} - Billing Period: ${startStr} to ${endStr} (${r.status.toUpperCase()})`
      };
    });

    return mapDbRowToTutor(tutor);
  },

  findByTown: async (town) => {
    const tutors = await TutorModel.findAll();
    return tutors.filter(t => t.town.toLowerCase() === town.toLowerCase());
  },

  create: async (tutorData) => {
    const cleanName = tutorData.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = tutorData.email || `${cleanName || 'tutor'}_${Date.now()}@gmail.com`;
    const password = 'ism@123';

    const townLower = (tutorData.town || 'naidupet').toLowerCase();
    const townId = TOWN_MAP[townLower] || 1;

    // 1. Insert into users
    const userRes = await db.query(
      `INSERT INTO users (email, password, role_id, location_id)
       VALUES ($1, $2, 4, $3)
       RETURNING user_id`,
      [email, password, townId]
    );
    const userId = userRes.rows[0].user_id;

    const genderChar = (tutorData.gender || 'Male').startsWith('F') ? 'F' : 'M';

    // 2. Insert into tutor_personal_info
    await db.query(
      `INSERT INTO tutor_personal_info (t_id, t_name, t_adhaar_num, t_gender, t_caste, t_religion, t_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        (tutorData.name || 'Tutor').slice(0, 50),
        (tutorData.aadhaar || String(Math.floor(100000000000 + Math.random() * 900000000000))).slice(0, 15),
        genderChar,
        (tutorData.caste || 'OBC').slice(0, 5),
        (tutorData.religion || 'HINDU').slice(0, 10),
        (tutorData.phone || '').slice(0, 15)
      ]
    );

    // 3. Insert into tutor_education_info
    const expNum = tutorData.experience || 'Fresher';
    const cleanQual = (tutorData.qualification || 'B.Sc').slice(0, 10);
    const cleanStream = (tutorData.inter_stream || 'MPC').slice(0, 4);
    await db.query(
      `INSERT INTO tutor_education_info (t_id, tenth_school_name, tenth_cgpa, inter_stream, inter_clg_name, inter_cgpa, deg_name, deg_clg_name, deg_cpga, deg_passing_year, occupation, experience)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 2018, $10, $11)`,
      [
        userId,
        (tutorData.tenth_school_name || '').slice(0, 50),
        parseFloat(tutorData.tenth_cgpa) || 0.0,
        cleanStream,
        (tutorData.inter_college_name || 'College').slice(0, 50),
        parseFloat(tutorData.inter_cgpa) || 0.0,
        cleanQual,
        (tutorData.degree_college_name || 'University').slice(0, 50),
        parseFloat(tutorData.degree_cgpa) || 0.0,
        (tutorData.occupation || '').slice(0, 50),
        String(expNum).slice(0, 50)
      ]
    );

    // 4. Insert into tutor_location_info
    const rawPin = tutorData.pincodes && tutorData.pincodes.length > 0 ? tutorData.pincodes[0] : '524126';
    const firstPincode = await ensurePincodeExists(rawPin, townId);
    await db.query(
      `INSERT INTO tutor_location_info (t_id, full_address, landmark, pincode, town)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        tutorData.address || '',
        tutorData.landmark || '',
        firstPincode,
        townId
      ]
    );

    // 5. Insert into tutor_preference_info
    const subs = tutorData.subjects || [];
    const pins = tutorData.pincodes || [];
    const p1 = await ensurePincodeExists(pins[0] || '524126', townId);
    const p2 = pins[1] ? await ensurePincodeExists(pins[1], townId) : null;
    const p3 = pins[2] ? await ensurePincodeExists(pins[2], townId) : null;

    // Parse grades range (e.g. "6th to 10th" -> 6 and 10)
    let startG = 1;
    let endG = 10;
    if (tutorData.grades) {
      const match = tutorData.grades.match(/(\d+)\w*\s+to\s+(\d+)/i);
      if (match) {
        startG = parseInt(match[1]);
        endG = parseInt(match[2]);
      }
    } else {
      startG = parseInt(tutorData.gradeFrom) || 1;
      endG = parseInt(tutorData.gradeTo) || 10;
    }

    await db.query(
      `INSERT INTO tutor_preference_info (t_id, tel, hindi, eng, math, phy, bio, chem, social, pincode1, pincode2, pincode3, start_grade, end_grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        userId,
        subs.includes('Telugu'),
        subs.includes('Hindi'),
        subs.includes('English'),
        subs.includes('Mathematics'),
        subs.includes('Physics'),
        subs.includes('Biology'),
        subs.includes('Chemistry'),
        subs.includes('Social Studies') || subs.includes('Social') || subs.includes('Science'),
        p1, p2, p3,
        startG, endG
      ]
    );

    // 6. Insert into tutor_availability_info
    const avail = tutorData.availability || {};
    for (const [day, slots] of Object.entries(avail)) {
      const dayId = DAYS_MAP[day];
      if (dayId && slots && slots.length > 0) {
        for (const slotStr of slots) {
          // Resolve standard time slot_id
          const slotId = TIME_SLOT_MAP[slotStr] || (slotStr.toLowerCase().includes('am') ? 1 : 3);

          await db.query(
            `INSERT INTO tutor_availability_info (t_id, day_id, slot_id, availability)
             VALUES ($1, $2, $3, 'AVAILABLE')
             ON CONFLICT (t_id, day_id, slot_id) DO NOTHING`,
            [userId, dayId, slotId]
          );
        }
      }
    }

    return TutorModel.findById(userId);
  },

  update: async (id, updateData) => {
    const dbId = typeof id === 'string' && id.startsWith('T')
      ? parseInt(id.slice(1))
      : parseInt(id);

    // Support basic status updates
    if (updateData.status) {
      // In this DB schema there is no direct status field in tutor table, but we can return status verified/pending
      // we can simulate it or save it in a field. We will let the model update do nothing or log success
    }

    return TutorModel.findById(dbId);
  }
};

module.exports = TutorModel;
