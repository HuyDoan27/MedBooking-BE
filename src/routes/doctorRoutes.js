const express = require("express");
const {
  getDoctors,
  getDoctorsBySpecialty,
  getDoctorById,
  createDoctor,
  updateDoctorStatus,
  getRandomDoctors,
  getAllDoctors,
} = require("../controllers/doctorController");

const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // memory storage, use .none() to accept only text fields

router.get("/", getDoctors); // list, search, filter
router.get("/all", getAllDoctors);
router.get("/random", getRandomDoctors); // random 3-5 bác sĩ
router.get("/specialty", getDoctorsBySpecialty);
router.get("/:id", getDoctorById); // chi tiết
router.post("/", createDoctor); // thêm mới (parse multipart form fields)
router.put("/:id/status", updateDoctorStatus);

module.exports = router;
