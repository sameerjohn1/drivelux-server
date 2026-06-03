const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: email,
    subject,
    html,
  };

  const info = await transporter.sendMail(message);
  logger.info(`Email sent: ${info.messageId}`);
};

module.exports = sendEmail;
