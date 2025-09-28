// models/Specialty.js
const mongoose = require("mongoose");

const specialtySchema = new mongoose.Schema({
  name: { type: String, required: true }, // ví dụ: Nội tổng quát, Tim mạch
  description: { type: String },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Specialty", specialtySchema);
