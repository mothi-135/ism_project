const express = require('express');
const router = express.Router();

// Import the reusable loyalty billing function
const { checkAndGenerateLoyaltyFees } = require('../services/cronService');

/**
 * Development endpoint to manually trigger loyalty billing.
 * This is intended for local testing only and has no authentication.
 */
router.get('/trigger-billing', async (req, res) => {
  try {
    const result = await checkAndGenerateLoyaltyFees();
    res.json({ success: true, message: 'Loyalty billing executed', result });
  } catch (err) {
    console.error('❌ Dev route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
