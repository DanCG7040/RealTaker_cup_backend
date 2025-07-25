import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER || 'tucorreo@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'tu_contraseña',
  },
});

export default transporter; 