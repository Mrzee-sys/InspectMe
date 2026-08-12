function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(error, _req, res, _next) {
  const isValidationError = error.name === "ValidationError";
  const statusCode = isValidationError ? 400 : error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error.",
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
