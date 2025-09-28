// models/Doctor.js
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String },
  phoneNumber: { type: String },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Specialty",
    required: true,
  }, // liên kết chuyên khoa
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  }, // liên kết phòng khám thay vì lưu tên & địa chỉ thủ công
  experience: { type: String }, // ví dụ: "10 năm"
  qualifications: [{ type: String }], // danh sách bằng cấp/chứng chỉ
  avatar: { type: String }, // ảnh bác sĩ
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doctor", doctorSchema);
