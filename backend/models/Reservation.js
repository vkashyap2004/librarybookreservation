const mongoose = require('mongoose');
const { overdueDaysBetween, FINE_PER_DAY } = require('../utils/fines');

/*
 Lifecycle:
   Pending -> Approved -> Collected -> Returned
      |          |
      |          +-> Expired   (not collected before pickupDeadline)
      +-> Rejected (librarian)         Pending/Approved -> Cancelled (student)
 A copy is held while the status is Pending, Approved or Collected (isActive = true)
 and released on Returned, Rejected, Cancelled or Expired.
 isActive lets a partial unique index forbid two active reservations of one book per student.
*/
const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  reservationDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Collected', 'Returned', 'Rejected', 'Cancelled', 'Expired'],
    default: 'Pending',
  },
  isActive: { type: Boolean, default: true },
  cancellationDate: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  pickupDeadline: { type: Date },   // set on approval
  collectedAt: { type: Date },
  dueDate: { type: Date },          // set on collection
  returnedAt: { type: Date },
  expiredAt: { type: Date },
  fineAmount: { type: Number, default: 0, min: 0 }, // fixed when the book is returned
  finePaid: { type: Boolean, default: false },
  finePaidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { id: false });

// Computed fields sent to the frontend (not stored)
reservationSchema.virtual('overdueDays').get(function () {
  if (this.status === 'Collected') return overdueDaysBetween(this.dueDate, new Date());
  if (this.status === 'Returned') return overdueDaysBetween(this.dueDate, this.returnedAt);
  return 0;
});
reservationSchema.virtual('fine').get(function () {
  return this.status === 'Returned' ? this.fineAmount || 0 : this.overdueDays * FINE_PER_DAY;
});
reservationSchema.set('toJSON', { virtuals: true });

reservationSchema.pre('validate', function (next) {
  if (!this.reservationId) {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.reservationId = `RSV-${Date.now().toString(36).toUpperCase()}${rand}`;
  }
  next();
});

// Database-level protection against duplicate active reservations (race-safe)
reservationSchema.index({ userId: 1, bookId: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
reservationSchema.index({ userId: 1, createdAt: -1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ status: 1, pickupDeadline: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
