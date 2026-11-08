const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const asyncHandler = require('../utils/asyncHandler');
const { expireLapsedPickups } = require('../utils/expiry');

const recentPopulate = (q) => q.populate('bookId', 'title author coverImage').populate('userId', 'name usn');

// Outstanding fines = unpaid fines on returned books + live fines on overdue books still out
async function outstandingFines(extra = {}) {
  const [unpaid, overdue] = await Promise.all([
    Reservation.aggregate([
      { $match: { ...extra, status: 'Returned', fineAmount: { $gt: 0 }, finePaid: false } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } },
    ]),
    Reservation.find({ ...extra, status: 'Collected', dueDate: { $lt: new Date() } }),
  ]);
  const live = overdue.reduce((sum, r) => sum + r.fine, 0);
  return { fines: (unpaid[0]?.total || 0) + live, overdue: overdue.length };
}

// GET /api/stats/admin
exports.adminStats = asyncHandler(async (req, res) => {
  await expireLapsedPickups();
  const [totalBooks, totalStudents, totalReservations, activeReservations, pendingReservations, awaitingPickup,
    availableBooks, unavailableBooks, copies, recent, money] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Reservation.countDocuments(),
    Reservation.countDocuments({ isActive: true }),
    Reservation.countDocuments({ status: 'Pending' }),
    Reservation.countDocuments({ status: 'Approved' }),
    Book.countDocuments({ availableCopies: { $gt: 0 } }),
    Book.countDocuments({ availableCopies: 0 }),
    Book.aggregate([{ $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } }]),
    recentPopulate(Reservation.find().sort({ createdAt: -1 }).limit(6)),
    outstandingFines(),
  ]);
  res.json({
    success: true,
    message: 'Admin statistics',
    data: {
      totalBooks, totalStudents, totalReservations, activeReservations, pendingReservations, awaitingPickup,
      availableBooks, unavailableBooks,
      overdueBooks: money.overdue, unpaidFines: money.fines,
      totalCopies: copies[0]?.total || 0,
      availableCopies: copies[0]?.available || 0,
      recent,
    },
  });
});

// GET /api/stats/student
exports.studentStats = asyncHandler(async (req, res) => {
  await expireLapsedPickups();
  const userId = req.user._id;
  const [total, active, cancelled, recent, money] = await Promise.all([
    Reservation.countDocuments({ userId }),
    Reservation.countDocuments({ userId, isActive: true }),
    Reservation.countDocuments({ userId, status: 'Cancelled' }),
    Reservation.find({ userId }).sort({ createdAt: -1 }).limit(5).populate('bookId', 'title author coverImage isbn category'),
    outstandingFines({ userId }),
  ]);
  res.json({ success: true, message: 'Student statistics', data: { total, active, cancelled, recent, fines: money.fines, overdue: money.overdue } });
});
