// Hand-written validators: each returns an array of error messages (empty = valid)
const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v || '');
const normalizeIsbn = (v) => String(v || '').replace(/[-\s]/g, '').toUpperCase();
const isIsbn = (v) => /^(\d{9}[\dX]|\d{13})$/.test(normalizeIsbn(v));
const isUsn = (v) => /^[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/i.test(String(v || '').trim()); // e.g. 1SI22IS001
const isUrl = (v) => /^https?:\/\/\S+$/i.test(v || '');

function validateRegister(b) {
  const e = [];
  if (!b.name || b.name.trim().length < 3) e.push('Name must be at least 3 characters');
  if (!isUsn(b.usn)) e.push('USN must look like 1SI22IS001');
  if (!isEmail(b.email)) e.push('Enter a valid email address');
  if (!b.department || !b.department.trim()) e.push('Department is required');
  if (!b.password || b.password.length < 8 || !/[A-Za-z]/.test(b.password) || !/\d/.test(b.password))
    e.push('Password must be at least 8 characters and contain a letter and a number');
  return e;
}

function validateLogin(b) {
  const e = [];
  if (!isEmail(b.email)) e.push('Enter a valid email address');
  if (!b.password) e.push('Password is required');
  return e;
}

function validateBook(b) {
  const e = [];
  if (!b.title || !b.title.trim()) e.push('Title is required');
  if (!b.author || !b.author.trim()) e.push('Author is required');
  if (!isIsbn(b.isbn)) e.push('ISBN must be 10 or 13 digits (hyphens allowed)');
  if (!b.category || !b.category.trim()) e.push('Category is required');
  if (!b.publisher || !b.publisher.trim()) e.push('Publisher is required');
  if (b.description && b.description.length > 1000) e.push('Description must be under 1000 characters');
  const n = Number(b.totalCopies);
  if (!Number.isInteger(n) || n < 0 || n > 1000) e.push('Total copies must be a whole number from 0 to 1000');
  if (b.coverImage && !isUrl(b.coverImage)) e.push('Cover image must be a valid http(s) URL');
  return e;
}

module.exports = { validateRegister, validateLogin, validateBook, normalizeIsbn };
