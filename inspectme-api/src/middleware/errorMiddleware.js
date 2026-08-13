function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, _req, res, _next) {
  const isValidationError = error.name === "ValidationError";
  const isDuplicateKeyError = error && error.code === 11000;
  const statusCode = isDuplicateKeyError ? 409 : isValidationError ? 400 : error.statusCode || 500;
  const message = isDuplicateKeyError
    ? "A record with the same unique value already exists for this user."
    : error.message || "Internal server error.";

  res.status(statusCode).json({
    message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
