// Library rules. Override any of them in .env
module.exports = {
  PICKUP_DAYS: Number(process.env.PICKUP_DAYS) || 3,       // days to collect a book after approval
  LOAN_DAYS: Number(process.env.LOAN_DAYS) || 14,          // days a student may keep a collected book
  FINE_PER_DAY: Number(process.env.FINE_PER_DAY) || 5,     // rupees per overdue day
  MAX_ACTIVE_PER_STUDENT: 3,
};
