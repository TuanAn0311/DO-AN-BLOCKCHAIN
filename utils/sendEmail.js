const nodemailer = require("nodemailer");

const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dqta74@gmail.com", // Thay bằng Gmail của bạn
        pass: "zmkq nkzp orfs vini", // Thay bằng App Password
      },
    });

    const mailOptions = {
      from: '"DNC Trace - Hệ thống Cà phê Minh bạch" <dqta74@gmail.com>',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email thành công tới ${toEmail}`);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
  }
};

module.exports = sendEmail;
