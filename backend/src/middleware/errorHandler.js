/**
 * @file errorHandler.js
 * @description Centralised Express error-handling middleware.
 * Logs full error details server-side; never exposes stack traces or internal
 * messages to the client for 5xx errors.
 */

/**
 * Express error-handling middleware. Must be registered last in server.js.
 * @param {Error}  err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;

  // Log full details server-side for debugging
  console.error({
    timestamp:  new Date().toISOString(),
    method:     req.method,
    path:       req.path,
    statusCode,
    message:    err.message,
    stack:      err.stack,
  });

  // Never leak stack traces or internal messages for server errors
  const clientMessage = statusCode >= 500
    ? 'An unexpected error occurred. Please try again.'
    : (err.message || 'Request failed.');

  res.status(statusCode).json({
    success:   false,
    error:     clientMessage,
    code:      err.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  });
}
