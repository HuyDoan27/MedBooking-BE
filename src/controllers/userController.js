const User = require("../models/User");
const Doctor = require("../models/Doctor");

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
