// controllers/clinicController.js
const Clinic = require("../models/Clinic");

exports.getClinics = async (req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    res.json({ success: true, data: clinics });
  } catch (error) {
    console.error("getClinics error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy danh sách phòng khám" });
  }
};

exports.getSpecialtiesByClinic = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id).populate("specialties", "name description");
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phòng khám" });
    }

    res.json({
      success: true,
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        address: clinic.address,
      },
      specialties: clinic.specialties,
    });
  } catch (error) {
    console.error("getSpecialtiesByClinic error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy chuyên khoa" });
  }
};

