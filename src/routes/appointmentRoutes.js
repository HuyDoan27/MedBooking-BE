const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// route
router.get("/:userId", appointmentController.getAppointmentsByDoctor);

//get appointment of today
router.get("/today/:userId", appointmentController.getTodayAppointmentsByDoctor);

// Get user appointments
router.get('/user/:userId', authMiddleware(["user"]), appointmentController.getUserAppointments);

// Get medical reports for a patient (user)
router.get('/user/:userId/medical-reports', authMiddleware(["doctor", "user"]), appointmentController.getMedicalReportsByPatient);

// Create new appointment
router.post('/', authMiddleware(["user"]), appointmentController.createAppointment);

// Get appointment by ID
router.get('/:appointmentId', authMiddleware, appointmentController.getAppointmentById);

// Update appointment status
router.patch('/:appointmentId/status', authMiddleware(), appointmentController.updateAppointmentStatus);

// Reschedule appointment
router.patch('/:appointmentId/reschedule', authMiddleware, appointmentController.rescheduleAppointment);

// Rate appointment
router.patch('/:appointmentId/rate', authMiddleware, appointmentController.rateAppointment);

// Get user stats
router.get('/user/:userId/stats', authMiddleware, appointmentController.getUserAppointmentStats);

// 🩺 Gửi thông tin khám bệnh (medical report) — chỉ bác sĩ mới được phép
router.post('/:appointmentId/medical-report', authMiddleware(["doctor"]), appointmentController.submitMedicalReport);

module.exports = router;
