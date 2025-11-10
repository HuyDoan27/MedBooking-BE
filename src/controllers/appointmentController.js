const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendMail");
const moment = require('moment');

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, status, patientName } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }

    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Tìm doctor có email hoặc phoneNumber trùng user
    const doctor = await Doctor.findOne({
      $and: [{ email: user.email }, { phoneNumber: user.phoneNumber }],
    });

    if (!doctor) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy doctor ứng với user" });
    }

    let query = { doctorId: doctor._id };

    // Lọc theo ngày (nếu có)
    if (date) {
      query.$expr = {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
          date,
        ],
      };
    }

    // Lọc theo trạng thái (nếu có)
    if (status) {
      query.status = status;
    }

    // Query chính
    let appointmentsQuery = Appointment.find(query)
      .populate("userId", "fullName email phoneNumber")
      .populate("clinicId", "name address")
      .sort({ appointmentDate: 1 });

    // Nếu có tìm theo tên bệnh nhân thì filter sau populate
    let appointments = await appointmentsQuery;
    if (patientName) {
      const regex = new RegExp(patientName, "i");
      appointments = appointments.filter((apt) =>
        regex.test(apt.userId?.fullName || "")
      );
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Lỗi getAppointmentsByDoctor:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

//lấy dsach lịch khám ngày hôm nay của bác sĩ
exports.getTodayAppointmentsByDoctor = async (req, res) => {
  try {
    const { userId } = req.params; // userId từ client

    if (!userId) {
      return res.status(400).json({ message: "userId là bắt buộc" });
    }

    // Lấy thông tin user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    // Tìm doctor tương ứng với user
    const doctor = await Doctor.findOne({
      $and: [{ email: user.email }, { phoneNumber: user.phoneNumber }],
    });
    if (!doctor) {
      return res.status(404).json({ message: "Không tìm thấy doctor ứng với user" });
    }

    // Ngày hôm nay
    const today = moment().format("YYYY-MM-DD");

    // Query lịch khám hôm nay
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      status : "upcoming",
      $expr: {
        $eq: [
          { $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" } },
          today,
        ],
      },
    })
      .populate("userId", "fullName email phoneNumber")
      .populate("clinicId", "name address")
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Lỗi getTodayAppointmentsByDoctor:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Lấy danh sách lịch hẹn của user
exports.getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.params; // => /api/appointments/user/:userId
    const { status, page = 1, limit = 10 } = req.query;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status; // status phải đúng kiểu lưu trong DB

    const appointments = await Appointment.find(filter)
      .populate("doctorId", "fullName specialty phoneNumber email")
      .populate("userId", "fullName email phoneNumber")
      .populate("clinicId")
      .sort({ appointmentDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error("getUserAppointments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo lịch hẹn mới
exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment({
      ...req.body,
      userId: req.user._id, // ✅ lấy user từ token
    });

    await appointment.save();

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error("createAppointment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết một lịch hẹn
exports.getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.query; // For authorization

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: userId,
    }).populate("userId doctorId");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error in getAppointmentById:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin lịch hẹn",
      error: error.message,
    });
  }
};

// Cập nhật trạng thái lịch hẹn
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, reason, updatedBy = "user" } = req.body;

    const validStatuses = ["pending", "completed", "cancelled", "upcoming"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const appointment = await Appointment.findById(appointmentId).populate("userId");
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    const currentStatus = appointment.status;

    const validTransitions = {
      pending: ["upcoming", "cancelled"],
      upcoming: ["completed"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
      });
    }

    appointment.status = status;
    if (status === "cancelled") {
      appointment.cancellationReason = reason;
    }

    appointment.statusHistory.push({
      status,
      timestamp: new Date(),
      reason,
    });

    await appointment.save();

    const user = appointment.userId;
    if (user && user.email) {
      const subject = `Cập nhật lịch hẹn của bạn (${appointment._id})`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Xin chào ${user.fullName || "Quý khách"},</h2>
          <p>Trạng thái lịch hẹn của bạn đã được cập nhật:</p>
          <p><b>Trạng thái mới:</b> <span style="color: #007bff;">${status}</span></p>
          ${reason ? `<p><b>Lý do:</b> ${reason}</p>` : ""}
          <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
          <hr />
          <small>Email này được gửi tự động, vui lòng không trả lời.</small>
        </div>
      `;

      await sendEmail(user.email, subject, htmlContent);
    }

    res.json({
      success: true,
      message: `Cập nhật trạng thái lịch hẹn thành ${status} và đã gửi email thông báo`,
      data: appointment,
    });
  } catch (error) {
    console.error("Error in updateAppointmentStatus:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật trạng thái",
      error: error.message,
    });
  }
};

//gửi thông tin bệnh cho bệnh nhân sau khám
exports.submitMedicalReport = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { condition, treatmentMethod, prescription, notes } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!condition || !treatmentMethod) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ tình trạng bệnh và phương pháp điều trị",
      });
    }

    // Tìm lịch hẹn
    const appointment = await Appointment.findById(appointmentId).populate("userId");
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Chỉ cho phép gửi báo cáo khi lịch đã completed
    if (appointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể gửi thông tin sau khi lịch khám đã hoàn thành (completed)",
      });
    }

    // Cập nhật medical report
    appointment.medicalReport = {
      condition,
      treatmentMethod,
      prescription: prescription || [],
      notes: notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await appointment.save();

    // Gửi email thông báo cho bệnh nhân
    const user = appointment.userId;
    if (user && user.email) {
      const subject = `Báo cáo kết quả khám bệnh (${appointment._id})`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Xin chào ${user.fullName || "Quý khách"},</h2>
          <p>Bác sĩ đã gửi thông tin sau khi hoàn tất buổi khám của bạn:</p>
          <p><b>Tình trạng bệnh:</b> ${condition}</p>
          <p><b>Phương pháp điều trị:</b> ${treatmentMethod}</p>
          ${prescription && prescription.length > 0
          ? `
                <p><b>Đơn thuốc:</b></p>
                <ul>
                  ${prescription
            .map(
              (p) =>
                `<li>${p.medicine} - ${p.dosage || ""} (${p.duration || ""})</li>`
            )
            .join("")}
                </ul>`
          : ""
        }
          ${notes ? `<p><b>Ghi chú thêm:</b> ${notes}</p>` : ""}
          <hr />
          <small>Email này được gửi tự động, vui lòng không trả lời.</small>
        </div>
      `;

      await sendEmail(user.email, subject, htmlContent);
    }

    res.json({
      success: true,
      message: "Bác sĩ đã gửi thông tin khám bệnh thành công",
      data: appointment,
    });
  } catch (error) {
    console.error("Error in submitMedicalReport:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi thông tin khám bệnh",
      error: error.message,
    });
  }
};

