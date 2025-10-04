const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const { userId } = req.params; // giờ truyền userId thay vì doctorId
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
      $or: [{ email: user.email }, { phoneNumber: user.phoneNumber }],
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

    const validStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "rescheduled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch hẹn",
      });
    }

    // Business logic for status changes
    const currentStatus = appointment.status;

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled", "rescheduled"],
      completed: [], // Cannot change from completed
      cancelled: ["pending"], // Can reactivate if needed
      rescheduled: ["pending", "confirmed", "cancelled"],
    };

    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển từ trạng thái ${currentStatus} sang ${status}`,
      });
    }

    // Update appointment
    appointment.status = status;

    if (status === "cancelled") {
      appointment.cancellationReason = reason;
    }

    // Add to status history
    appointment.statusHistory.push({
      status,
      timestamp: new Date(),
      reason,
      updatedBy,
    });

    await appointment.save();

    res.json({
      success: true,
      message: `Cập nhật trạng thái lịch hẹn thành ${status}`,
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
