const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String },
  updatedBy: { type: String, default: "user" },
});

// ✅ Schema chi tiết cho báo cáo khám (khi trạng thái completed)
const medicalReportSchema = new mongoose.Schema({
  condition: { type: String, required: true }, // tình trạng bệnh
  treatmentMethod: { type: String, required: true }, // phương pháp điều trị
  prescription: [
    {
      medicine: { type: String, required: true },
      dosage: { type: String },
      duration: { type: String },
    },
  ],
  notes: { type: String }, // ghi chú thêm (nếu có)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  },
  clinicName: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  reason: { type: String, required: true },
  notes: { type: String },
  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled", "pending"],
    default: "pending",
  },
  location: { type: String},
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  // ✅ Thay prescription bằng medicalReport
  medicalReport: medicalReportSchema,

  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },

  cancellationReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Tự động cập nhật updatedAt khi document thay đổi
appointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Appointment", appointmentSchema);