// Lấy danh sách báo cáo bệnh án của một bệnh nhân (user)
exports.getMedicalReportsByPatient = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId là bắt buộc" });
    }

    // Tìm các lịch hẹn của user có medicalReport
    const reports = await Appointment.find({
      userId: userId,
      medicalReport: { $exists: true, $ne: null },
    })
      .populate("doctorId", "fullName email phoneNumber")
      .sort({ appointmentDate: -1 })
      .lean();

    // Chuẩn hóa dữ liệu trả về để FE dễ hiển thị
    const data = reports.map((apt) => ({
      appointmentId: apt._id,
      appointmentDate: apt.appointmentDate,
      status: apt.status,
      doctor: apt.doctorId
        ? {
          id: apt.doctorId._id,
          name: apt.doctorId.fullName,
          email: apt.doctorId.email,
          phoneNumber: apt.doctorId.phoneNumber,
        }
        : null,
      medicalReport: {
        condition: apt.medicalReport?.condition || "",
        treatmentMethod: apt.medicalReport?.treatmentMethod || "",
        prescription:
          Array.isArray(apt.medicalReport?.prescription) && apt.medicalReport.prescription.length > 0
            ? apt.medicalReport.prescription.map((p) => ({
              medicine: p.medicine || "",
              dosage: p.dosage || "",
              duration: p.duration || "",
            }))
            : [],
        notes: apt.medicalReport?.notes || "",
        createdAt: apt.medicalReport?.createdAt || null,
        updatedAt: apt.medicalReport?.updatedAt || null,
      },
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error in getMedicalReportsByPatient:", error);
    res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};

// Dời lịch hẹn
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ngày và giờ mới",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Check if can reschedule
    if (!["pending", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể dời lịch hẹn này",
      });
    }

    // Check new time slot availability
    const conflictAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId,
      appointmentDate: new Date(newDate),
      appointmentTime: newTime,
      status: { $in: ["pending", "confirmed"] },
      _id: { $ne: appointmentId },
    });

    if (conflictAppointment) {
      return res.status(409).json({
        success: false,
        message: "Khung giờ mới đã được đặt. Vui lòng chọn thời gian khác.",
      });
    }

    // Save original date/time
    appointment.originalDate = appointment.appointmentDate;
    appointment.originalTime = appointment.appointmentTime;

    // Update with new date/time
    appointment.appointmentDate = new Date(newDate);
    appointment.appointmentTime = newTime;
    appointment.status = "rescheduled";
    appointment.rescheduleReason = reason;

    await appointment.save();

    res.json({
      success: true,
      message: "Dời lịch hẹn thành công",
      data: appointment,
    });
  } catch (error) {
    console.error("Error in rescheduleAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi dời lịch hẹn",
      error: error.message,
    });
  }
};

// Đánh giá sau khám
exports.rateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Đánh giá phải từ 1 đến 5 sao",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    if (appointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá sau khi hoàn thành khám",
      });
    }

    appointment.rating = rating;
    appointment.review = review;

    await appointment.save();

    res.json({
      success: true,
      message: "Đánh giá thành công",
      data: { rating, review },
    });
  } catch (error) {
    console.error("Error in rateAppointment:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đánh giá",
      error: error.message,
    });
  }
};

// Statistics cho user
exports.getUserAppointmentStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Appointment.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalSpent = await Appointment.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          status: "completed",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$price" },
        },
      },
    ]);

    const upcoming = await Appointment.countDocuments({
      userId,
      status: { $in: ["pending", "confirmed"] },
      appointmentDate: { $gte: new Date() },
    });

    res.json({
      success: true,
      data: {
        statusStats: stats,
        totalSpent: totalSpent[0]?.total || 0,
        upcomingCount: upcoming,
      },
    });
  } catch (error) {
    console.error("Error in getUserAppointmentStats:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thống kê",
      error: error.message,
    });
  }
};
