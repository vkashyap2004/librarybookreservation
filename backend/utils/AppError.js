// Error with an HTTP status code, caught by the central error handler
class AppError extends Error {
  constructor(message, statusCode = 400, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
module.exports = AppError;
