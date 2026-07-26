const express = require('express');
const router = express.Router();
const tutorController = require('../controllers/tutorController');

router.get('/', tutorController.getAllTutors);
router.get('/:id', tutorController.getTutorById);
router.post('/', tutorController.registerTutor);
router.put('/:id', tutorController.updateTutor);
router.post('/:id/loyalty', tutorController.addLoyaltyPayment);

module.exports = router;
