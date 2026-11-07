const StudentModel = require('../models/StudentModel');

exports.getAllStudents = async (req, res) => {
  try {
    const town = req.query.town;
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    let students;
    if (town) {
      students = await StudentModel.findByTown(town, month, year);
    } else {
      students = await StudentModel.findAll(month, year);
    }
    res.json(students);
  } catch (err) {
    console.error('Error fetching students in getAllStudents:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const student = await StudentModel.findById(req.params.id, month, year);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error('Error in getStudentById:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.registerStudent = async (req, res) => {
  try {
    const newStudent = await StudentModel.create(req.body);
    res.status(201).json(newStudent);
  } catch (err) {
    console.error('Error registering student:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const updated = await StudentModel.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Student not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
