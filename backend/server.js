const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server) or if origin is allowed or Vercel preview branch
    if (!origin || !process.env.FRONTEND_URL || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const devRoutes = require('./routes/devRoutes'); // Development route for manual billing
const initializeDatabase = require('./db/initDb');
const cronService = require('./services/cronService');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/admin', adminRoutes); // Support singular '/api/admin' paths as well
app.use('/api/dev', devRoutes); // Expose dev routes

app.get('/', (req, res) => {
  res.send('ISM Web App API Running...');
});

app.listen(PORT, async (err) => {
  if (err) {
    console.error(`❌ Failed to start server: ${err.message}`);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize Database Schema and Triggers
  try {
    await initializeDatabase();
  } catch (dbInitErr) {
    console.error('❌ Database schema initialization failed:', dbInitErr.message);
  }

  // Start daily automated billing background job
  try {
    cronService.startCronJob();
  } catch (cronErr) {
    console.error('❌ Failed to start background cron service:', cronErr.message);
  }

  // Verify database connectivity
  try {
    const result = await db.query('SELECT NOW()');
    console.log(`✅ Database connected successfully (${process.env.DB_NAME}) at ${result.rows[0].now}`);
  } catch (dbErr) {
    console.error('❌ Database connection failed:', dbErr.message);
  }
});
