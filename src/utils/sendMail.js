const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Tạo transporter (ví dụ dùng Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Email gửi đi
        pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng (App Password)
      },
    });

    // Cấu hình nội dung email
    const mailOptions = {
      from: `"Hệ thống Quản lý" <${process.env.EMAIL_USER}>`,
      to, // Email người nhận
      subject,
      html: htmlContent,
    };

    // Gửi email
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

module.exports = sendEmail;
