const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// Lấy toàn bộ user
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thêm user mới
exports.createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /users/me
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    // Nếu là bác sĩ, lấy thêm thông tin từ bảng Doctor + join Specialty & Clinic
    if (user.role === "doctor") {
      const doctor = await Doctor.findOne({ email: user.email })
        .populate("specialty", "name")
        .populate("clinic", "name");

      if (doctor) {
        return res.json({
          ...user.toObject(),
          specialty: doctor.specialty,
          clinic: doctor.clinic,
          experience: doctor.experience,
          qualifications: doctor.qualifications,
        });
      }
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getUsersWithAppointments = async (req, res) => {
  try {
    // 1️⃣ Lấy danh sách user có role = 'user'
    const users = await User.find({ role: "user" }).select("-password"); // bỏ password cho an toàn

    // 2️⃣ Duyệt từng user để gắn thêm thông tin lịch khám
    const results = await Promise.all(
      users.map(async (user) => {
        // Lấy tất cả appointment của user đó
        const appointments = await Appointment.find({ userId: user._id })
          .populate("doctorId", "fullName email phoneNumber") // chỉ lấy vài trường cần thiết
          .populate("clinicId", "name address phone"); // phòng khám

        // Chuẩn bị dữ liệu tóm tắt
        const formattedAppointments = appointments.map((a) => ({
          appointmentId: a._id,
          doctor: a.doctorId ? a.doctorId.fullName : null,
          clinic: a.clinicId ? a.clinicId.name : a.clinicName,
          appointmentDate: a.appointmentDate,
          status: a.status,
          reason: a.reason,
        }));

        return {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          totalAppointments: appointments.length,
          appointments: formattedAppointments,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy user với appointments:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách user kèm lịch khám",
    });
  }
};
