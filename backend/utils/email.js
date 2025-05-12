const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Сброс пароля',
    text: `Для сброса пароля перейдите по ссылке: ${resetUrl}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Письмо для сброса пароля отправлено на ${email}`);
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
    throw new Error('Не удалось отправить письмо');
  }
};

module.exports = { sendResetPasswordEmail };