/**
 * Custom HTTP Error class for consistent error handling
 */
class HttpError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new HttpError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return new HttpError(message, 401);
  }

  static forbidden(message = 'Access forbidden') {
    return new HttpError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(message, 404);
  }

  static conflict(message = 'Resource already exists') {
    return new HttpError(message, 409);
  }

  static unprocessableEntity(message, errors = null) {
    return new HttpError(message, 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new HttpError(message, 500);
  }
}

module.exports = HttpError;
