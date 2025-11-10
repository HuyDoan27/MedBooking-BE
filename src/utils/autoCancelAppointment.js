const cron = require("node-cron");
const Appointment = require("../models/Appointment");

// Hàm tự động hủy lịch hẹn quá hạn
async function autoCancelExpiredAppointments() {
  const now = new Date();

  const expiredAppointments = await Appointment.find({
    status: "pending",
    appointmentDate: { $lt: now },
  });

  for (let appt of expiredAppointments) {
    appt.status = "cancelled";
    appt.cancellationReason = "Quá thời gian khám nhưng chưa được duyệt.";
    appt.statusHistory.push({
      status: "cancelled",
      reason: "Tự động hủy do quá thời gian khám.",
      updatedBy: "system",
    });
    await appt.save();
  }

  if (expiredAppointments.length > 0) {
    console.log(`🕒 Đã tự động hủy ${expiredAppointments.length} lịch hẹn quá hạn.`);
  }
}

// 🔁 Lên lịch chạy tự động mỗi phút
cron.schedule("* * * * *", async () => {
  console.log("⏳ Kiểm tra lịch hẹn quá hạn...");
  await autoCancelExpiredAppointments();
});
