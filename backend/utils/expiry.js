const Reservation = require('../models/Reservation');
const { releaseCopy } = require('./inventory');
const { notify } = require('./notify');

// Approved reservations that were not collected before pickupDeadline become "Expired"
// and their copy goes back on the shelf. Runs on a timer and before reservation lists load.
exports.expireLapsedPickups = async () => {
  const now = new Date();
  const lapsed = await Reservation.find({ status: 'Approved', pickupDeadline: { $lt: now } }).select('_id');
  let count = 0;
  for (const { _id } of lapsed) {
    // The status filter makes this safe even if two processes run the sweep together
    const expired = await Reservation.findOneAndUpdate(
      { _id, status: 'Approved', pickupDeadline: { $lt: now } },
      { status: 'Expired', isActive: false, expiredAt: now },
      { new: true }
    );
    if (!expired) continue;
    await releaseCopy(expired.bookId);
    count += 1;
    const full = await Reservation.findById(_id).populate('bookId', 'title').populate('userId', 'name email');
    notify('expired', full);
  }
  return count;
};
