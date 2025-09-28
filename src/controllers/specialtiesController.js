// controllers/specialtyController.js
const Specialty = require("../models/Specialty");

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
    res.json({ success: true, data: specialties });
  } catch (error) {
    console.error("getSpecialties error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
