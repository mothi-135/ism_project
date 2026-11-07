const TutorModel = require('../models/TutorModel');
const db = require('../db');

exports.getAllTutors = async (req, res) => {
  try {
    const town = req.query.town;
    let tutors;
    if (town) {
      tutors = await TutorModel.findByTown(town);
    } else {
      tutors = await TutorModel.findAll();
    }
    res.json(tutors);
  } catch (err) {
    console.error('Error fetching tutors in getAllTutors:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getTutorById = async (req, res) => {
  try {
    const tutor = await TutorModel.findById(req.params.id);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });
    res.json(tutor);
  } catch (err) {
    console.error('Error in getTutorById:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.registerTutor = async (req, res) => {
  try {
    const newTutor = await TutorModel.create(req.body);
    res.status(201).json(newTutor);
  } catch (err) {
    console.error('Error registering tutor:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateTutor = async (req, res) => {
  try {
    const updated = await TutorModel.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Tutor not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addLoyaltyPayment = async (req, res) => {
  const { studentId, date, amount, notes } = req.body;
  const tutorIdStr = req.params.id;

  try {
    const parseId = (idStr) => {
      if (typeof idStr === 'string') {
        const clean = idStr.trim();
        if (clean.startsWith('S') || clean.startsWith('T') || clean.startsWith('A')) {
          return parseInt(clean.slice(1));
        }
      }
      return parseInt(idStr);
    };

    const tId = parseId(tutorIdStr);
    const sId = parseId(studentId);

    if (isNaN(tId) || isNaN(sId)) {
      return res.status(400).json({ message: 'Invalid Tutor or Student ID.' });
    }

    const pairingRes = await db.query(
      'SELECT d_id FROM assigned_info WHERE t_id = $1 AND s_id = $2',
      [tId, sId]
    );

    if (pairingRes.rows.length === 0) {
      return res.status(400).json({ message: 'No active student-tutor assignment found for this pair.' });
    }

    const pairingId = pairingRes.rows[0].d_id;

    const dateObj = new Date(date || new Date());
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const billingStart = new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
    const billingEnd = new Date(Date.UTC(y, m + 1, 0)).toISOString().split('T')[0];

    await db.query(
      `INSERT INTO loyalty_payments (pairing_id, billing_period_start, billing_period_end, payment_status, paid_at, amount_paid)
       VALUES ($1, $2, $3, 'paid', $4, $5)`,
      [
        pairingId,
        billingStart,
        billingEnd,
        dateObj.toISOString().split('T')[0],
        amount || 0
      ]
    );

    res.status(201).json({ message: 'Loyalty payment recorded successfully!' });
  } catch (err) {
    console.error('Error adding loyalty payment:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
