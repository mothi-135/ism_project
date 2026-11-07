const AdminModel = require('../models/AdminModel');
const StudentModel = require('../models/StudentModel');
const TutorModel = require('../models/TutorModel');
const db = require('../db');

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await AdminModel.findAll();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAdminById = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notificationsRes = await db.query(
      `SELECT id, title, message, type, is_read, created_at 
       FROM admin_notifications 
       ORDER BY created_at DESC LIMIT 50`
    );
    res.json(notificationsRes.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

function getSlotBuckets(slotInput) {
  const buckets = new Set();
  if (!slotInput) return buckets;

  const items = Array.isArray(slotInput) ? slotInput : [slotInput];
  for (const item of items) {
    if (typeof item !== 'string' && typeof item !== 'number') continue;
    const str = String(item).toLowerCase().trim();
    if (!str || str === 'unassigned') continue;

    // Check full slot string names first
    if (str.includes('5:30 am - 7:30 am')) {
      buckets.add('morning');
    }
    if (str.includes('5:30 pm - 7:30 pm')) {
      buckets.add('evening_early');
    }
    if (str.includes('7:30 pm - 9:00 pm')) {
      buckets.add('evening_late');
    }

    // Check individual time chips (e.g. '05:30 AM', '06:00 PM', '07:30 PM')
    const timeMatch = str.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (timeMatch && !str.includes('-')) {
      let hr = parseInt(timeMatch[1], 10);
      const isPM = timeMatch[3].toLowerCase() === 'pm';
      if (isPM && hr < 12) hr += 12;
      if (!isPM && hr === 12) hr = 0;
      const minFromMidnight = hr * 60 + parseInt(timeMatch[2], 10);

      // Morning: 5:00 AM to 8:30 AM
      if (minFromMidnight >= 300 && minFromMidnight < 510) {
        buckets.add('morning');
      }
      // Early evening: 4:00 PM to 7:29 PM
      else if (minFromMidnight >= 960 && minFromMidnight < 1170) {
        buckets.add('evening_early');
      }
      // Late evening: 7:30 PM to 10:00 PM
      else if (minFromMidnight >= 1170 && minFromMidnight <= 1320) {
        buckets.add('evening_late');
      }
    }

    // Check slot ID numbers
    if (typeof item === 'number' || /^\d+$/.test(str)) {
      const num = parseInt(str, 10);
      if ([1, 2, 10, 11, 12, 13].includes(num)) buckets.add('morning');
      if ([3, 4, 5, 6, 7, 14, 15].includes(num)) buckets.add('evening_early');
      if ([8, 9, 16, 17].includes(num)) buckets.add('evening_late');
    }
  }

  if (buckets.size === 0 && items.length > 0) {
    items.forEach(it => {
      const s = String(it).trim().toLowerCase();
      if (s && s !== 'unassigned') buckets.add(s);
    });
  }

  return buckets;
}

function hasSlotConflict(bucketsA, bucketsB) {
  for (const b of bucketsA) {
    if (bucketsB.has(b)) return true;
  }
  return false;
}

exports.assignTutor = async (req, res) => {
  const { studentId, tutorId, selectedSlots } = req.body;
  try {
    const student = await StudentModel.findById(studentId);
    const tutor = await TutorModel.findById(tutorId);
    
    if (!student || !tutor) return res.status(404).json({ message: 'Student or Tutor not found' });

    // Validate that tutor is not already assigned to another student in the same time slot
    const assignedStudentIds = tutor.students || [];
    const targetBuckets = (selectedSlots && selectedSlots.length > 0)
      ? getSlotBuckets(selectedSlots)
      : getSlotBuckets(student.slot || student.slots || student.slot_ids);

    if (targetBuckets.size > 0) {
      for (const otherId of assignedStudentIds) {
        if (String(otherId) === String(studentId) || String(otherId) === String(student.id)) continue;
        const otherStudent = await StudentModel.findById(otherId);
        if (!otherStudent) continue;
        const otherBuckets = getSlotBuckets(otherStudent.slot || otherStudent.slots || otherStudent.slot_ids);
        if (hasSlotConflict(targetBuckets, otherBuckets)) {
          return res.status(400).json({
            message: 'assigning is not possible as tutor is already assigned to a student in that time slot'
          });
        }
      }
    }
    
    await StudentModel.update(studentId, { tutor: tutorId });
    
    if (!tutor.students.includes(studentId)) {
      await TutorModel.update(tutorId, { students: [...tutor.students, studentId] });
    }
    
    res.json({ message: 'Assigned successfully', studentId, tutorId });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmLoyaltyPayment = async (req, res) => {
  const paymentId = parseInt(req.params.id);
  const rawAdminId = req.headers['x-admin-id'] || req.body.adminId || req.query.adminId;

  if (isNaN(paymentId)) {
    return res.status(400).json({ message: 'Invalid payment statement ID.' });
  }

  const parseId = (idStr) => {
    if (typeof idStr === 'string') {
      const clean = idStr.trim();
      if (clean.startsWith('A') || clean.startsWith('U') || clean.startsWith('T') || clean.startsWith('S')) {
        return parseInt(clean.slice(1));
      }
    }
    return parseInt(idStr);
  };

  const adminId = parseId(rawAdminId);

  if (!adminId || isNaN(adminId)) {
    return res.status(400).json({ message: 'Admin ID (x-admin-id header or adminId body param) is required to confirm payment.' });
  }

  try {
    // 1. Verify that the user is an admin
    const adminUserRes = await db.query(
      'SELECT user_id, role_id, location_id FROM users WHERE user_id = $1',
      [adminId]
    );

    if (adminUserRes.rows.length === 0) {
      return res.status(404).json({ message: 'Admin user not found.' });
    }

    const adminUser = adminUserRes.rows[0];
    if (adminUser.role_id !== 1 && adminUser.role_id !== 2) {
      return res.status(403).json({ message: 'Access denied. User is not authorized to confirm payments.' });
    }

    // 2. Fetch the loyalty payment details
    const paymentRes = await db.query(
      `SELECT lp.id, lp.payment_status, tsp.local_admin_id 
       FROM loyalty_payments lp
       JOIN tutor_student_pairings tsp ON lp.pairing_id = tsp.id
       WHERE lp.id = $1`,
      [paymentId]
    );

    if (paymentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Loyalty payment statement not found.' });
    }

    const statement = paymentRes.rows[0];

    // 3. For local admin, enforce town/location jurisdiction
    if (adminUser.role_id === 2 && statement.local_admin_id !== adminUser.user_id) {
      return res.status(403).json({ message: 'Access denied. Local admin is not authorized to confirm payments for this town.' });
    }

    // 4. Update the payment status to 'paid'
    await db.query(
      `UPDATE loyalty_payments 
       SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [paymentId]
    );

    console.log(`[Admin API] ✅ Admin ${adminId} confirmed loyalty payment statement ID ${paymentId} as PAID.`);

    res.json({
      message: 'Loyalty payment statement confirmed successfully.',
      id: paymentId,
      status: 'paid'
    });

  } catch (err) {
    console.error('Error confirming loyalty payment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

