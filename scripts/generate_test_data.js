// generate_test_data.js
// This script creates 20 tutor records and 20 student records using the existing models.
// It aims to cover a variety of edge cases: different towns, grades, subjects, weak subjects, slots, etc.
// Run with: node generate_test_data.js (ensure the server is running or DB is accessible)

const StudentModel = require('../backend/models/StudentModel');
const TutorModel = require('../backend/models/TutorModel');

// Utility helpers
const randomChoice = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => arr.sort(() => Math.random() - 0.5);

// Sample data pools
const towns = ['naidupet', 'sullurupet', 'tirupati', 'nellore', 'kadapa'];
const grades = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const subjects = ['Telugu', 'Hindi', 'English', 'Mathematics', 'Physics', 'Biology', 'Chemistry', 'Social Studies'];
const weakSubjectsPool = subjects; // any subset
const slots = ['5:30 am', '5:30 pm', '7:30 pm'];
const genders = ['Male', 'Female', 'Other'];
const prefGenders = ['Male', 'Female', 'No Preference'];
const religions = ['HINDU', 'MUSLIM', 'CHRISTIAN'];
const castes = ['OBC', 'SC', 'ST', 'GENERAL'];

// Generate diverse student data
async function generateStudents() {
  for (let i = 1; i <= 20; i++) {
    const town = randomChoice(towns);
    const grade = randomChoice(grades);
    const gender = randomChoice(genders);
    const weakSubs = shuffle(subjects).slice(0, Math.floor(Math.random() * subjects.length)); // 0..7 weak subjects
    const slotSelection = shuffle(slots).slice(0, Math.floor(Math.random() * slots.length) + 1);
    const preferredGender = randomChoice(prefGenders);
    const studentData = {
      name: `Student${i}`,
      email: `student${i}@example.com`,
      town,
      grade,
      gender,
      weakSubjects: weakSubs,
      slots: slotSelection,
      preferredGender,
      // fill optional fields with random but valid values
      pincode: 500001 + i,
      address: `${i} Main St, ${town}`,
      landmark: `Near landmark ${i}`,
      school: `School ${i}`,
      board: randomChoice(['CBSE', 'ICSE', 'STATE'])
    };
    try {
      const created = await StudentModel.create(studentData);
      console.log(`Created student ${created.id}`);
    } catch (err) {
      console.error('Error creating student', i, err.message);
    }
  }
}

// Generate diverse tutor data
async function generateTutors() {
  for (let i = 1; i <= 20; i++) {
    const town = randomChoice(towns);
    const gender = randomChoice(genders);
    const subjectsOffered = shuffle(subjects).slice(0, Math.floor(Math.random() * subjects.length) + 1);
    const availability = {};
    // Randomly assign availability for a few days
    const days = Object.keys({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 });
    const selectedDays = shuffle(days).slice(0, Math.floor(Math.random() * days.length) + 1);
    selectedDays.forEach(day => {
      const daySlots = shuffle(slots).slice(0, Math.floor(Math.random() * slots.length) + 1);
      availability[day] = daySlots;
    });
    const gradesRange = `${randomChoice(['1st','2nd','3rd','4th','5th'])} to ${randomChoice(['6th','7th','8th','9th','10th'])}`;
    const tutorData = {
      name: `Tutor${i}`,
      email: `tutor${i}@example.com`,
      town,
      gender,
      subjects: subjectsOffered,
      availability,
      grades: gradesRange,
      // optional fields
      religion: randomChoice(religions),
      caste: randomChoice(castes),
      phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      address: `${i} Tutor Lane, ${town}`,
      landmark: `Landmark ${i}`,
      pincodes: [500001 + i, 500002 + i]
    };
    try {
      const created = await TutorModel.create(tutorData);
      console.log(`Created tutor ${created.id}`);
    } catch (err) {
      console.error('Error creating tutor', i, err.message);
    }
  }
}

(async () => {
  console.log('Seeding 20 students...');
  await generateStudents();
  console.log('Seeding 20 tutors...');
  await generateTutors();
  console.log('Data generation complete.');
  process.exit(0);
})();
