const mongoose = require("mongoose");

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
  clinicName: { type: String, required: true }, // snapshot tên phòng khám (để tránh đổi tên gây sai lịch sử)

  appointmentDate: { type: Date, required: true }, // ngày giờ khám
  reason: { type: String, required: true }, // lý do khám bệnh
  notes: { type: String }, // ghi chú thêm
  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled", "pending"],
    default: "pending",
  },
  location: { type: String, required: true }, // địa điểm khám
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid",
  },
  prescription: [
    // toa thuốc (nếu có)
    {
      medicine: String,
      dosage: String,
      duration: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
