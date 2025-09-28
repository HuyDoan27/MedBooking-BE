// models/Clinic.js
const mongoose = require("mongoose");

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Tên phòng khám
  address: { type: String, required: true },
  phone: { type: String },
  description: { type: String },
  specialties: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialty",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Clinic", clinicSchema);
