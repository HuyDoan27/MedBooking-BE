const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// route
router.get("/:userId", appointmentController.getAppointmentsByDoctor);

// Get user appointments
router.get('/user/:userId', authMiddleware(["user"]), appointmentController.getUserAppointments);

// Create new appointment
router.post('/', authMiddleware(["user"]), appointmentController.createAppointment);

// Get appointment by ID
router.get('/:appointmentId', authMiddleware, appointmentController.getAppointmentById);

// Update appointment status
router.patch('/:appointmentId/status', authMiddleware(["doctor"]), appointmentController.updateAppointmentStatus);

// Reschedule appointment
router.patch('/:appointmentId/reschedule', authMiddleware, appointmentController.rescheduleAppointment);

// Rate appointment
router.patch('/:appointmentId/rate', authMiddleware, appointmentController.rateAppointment);

// Get user stats
router.get('/user/:userId/stats', authMiddleware, appointmentController.getUserAppointmentStats);

module.exports = router;
