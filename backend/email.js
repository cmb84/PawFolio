// email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // false for TLS on 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMfaCode(to, code) {
  const fromAddress =
    process.env.MAIL_FROM || '"PawFolio" <no-reply@pawfolio.local>';

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Your PawFolio login code",
    text: `Your PawFolio verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your PawFolio verification code is <b>${code}</b>. It expires in <b>10 minutes</b>.</p>`,
  });
}
