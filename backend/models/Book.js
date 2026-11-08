const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  isbn: { type: String, required: true, unique: true, trim: true },
  category: { type: String, required: true, trim: true },
  publisher: { type: String, required: true, trim: true },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  coverImage: { type: String, trim: true, default: '' },
  totalCopies: { type: Number, required: true, min: 0, default: 1 },
  availableCopies: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
    // Rule 6: available copies can never exceed total copies
    validate: {
      validator: function (v) { return v <= this.totalCopies; },
      message: 'Available copies cannot exceed total copies',
    },
  },
  createdAt: { type: Date, default: Date.now },
});

bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ category: 1 });

module.exports = mongoose.model('Book', bookSchema);
