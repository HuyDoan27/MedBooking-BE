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

    // Nếu client truyền status (ví dụ status=1 hoặc status=1,2) thì lọc theo status,
    // nếu không truyền thì trả tất cả bác sĩ.
    if (req.query.status) {
      const statuses = String(req.query.status)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => [1, 2, 3].includes(n));
      if (statuses.length > 0) query.status = { $in: statuses };
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

    const filter = {
      specialty: new mongoose.Types.ObjectId(specialtyId), // ✅ dùng `new`
    };

    if (req.query.status) {
      const statuses = String(req.query.status)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => [1, 2, 3].includes(n));
      if (statuses.length > 0) filter.status = { $in: statuses };
    }

    const doctors = await Doctor.find(filter)
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
    const doctor = await Doctor.findById(req.params.id).populate(
      'specialty',
      'name description'
    );

    if (!doctor) return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
    // Nếu client truyền status filter thì kiểm tra
    if (req.query.status) {
      const statuses = String(req.query.status)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => [1, 2, 3].includes(n));
      if (statuses.length > 0 && !statuses.includes(doctor.status)) {
        return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
      }
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin thêm bác sĩ
export const createDoctor = async (req, res) => {
  try {
    // Debug: log incoming headers and body to diagnose missing fields
    console.log('createDoctor called - headers:', {
      'content-type': req.headers['content-type'],
    });
    console.log('createDoctor called - raw body:', req.body);
    // Ensure that when a doctor registers via form, their status is set to 'pending' (2)
    const payload = { ...req.body };
    // Always set new doctor status to 'pending' (2) regardless of incoming payload
    payload.status = 2;

  // If client provided clinicName/clinicAddress, keep them on the payload so they are persisted
  if (req.body.clinicName) payload.clinicName = req.body.clinicName;
  if (req.body.clinicAddress) payload.clinicAddress = req.body.clinicAddress;

    const doctor = new Doctor(payload);
    await doctor.save();
    res.status(201).json({ success: true, data: doctor });
  } catch (err) {
    console.error('createDoctor error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Lấy ngẫu nhiên 3-5 bác sĩ
export const getRandomDoctors = async (req, res) => {
  try {
    // random số lượng trong khoảng 3 - 5
    const randomCount = Math.floor(Math.random() * 3) + 3; // 3, 4 hoặc 5
    const matchStage = { $match: {} };
    if (req.query.status) {
      const statuses = String(req.query.status)
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => [1, 2, 3].includes(n));
      if (statuses.length > 0) matchStage.$match.status = { $in: statuses };
    }

    const agg = [matchStage, { $sample: { size: randomCount } }];
    const doctors = await Doctor.aggregate(agg);
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Cập nhật trạng thái bác sĩ (1=duyệt, 2=chờ, 3=từ chối)
export const updateDoctorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID bác sĩ không hợp lệ' });
    }

    const allowed = [1, 2, 3];
    const numericStatus = Number(status);
    if (!allowed.includes(numericStatus)) {
      return res.status(400).json({ success: false, message: 'status phải là 1, 2 hoặc 3' });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { status: numericStatus },
      { new: true }
    ).populate('specialty', 'name description');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ' });
    }

    res.json({ success: true, data: doctor });
  } catch (err) {
    console.error('updateDoctorStatus error:', err);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái' });
  }
};
