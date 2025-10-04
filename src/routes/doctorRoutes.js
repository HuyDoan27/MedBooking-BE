const express = require("express");
const {
  getDoctors,
  getDoctorsBySpecialty,
  getDoctorById,
  createDoctor,
  updateDoctorStatus,
  getRandomDoctors,
} = require("../controllers/doctorController");

const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();
const multer = require('multer');
const upload = multer(); // memory storage, use .none() to accept only text fields

router.get("/", getDoctors); // list, search, filter
router.get("/random", getRandomDoctors); // random 3-5 bác sĩ
router.get("/specialty", getDoctorsBySpecialty);
router.get("/:id", getDoctorById); // chi tiết
router.post("/", upload.none(), createDoctor); // thêm mới (parse multipart form fields)
router.patch("/:id/status", authMiddleware(["admin"]), updateDoctorStatus); // cập nhật trạng thái bác sĩ (admin only)

module.exports = router;
