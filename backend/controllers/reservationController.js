const mongoose = require('mongoose');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { PICKUP_DAYS, LOAN_DAYS, MAX_ACTIVE_PER_STUDENT } = require('../config/library');
const { calcFine, addDays } = require('../utils/fines');
const { releaseCopy } = require('../utils/inventory');
const { expireLapsedPickups } = require('../utils/expiry');
const { notify } = require('../utils/notify');

const BOOK_FIELDS = 'title author isbn category coverImage';
const USER_FIELDS = 'name usn email department';
const populate = (q) => q.populate('bookId', BOOK_FIELDS).populate('userId', USER_FIELDS);

// "Overdue" is a filter, not a stored status: a Collected book past its due date
const statusFilter = (status) => {
  if (!status || status === 'All') return {};
  if (status === 'Overdue') return { status: 'Collected', dueDate: { $lt: new Date() } };
  return { status };
};

// POST /api/reservations   body: { bookId }   (student)
exports.createReservation = asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  if (!mongoose.isValidObjectId(bookId)) throw new AppError('A valid bookId is required', 400);

  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found', 404);

  const userId = req.user._id;

  // Eligibility checks
  if (await Reservation.exists({ userId, bookId, isActive: true })) {
    throw new AppError('You already have an active reservation for this book', 409);
  }
  const blocked =
    (await Reservation.exists({ userId, status: 'Collected', dueDate: { $lt: new Date() } })) ||
    (await Reservation.exists({ userId, status: 'Returned', fineAmount: { $gt: 0 }, finePaid: false }));
  if (blocked) {
    throw new AppError('You have an overdue book or an unpaid fine. Please clear it at the library desk before reserving', 403);
  }
  const activeCount = await Reservation.countDocuments({ userId, isActive: true });
  if (activeCount >= MAX_ACTIVE_PER_STUDENT) {
    throw new AppError(`You can hold at most ${MAX_ACTIVE_PER_STUDENT} active reservations`, 403);
  }

  // Take a copy ATOMICALLY: "availableCopies > 0" and the decrement are one database operation,
  // so two students can never grab the last copy together.
  const taken = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );
  if (!taken) throw new AppError('No copies of this book are available right now', 409);

  try {
    const reservation = await Reservation.create({ userId, bookId });
    const saved = await populate(Reservation.findById(reservation._id));
    res.status(201).json({ success: true, message: 'Book reserved successfully', data: { reservation: saved } });
  } catch (err) {
    await releaseCopy(bookId); // roll back the copy if saving failed (e.g. duplicate race)
    throw err;
  }
});

// GET /api/reservations/my?status=&active=true   (student: only own records)
exports.getMyReservations = asyncHandler(async (req, res) => {
  await expireLapsedPickups();
  const filter = { userId: req.user._id, ...statusFilter(req.query.status) };
  if (req.query.active === 'true') filter.isActive = true;
  const reservations = await populate(Reservation.find(filter).sort({ createdAt: -1 }));
  res.json({ success: true, message: 'Reservations fetched', data: { reservations } });
});

// GET /api/reservations?status=   (admin: everyone's records)
exports.getAllReservations = asyncHandler(async (req, res) => {
  await expireLapsedPickups();
  const reservations = await populate(Reservation.find(statusFilter(req.query.status)).sort({ createdAt: -1 }));
  res.json({ success: true, message: 'Reservations fetched', data: { reservations } });
});

// GET /api/reservations/:id   (owner or admin)
exports.getReservation = asyncHandler(async (req, res) => {
  const reservation = await populate(Reservation.findById(req.params.id));
  if (!reservation) throw new AppError('Reservation not found', 404);
  const ownerId = reservation.userId?._id || reservation.userId;
  if (req.user.role !== 'admin' && String(ownerId) !== String(req.user._id)) {
    throw new AppError('You can only view your own reservations', 403);
  }
  res.json({ success: true, message: 'Reservation fetched', data: { reservation } });
});

