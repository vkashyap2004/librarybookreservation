const Book = require('../models/Book');

// Give one copy back to the shelf. The $expr guard keeps available <= total.
exports.releaseCopy = (bookId) =>
  Book.findOneAndUpdate(
    { _id: bookId, $expr: { $lt: ['$availableCopies', '$totalCopies'] } },
    { $inc: { availableCopies: 1 } }
  );
