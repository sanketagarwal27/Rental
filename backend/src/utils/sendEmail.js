import nodemailer from "nodemailer";

// Singleton transporter — created once and reused
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async (options) => {
  const mailTransporter = getTransporter();
  await mailTransporter.sendMail({
    from: `"RentWheels" <${process.env.EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || undefined,
  });
};

export default sendEmail;
