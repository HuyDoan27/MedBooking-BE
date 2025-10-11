import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import sendEmail from "../utils/sendMail.js";

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
        .split(",")
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

// GET /api/doctors?status=2&clinic=clinicId
export const getAllDoctors = async (req, res) => {
  try {
    const { status, clinic } = req.query;

    // Tạo object filter động
    const filter = {};
    if (status) filter.status = Number(status);
    if (clinic) filter.clinic = clinic;

    const doctors = await Doctor.find(filter)
      .populate("specialty", "name") // chỉ lấy trường 'name'
      .populate("clinic", "name address") // chỉ lấy các field cần thiết
      .sort({ createdAt: -1 }); // mới nhất lên đầu

    res.status(200).json({
      success: true,
      message: "Lấy danh sách bác sĩ thành công",
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bác sĩ",
    });
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
        .split(",")
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
      "specialty",
      "name description"
    );

    if (!doctor)
      return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
    // Nếu client truyền status filter thì kiểm tra
    if (req.query.status) {
      const statuses = String(req.query.status)
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => [1, 2, 3].includes(n));
      if (statuses.length > 0 && !statuses.includes(doctor.status)) {
        return res.status(404).json({ message: "Không tìm thấy bác sĩ" });
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
    console.log("createDoctor called - headers:", {
      "content-type": req.headers["content-type"],
    });
    console.log("createDoctor called - raw body:", req.body);
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
    console.error("createDoctor error:", err);
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
        .split(",")
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
    const { status, rejectReason } = req.body;

    // Kiểm tra trạng thái hợp lệ
    if (![1, 2, 3].includes(Number(status))) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ. Chỉ chấp nhận 1, 2, hoặc 3.",
      });
    }

    // Nếu từ chối mà không có lý do -> báo lỗi
    if (Number(status) === 3 && (!rejectReason || rejectReason.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Khi từ chối bác sĩ, bắt buộc phải nhập lý do.",
      });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ.",
      });
    }

    doctor.status = Number(status);

    if (Number(status) === 3) {
      doctor.rejectReason = rejectReason;
    } else {
      doctor.rejectReason = "";
    }

    await doctor.save();

    // --- Gửi email thông báo ---
    let subject = "";
    let htmlContent = "";

    if (status === 1) {
      subject = "Tài khoản bác sĩ của bạn đã được duyệt ✅";
      htmlContent = `
        <p>Xin chào <strong>${doctor.fullName}</strong>,</p>
        <p>Tài khoản bác sĩ của bạn đã được <strong>duyệt thành công</strong>.</p>
        <p>Bạn có thể đăng nhập và sử dụng hệ thống ngay.</p>
        <br/>
        <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
      `;
    } else if (status === 3) {
      subject = "Tài khoản bác sĩ của bạn bị từ chối ❌";
      htmlContent = `
        <p>Xin chào <strong>${doctor.fullName}</strong>,</p>
        <p>Rất tiếc, tài khoản bác sĩ của bạn đã bị <strong>từ chối</strong>.</p>
        <p><strong>Lý do:</strong> ${rejectReason}</p>
        <p>Nếu có thắc mắc, vui lòng liên hệ lại với quản trị viên.</p>
        <br/>
        <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
      `;
    } else {
      subject = "Trạng thái tài khoản của bạn đã được cập nhật 🔄";
      htmlContent = `
        <p>Xin chào <strong>${doctor.fullName}</strong>,</p>
        <p>Trạng thái tài khoản của bạn hiện đang là <strong>chờ duyệt</strong>.</p>
        <p>Chúng tôi sẽ thông báo cho bạn ngay khi có kết quả mới.</p>
        <br/>
        <p>Trân trọng,<br/>Đội ngũ quản trị hệ thống</p>
      `;
    }

    if (doctor.email) {
      await sendEmail(doctor.email, subject, htmlContent);
    }

    res.status(200).json({
      success: true,
      message:
        status === 1
          ? "Đã duyệt bác sĩ và gửi email thông báo."
          : status === 3
          ? "Đã từ chối bác sĩ và gửi email thông báo."
          : "Đã cập nhật trạng thái bác sĩ.",
      data: doctor,
    });
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái bác sĩ.",
    });
  }
};
