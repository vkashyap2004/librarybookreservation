const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { validateBook, normalizeIsbn } = require('../utils/validators');

const sorts = { title: { title: 1 }, newest: { createdAt: -1 }, available: { availableCopies: -1, title: 1 } };
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/books?search=&category=&availability=available|unavailable&sort=title|newest|available
exports.getBooks = asyncHandler(async (req, res) => {
  const { search, category, availability } = req.query;
  const filter = {};
  if (search && search.trim()) {
    const text = new RegExp(escapeRegex(search.trim()), 'i');
    const isbn = new RegExp(escapeRegex(normalizeIsbn(search)), 'i');
    filter.$or = [{ title: text }, { author: text }, { isbn }];
  }
  if (category && category !== 'All') filter.category = category;
  if (availability === 'available') filter.availableCopies = { $gt: 0 };
  if (availability === 'unavailable') filter.availableCopies = 0;

  const books = await Book.find(filter).sort(sorts[req.query.sort] || sorts.title);
  const categories = await Book.distinct('category');
  res.json({ success: true, message: 'Books fetched', data: { books, categories: categories.sort() } });
});

// GET /api/books/:id
exports.getBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);
  res.json({ success: true, message: 'Book fetched', data: { book } });
});

// POST /api/books  (admin)
exports.createBook = asyncHandler(async (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length) throw new AppError(errors[0], 400, errors);

  const total = Number(req.body.totalCopies);
  const book = await Book.create({
    ...pickFields(req.body),
    totalCopies: total,
    availableCopies: total, // a new book starts with every copy available
  });
  res.status(201).json({ success: true, message: 'Book added', data: { book } });
});

// PUT /api/books/:id  (admin)
exports.updateBook = asyncHandler(async (req, res) => {
  const errors = validateBook(req.body);
  if (errors.length) throw new AppError(errors[0], 400, errors);

  const current = await Book.findById(req.params.id);
  if (!current) throw new AppError('Book not found', 404);

  // Changing total copies shifts available copies by the same amount.
  // The filter guarantees available copies never drop below zero (atomic).
  const delta = Number(req.body.totalCopies) - current.totalCopies;
  const book = await Book.findOneAndUpdate(
    { _id: current._id, totalCopies: current.totalCopies, availableCopies: { $gte: -delta } },
    { $set: pickFields(req.body), $inc: { totalCopies: delta, availableCopies: delta } },
    { new: true, runValidators: true }
  );
  if (!book) {
    throw new AppError('Total copies cannot be lower than the copies currently reserved', 409);
  }
  res.json({ success: true, message: 'Book updated', data: { book } });
});

// DELETE /api/books/:id  (admin)
exports.deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);
  if (await Reservation.exists({ bookId: book._id, isActive: true })) {
    throw new AppError('This book has active reservations. Cancel or reject them first', 409);
  }
  await book.deleteOne();
  res.json({ success: true, message: 'Book deleted', data: {} });
});

// Only the fields an admin is allowed to set directly
function pickFields(b) {
  return {
    title: b.title.trim(),
    author: b.author.trim(),
    isbn: normalizeIsbn(b.isbn),
    category: b.category.trim(),
    publisher: b.publisher.trim(),
    description: (b.description || '').trim(),
    coverImage: (b.coverImage || '').trim(),
  };
}
