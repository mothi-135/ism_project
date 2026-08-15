const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/', adminController.getAllAdmins);
router.get('/notifications', adminController.getNotifications);
router.get('/:id', adminController.getAdminById);
router.post('/assign', adminController.assignTutor);

// Loyalty payment confirmation endpoints (supports both PUT and PATCH)
router.put('/loyalty-payments/:id/confirm', adminController.confirmLoyaltyPayment);
router.patch('/loyalty-payments/:id/confirm', adminController.confirmLoyaltyPayment);

module.exports = router;
