const cron = require('node-cron');
const db = require('../db');

/**
 * Generates loyalty payment statements for active pairings.
 * This function is idempotent – it will not create duplicate pending rows
 * for the same pairing and billing period.
 * @param {Date|string} [refDate] - Optional reference date (defaults to today).
 * @returns {Promise<{processedCount:number, duplicateCount:number}>}
 */
async function checkAndGenerateLoyaltyFees(refDate = new Date()) {
  const dateObj = new Date(refDate);
  const day = dateObj.getDate();
  const dateStr = dateObj.toISOString().split('T')[0];

  console.log(`[Cron Job] 🕒 Running Loyalty Billing for ${dateStr} (day ${day})`);

  try {
    // 1. Fetch active pairings matching the day of the month
    const pairingsRes = await db.query(
      `SELECT id, t_id, s_id, monthly_fee, joining_date
       FROM tutor_student_pairings
       WHERE is_active = TRUE
         AND EXTRACT(DAY FROM joining_date) = $1`,
      [day]
    );
    const pairings = pairingsRes.rows;
    console.log(`[Cron Job] Found ${pairings.length} pairings for day ${day}.`);

    let processedCount = 0;
    let duplicateCount = 0;

    for (const pairing of pairings) {
      const monthlyFee = parseFloat(pairing.monthly_fee);
      const loyaltyFee = parseFloat((monthlyFee * 0.10).toFixed(2));

      // Billing window: current month
      const billingStart = new Date(dateObj);
      const billingEnd = new Date(billingStart);
      billingEnd.setMonth(billingEnd.getMonth() + 1);
      billingEnd.setDate(billingEnd.getDate() - 1);

      const startStr = billingStart.toISOString().split('T')[0];
      const endStr = billingEnd.toISOString().split('T')[0];

      // Insert with ON CONFLICT to avoid duplicates (requires a unique index on (pairing_id, billing_period_start))
      await db.query(
        `INSERT INTO loyalty_payments (pairing_id, amount_paid, billing_period_start, billing_period_end, payment_status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (pairing_id, billing_period_start) DO NOTHING`,
        [pairing.id, loyaltyFee, startStr, endStr]
      );

      // Verify insertion (optional)
      const checkRes = await db.query(
        `SELECT id FROM loyalty_payments WHERE pairing_id = $1 AND billing_period_start = $2`,
        [pairing.id, startStr]
      );
      if (checkRes.rows.length > 0) {
        console.log(`[Cron Job] ✅ Generated loyalty for pairing ${pairing.id} (Period ${startStr}-${endStr})`);
        processedCount++;
      } else {
        duplicateCount++;
        console.log(`[Cron Job] ⚠️ Duplicate skipped for pairing ${pairing.id}`);
      }
    }

    console.log(`[Cron Job] Finished. Processed: ${processedCount}, Duplicates/skipped: ${duplicateCount}`);
    return { processedCount, duplicateCount };
  } catch (err) {
    console.error(`[Cron Job] ❌ Error:`, err);
    throw err;
  }
}

/**
 * Automates annual grade increments for students based on their board.
 * CBSE/ICSE increment on April 1st.
 * AP State increment on June 1st.
 */
async function checkAndIncrementGrades(refDate = new Date()) {
  const dateObj = new Date(refDate);
  const month = dateObj.getMonth(); // 0-indexed (April is 3, June is 5)
  const day = dateObj.getDate();
  
  if (day !== 1) return; // Only run on the 1st of the month
  
  let boardsToUpdate = [];
  if (month === 3) {
    boardsToUpdate = ['CBSE', 'ICSE'];
  } else if (month === 5) {
    boardsToUpdate = ['AP State'];
  }
  
  if (boardsToUpdate.length === 0) return;
  
  console.log(`[Cron Job] 🕒 Running Annual Grade Increment for ${boardsToUpdate.join(', ')}`);
  
  try {
    // 1. Identify students transitioning to 12th grade or completing 12th grade
    const graduatingRes = await db.query(
      `SELECT s_id, s_name, s_grade 
       FROM student_personal_info 
       WHERE s_board = ANY($1) AND CAST(NULLIF(regexp_replace(s_grade, '\\D', '', 'g'), '') AS INTEGER) >= 11`,
      [boardsToUpdate]
    );
    
    // 2. Increment grades (only for those < 12)
    await db.query(
      `UPDATE student_personal_info
       SET s_grade = (CAST(NULLIF(regexp_replace(s_grade, '\\D', '', 'g'), '') AS INTEGER) + 1)::VARCHAR
       WHERE s_board = ANY($1) AND CAST(NULLIF(regexp_replace(s_grade, '\\D', '', 'g'), '') AS INTEGER) < 12`,
      [boardsToUpdate]
    );
    
    // 3. Generate notifications for graduating/completed students
    for (const student of graduatingRes.rows) {
      const currentGrade = parseInt(student.s_grade.replace(/\D/g, '')) || 0;
      let message = '';
      if (currentGrade === 11) {
        message = `Student ${student.s_name} has been promoted to 12th grade.`;
      } else if (currentGrade >= 12) {
        message = `Student ${student.s_name} has completed 12th grade and their academic year is finished.`;
      }
      
      if (message) {
        await db.query(
          `INSERT INTO admin_notifications (title, message, type) VALUES ($1, $2, 'info')`,
          ['Student Grade Update', message]
        );
      }
    }
    console.log(`[Cron Job] ✅ Grade increments and notifications completed.`);
  } catch (err) {
    console.error(`[Cron Job] ❌ Error in checkAndIncrementGrades:`, err);
  }
}

// Schedule the cron job to run every day at midnight (0 0 * * *)
function startCronJob() {
  console.log('[Cron Job] 🚀 Scheduling daily job at midnight (0 0 * * *)');
  cron.schedule('0 0 * * *', async () => {
    try {
      await checkAndGenerateLoyaltyFees();
      await checkAndIncrementGrades();
    } catch (err) {
      // Error already logged inside function
    }
  });
}

module.exports = {
  startCronJob,
  checkAndGenerateLoyaltyFees,
  checkAndIncrementGrades
};
