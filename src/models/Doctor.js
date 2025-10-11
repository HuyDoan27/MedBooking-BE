const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String },
  phoneNumber: { type: String },
  specialty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Specialty",
    required: true,
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  },
  clinicName: { type: String },
  clinicAddress: { type: String },
  experience: { type: String },
  qualifications: [{ type: String }],
  avatar: { type: String },
  // 1 = duyệt, 2 = chờ duyệt, 3 = từ chối
  status: { type: Number, enum: [1, 2, 3], default: 2 },
  rejectReason: { type: String, default: "" }, // thêm dòng này
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Doctor", doctorSchema);
