const nodemailer = require('nodemailer');

let transporter;
const enabled = () => !!process.env.SMTP_HOST;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

// Never throws: a failed email must not break a reservation.
// With no SMTP settings the email is printed to the server console instead.
exports.sendMail = async ({ to, subject, text, html }) => {
  if (!enabled()) {
    console.log(`[email not configured] To: ${to} | Subject: ${subject}\n${text}\n`);
    return;
  }
  try {
    await getTransporter().sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
  } catch (err) {
    console.error('Email failed:', err.message);
  }
};
