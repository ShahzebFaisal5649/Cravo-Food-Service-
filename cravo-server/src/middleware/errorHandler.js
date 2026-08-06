export function notFound(req, res, next) {
  res.status(404)
  next(new Error(`Route not found - ${req.originalUrl}`))
}

export function errorHandler(err, req, res, _next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode
  let message = err.message

  // Invalid ObjectId in a route param, e.g. GET /api/orders/abc123
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400
    message = `Invalid ID format: ${err.value}`
  }

  // Mongoose schema validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  }

  // Duplicate key, e.g. unique email collision
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `${field} already in use`
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
}