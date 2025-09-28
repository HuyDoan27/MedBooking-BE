const express = require("express");
const {
  getDoctors,
  getDoctorsBySpecialty,
  getDoctorById,
  createDoctor,
  getRandomDoctors,
} = require("../controllers/doctorController");

const router = express.Router();

router.get("/", getDoctors); // list, search, filter
router.get("/random", getRandomDoctors); // random 3-5 bác sĩ
router.get("/specialty", getDoctorsBySpecialty);
router.get("/:id", getDoctorById); // chi tiết
router.post("/", createDoctor); // thêm mới


module.exports = router;
