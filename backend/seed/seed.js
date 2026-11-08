// Run with: npm run seed   (wipes the database and inserts sample data)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

const books = [
  ['Introduction to Algorithms', 'Thomas H. Cormen', '9780262046305', 'Computer Science', 'MIT Press', 'The standard reference on algorithms, covering design and analysis with rigorous proofs.', 5],
  ['Clean Code', 'Robert C. Martin', '9780132350884', 'Software Engineering', 'Prentice Hall', 'A handbook of agile software craftsmanship and habits for writing readable code.', 4],
  ['Database System Concepts', 'Abraham Silberschatz', '9780078022159', 'Databases', 'McGraw-Hill', 'Fundamentals of database design, SQL, transactions and storage.', 3],
  ['Computer Networking: A Top-Down Approach', 'James F. Kurose', '9780133594140', 'Networks', 'Pearson', 'Explains the internet layer by layer, starting from the application.', 3],
  ['Operating System Concepts', 'Abraham Silberschatz', '9781118063330', 'Operating Systems', 'Wiley', 'Processes, memory, storage and security in modern operating systems.', 4],
  ['Artificial Intelligence: A Modern Approach', 'Stuart Russell', '9780134610993', 'Artificial Intelligence', 'Pearson', 'A broad introduction to agents, search, learning and reasoning.', 2],
  ['Eloquent JavaScript', 'Marijn Haverbeke', '9781593279509', 'Web Development', 'No Starch Press', 'A modern introduction to JavaScript, programming and the browser.', 6],
  ['Designing Data-Intensive Applications', 'Martin Kleppmann', '9781449373320', 'Software Engineering', "O'Reilly", 'The big ideas behind reliable, scalable and maintainable data systems.', 2],
  ['The Pragmatic Programmer', 'David Thomas', '9780135957059', 'Software Engineering', 'Addison-Wesley', 'Practical advice for becoming a better, more effective developer.', 3],
  ['Discrete Mathematics and Its Applications', 'Kenneth H. Rosen', '9781259676512', 'Mathematics', 'McGraw-Hill', 'Logic, sets, graphs and counting for computer science students.', 5],
  ['Learning React', 'Alex Banks', '9781492051725', 'Web Development', "O'Reilly", 'Modern patterns for building React applications with hooks.', 4],
  ['Data Mining: Concepts and Techniques', 'Jiawei Han', '9780123814791', 'Data Science', 'Morgan Kaufmann', 'Methods for finding patterns in large datasets.', 1],
].map(([title, author, isbn, category, publisher, description, copies], i) => ({
  createdAt: new Date(Date.now() - i * 86400000), // so "Newest" sorting is visible
  title, author, isbn, category, publisher, description,
  coverImage: cover(isbn), totalCopies: copies, availableCopies: copies,
}));

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany(), Book.deleteMany(), Reservation.deleteMany()]);
  await Reservation.syncIndexes();

  await User.create({ name: 'Chief Librarian', email: 'admin@library.sit.ac.in', password: 'Admin@123', role: 'admin', department: 'Library' });
  const students = await User.create([
    { name: 'Ananya Rao', usn: '1SI22IS001', email: 'ananya@sit.ac.in', department: 'Information Science', password: 'Student@123' },
    { name: 'Rahul Gowda', usn: '1SI22IS014', email: 'rahul@sit.ac.in', department: 'Information Science', password: 'Student@123' },
    { name: 'Meera Nair', usn: '1SI22CS027', email: 'meera@sit.ac.in', department: 'Computer Science', password: 'Student@123' },
  ]);
  const created = await Book.insertMany(books);

  // Sample reservations covering every status (copies are decreased to match, as the API would do)
  const day = 86400000;
  const ago = (d) => new Date(Date.now() - d * day);
  const sample = [
    { u: 0, b: 0, status: 'Approved', pickupDeadline: new Date(Date.now() + 2 * day), reviewedAt: ago(1) },
    { u: 0, b: 1, status: 'Pending' },
    { u: 0, b: 8, status: 'Expired', pickupDeadline: ago(2), expiredAt: ago(2) },
    { u: 1, b: 5, status: 'Pending' },
    { u: 1, b: 3, status: 'Cancelled', cancellationDate: ago(1) },
    // Rahul returned a book 5 days late: unpaid fine, so he cannot reserve until it is paid
    { u: 1, b: 6, status: 'Returned', collectedAt: ago(20), dueDate: ago(6), returnedAt: ago(1), fineAmount: 25, finePaid: false },
    // Meera still holds the only copy of Data Mining and it is overdue (live fine)
    { u: 2, b: 11, status: 'Collected', collectedAt: ago(20), dueDate: ago(6) },
  ];
  for (const { u, b, ...fields } of sample) {
    const active = ['Pending', 'Approved', 'Collected'].includes(fields.status);
    await Reservation.create({ userId: students[u]._id, bookId: created[b]._id, isActive: active, ...fields });
    if (active) await Book.updateOne({ _id: created[b]._id }, { $inc: { availableCopies: -1 } });
  }

  console.log('Seed complete.');
  console.log('Admin   : admin@library.sit.ac.in / Admin@123');
  console.log('Student : ananya@sit.ac.in / Student@123 (clean account)');
  console.log('Rahul has an unpaid fine and Meera has an overdue book, so both are blocked from new reservations.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
