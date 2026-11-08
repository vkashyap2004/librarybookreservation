const { sendMail } = require('./mailer');

const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const wrap = (lines) => lines.map((l) => `<p>${l}</p>`).join('') + '<p>SIT Library</p>';

// Each template receives a reservation with userId (name, email) and bookId (title) populated
const templates = {
  approved: (r) => {
    const lines = [
      `Hi ${r.userId.name},`,
      `Your reservation ${r.reservationId} for "${r.bookId.title}" has been approved.`,
      `Please collect it from the library desk by ${date(r.pickupDeadline)}. After that date the reservation expires and the copy goes back on the shelf.`,
    ];
    return { subject: `Reservation approved: ${r.bookId.title}`, text: lines.join('\n\n') + '\n\nSIT Library', html: wrap(lines) };
  },
  rejected: (r) => {
    const lines = [
      `Hi ${r.userId.name},`,
      `Your reservation ${r.reservationId} for "${r.bookId.title}" was not approved by the librarian. The copy has been released.`,
      'You can reserve another book from the library catalogue.',
    ];
    return { subject: `Reservation rejected: ${r.bookId.title}`, text: lines.join('\n\n') + '\n\nSIT Library', html: wrap(lines) };
  },
  expired: (r) => {
    const lines = [
      `Hi ${r.userId.name},`,
      `Your reservation ${r.reservationId} for "${r.bookId.title}" has expired because it was not collected by ${date(r.pickupDeadline)}.`,
      'The copy is available to other students again. You are welcome to reserve it again if it is still available.',
    ];
    return { subject: `Reservation expired: ${r.bookId.title}`, text: lines.join('\n\n') + '\n\nSIT Library', html: wrap(lines) };
  },
};

// Fire and forget: the API response does not wait for the email
exports.notify = (kind, reservation) => {
  if (!reservation?.userId?.email || !reservation?.bookId) return;
  sendMail({ to: reservation.userId.email, ...templates[kind](reservation) });
};
