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

exports.assignTutor = async (req, res) => {
  const { studentId, tutorId } = req.body;
  try {
    const student = await StudentModel.findById(studentId);
    const tutor = await TutorModel.findById(tutorId);
    
    if (!student || !tutor) return res.status(404).json({ message: 'Student or Tutor not found' });
    
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

