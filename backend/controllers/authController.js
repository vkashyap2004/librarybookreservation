const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { validateRegister, validateLogin } = require('../utils/validators');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, usn: u.usn, email: u.email, department: u.department, role: u.role, createdAt: u.createdAt });

// POST /api/auth/register  (students only; the role is always forced to "student")
exports.register = asyncHandler(async (req, res) => {
  const errors = validateRegister(req.body);
  if (errors.length) throw new AppError(errors[0], 400, errors);

  const { name, usn, email, department, password } = req.body;
  const user = await User.create({ name, usn, email, department, password, role: 'student' });
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { token: signToken(user._id), user: publicUser(user) },
  });
});

// POST /api/auth/login  (students and admins; optional "role" makes sure the right tab was used)
exports.login = asyncHandler(async (req, res) => {
  const errors = validateLogin(req.body);
  if (errors.length) throw new AppError(errors[0], 400, errors);

  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) {
    throw new AppError('Incorrect email or password', 401);
  }
  if (req.body.role && req.body.role !== user.role) {
    throw new AppError(`This account is not a ${req.body.role} account`, 403);
  }
  res.json({
    success: true,
    message: 'Login successful',
    data: { token: signToken(user._id), user: publicUser(user) },
  });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Current user', data: { user: publicUser(req.user) } });
});

// PUT /api/auth/password   body: { currentPassword, newPassword }
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Current and new password are required', 400);
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new AppError('New password must be at least 8 characters and contain a letter and a number', 400);
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new AppError('Current password is incorrect', 401);
  if (currentPassword === newPassword) throw new AppError('New password must be different from the current one', 400);

  user.password = newPassword; // the pre-save hook hashes it
  await user.save();
  res.json({ success: true, message: 'Password changed', data: {} });
});