// PUT /api/reservations/:id/cancel   (student, own reservation, only before collection)
exports.cancelReservation = asyncHandler(async (req, res) => {
  const cancelled = await Reservation.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, status: { $in: ['Pending', 'Approved'] } },
    { status: 'Cancelled', isActive: false, cancellationDate: new Date() },
    { new: true }
  );

  if (!cancelled) {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) throw new AppError('Reservation not found', 404);
    if (String(existing.userId) !== String(req.user._id)) throw new AppError('You can only cancel your own reservations', 403);
    const why = existing.status === 'Collected'
      ? 'This book has already been collected. Please return it at the library desk'
      : `This reservation is already ${existing.status.toLowerCase()} and cannot be cancelled`;
    throw new AppError(why, 409);
  }

  await releaseCopy(cancelled.bookId);
  const saved = await populate(Reservation.findById(cancelled._id));
  res.json({ success: true, message: 'Reservation cancelled', data: { reservation: saved } });
});

// PUT /api/reservations/:id/status   body: { status: "Approved" | "Rejected" }   (admin)
exports.reviewReservation = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) throw new AppError('Status must be Approved or Rejected', 400);

  const now = new Date();
  const update = { status, reviewedBy: req.user._id, reviewedAt: now };
  if (status === 'Approved') update.pickupDeadline = addDays(now, PICKUP_DAYS);
  if (status === 'Rejected') update.isActive = false;

  const reviewed = await Reservation.findOneAndUpdate({ _id: req.params.id, status: 'Pending' }, update, { new: true });
  if (!reviewed) {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) throw new AppError('Reservation not found', 404);
    throw new AppError(`Only pending reservations can be reviewed (this one is ${existing.status.toLowerCase()})`, 409);
  }
  if (status === 'Rejected') await releaseCopy(reviewed.bookId);

  const saved = await populate(Reservation.findById(reviewed._id));
  notify(status === 'Approved' ? 'approved' : 'rejected', saved);
  res.json({ success: true, message: `Reservation ${status.toLowerCase()}`, data: { reservation: saved } });
});

// PUT /api/reservations/:id/collect   (admin: student picked the book up at the desk)
exports.collectReservation = asyncHandler(async (req, res) => {
  await expireLapsedPickups(); // a lapsed pickup must not be collectable
  const now = new Date();
  const collected = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: 'Approved' },
    { status: 'Collected', collectedAt: now, dueDate: addDays(now, LOAN_DAYS) },
    { new: true }
  );
  if (!collected) {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) throw new AppError('Reservation not found', 404);
    throw new AppError(`Only approved reservations can be marked collected (this one is ${existing.status.toLowerCase()})`, 409);
  }
  const saved = await populate(Reservation.findById(collected._id));
  res.json({ success: true, message: `Marked as collected. Due back on ${collected.dueDate.toDateString()}`, data: { reservation: saved } });
});

// PUT /api/reservations/:id/return   (admin: book handed back; fine is fixed now)
exports.returnReservation = asyncHandler(async (req, res) => {
  const existing = await Reservation.findById(req.params.id);
  if (!existing) throw new AppError('Reservation not found', 404);
  if (existing.status !== 'Collected') {
    throw new AppError(`Only collected books can be returned (this one is ${existing.status.toLowerCase()})`, 409);
  }

  const now = new Date();
  const fine = calcFine(existing.dueDate, now);
  const returned = await Reservation.findOneAndUpdate(
    { _id: existing._id, status: 'Collected' },
    { status: 'Returned', isActive: false, returnedAt: now, fineAmount: fine.amount, finePaid: fine.amount === 0 },
    { new: true }
  );
  if (!returned) throw new AppError('This book was already returned', 409);

  await releaseCopy(returned.bookId);
  const saved = await populate(Reservation.findById(returned._id));
  const msg = fine.amount > 0
    ? `Returned ${fine.days} ${fine.days === 1 ? 'day' : 'days'} late. Fine: Rs ${fine.amount}`
    : 'Returned on time. No fine';
  res.json({ success: true, message: msg, data: { reservation: saved } });
});

// PUT /api/reservations/:id/pay-fine   (admin: fine collected at the desk)
exports.payFine = asyncHandler(async (req, res) => {
  const paid = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: 'Returned', fineAmount: { $gt: 0 }, finePaid: false },
    { finePaid: true, finePaidAt: new Date() },
    { new: true }
  );
  if (!paid) throw new AppError('There is no unpaid fine on this reservation', 409);
  const saved = await populate(Reservation.findById(paid._id));
  res.json({ success: true, message: `Fine of Rs ${paid.fineAmount} marked as paid`, data: { reservation: saved } });
});
