export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    details: err.details || null,
  })
}
