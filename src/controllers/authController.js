const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Đăng ký
const register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, role } = req.body;

    // Kiểm tra email đã tồn tại
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email đã tồn tại" });

    // Tạo user mới, role mặc định là "user" nếu không truyền
    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      password,
      role: role || "user",
    });

    // Trả về thông tin + token chứa cả role
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role), // cập nhật token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra đầu vào
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Trả về thông tin user (thêm role, không trả password)
    res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role, // thêm role ở đây
        createdAt: user.createdAt,
      },
      token: generateToken(user._id, user.role), // truyền role vào token
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi hệ thống" });
  }
};

module.exports = { register, login };
