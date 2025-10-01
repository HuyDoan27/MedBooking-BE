import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";

// Lấy danh sách bác sĩ + search + filter
export const getDoctors = async (req, res) => {
  try {
    const { name } = req.query;
    let query = {};

    // search gần đúng theo fullName, nếu có name
    if (name) {
      query.fullName = { $regex: name, $options: "i" };
    }

    const doctors = await Doctor.find(query)
      .populate("specialty", "name description")
      .sort({ fullName: 1 })
      .lean();

    res.json({ success: true, data: doctors });
  } catch (err) {
    console.error("getDoctors error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.query;

    if (!specialtyId || !mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res
        .status(400)
        .json({ success: false, message: "specialtyId không hợp lệ" });
    }

    const doctors = await Doctor.find({
      specialty: new mongoose.Types.ObjectId(specialtyId), // ✅ dùng `new`
    })
      .populate("specialty", "name description")
      .sort({ fullName: 1 })
      .lean();

    res.json({ success: true, data: doctors });
  } catch (err) {
    console.error("getDoctorsBySpecialty error:", err);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy danh sách bác sĩ" });
  }
};

// Lấy chi tiết bác sĩ
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor)
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin thêm bác sĩ
export const createDoctor = async (req, res) => {
  try {
    const doctor = new Doctor(req.body);
    await doctor.save();
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Lấy ngẫu nhiên 3-5 bác sĩ
export const getRandomDoctors = async (req, res) => {
  try {
    // random số lượng trong khoảng 3 - 5
    const randomCount = Math.floor(Math.random() * 3) + 3; // 3, 4 hoặc 5

    const doctors = await Doctor.aggregate([
      { $sample: { size: randomCount } },
    ]);
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
