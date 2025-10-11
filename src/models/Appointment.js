const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String },
  updatedBy: { type: String, default: "user" },
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
  location: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  prescription: [
    {
      medicine: String,
      dosage: String,
      duration: String,
    },
  ],
  // ✅ Thêm trường này:
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },

  cancellationReason: { type: String }, // nếu có lý do hủy
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
