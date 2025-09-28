// routes/clinicRoutes.js
const express = require("express");
const router = express.Router();
const clinicController = require("../controllers/clinicController");

// Lấy danh sách tất cả phòng khám
router.get("/", clinicController.getClinics);

router.get("/:id/specialties", clinicController.getSpecialtiesByClinic);

module.exports = router;
