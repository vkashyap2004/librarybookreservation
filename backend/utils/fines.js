const { FINE_PER_DAY } = require('../config/library');
const DAY = 24 * 60 * 60 * 1000;

// Overdue days between the due date and `until`; a part-day counts as a full day
const overdueDaysBetween = (dueDate, until = new Date()) =>
  dueDate && until > dueDate ? Math.ceil((until - dueDate) / DAY) : 0;

const calcFine = (dueDate, until = new Date()) => {
  const days = overdueDaysBetween(dueDate, until);
  return { days, amount: days * FINE_PER_DAY };
};

const addDays = (date, days) => new Date(date.getTime() + days * DAY);

module.exports = { overdueDaysBetween, calcFine, addDays, FINE_PER_DAY };
