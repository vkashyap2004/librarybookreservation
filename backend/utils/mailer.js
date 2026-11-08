
const { Resend } = require('resend');

let resendClient;

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

exports.sendMail = async ({ to, subject, text, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email not configured] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: 'Library Reservation <onboarding@resend.dev>',
      to,
      subject,
      text,
      html
    });

    if (error) {
      console.error('Email failed:', error.message);
      return;
    }

    console.log('Email sent successfully:', data.id);

  } catch (err) {
    console.error('Email failed:', err.message);
  }
};
