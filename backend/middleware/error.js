// 404 for unknown routes
exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler: every error leaves the API in the same JSON shape
exports.errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors;

  if (err.name === 'CastError') { status = 400; message = 'Invalid id'; }
  if (err.name === 'ValidationError') {
    status = 400;
    errors = Object.values(err.errors).map((e) => e.message);
    message = errors[0];
  }
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field === 'userId' || field === 'bookId'
      ? 'You already have an active reservation for this book'
      : `That ${field || 'value'} is already in use`;
  }
  if (status === 500) console.error(err);
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};
