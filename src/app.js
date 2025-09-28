const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const appointmentRoutes = require('./routes/appointmentRoutes');
const specialtyRoutes = require("./routes/specialtyRoutes"); 
const clinicRoutes = require("./routes/clinicRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/doctors", doctorRoutes);

app.use('/api/appointments', appointmentRoutes);

app.use("/api/specialties", specialtyRoutes);

app.use("/api/clinics", clinicRoutes);

app.get("/", (req, res) => res.send("API is running..."));

module.exports = app;
