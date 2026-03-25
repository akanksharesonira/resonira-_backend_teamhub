const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Production-grade Express error-handling middleware.
 *
 * - Generates a unique request ID for every error (returned to client for tracing).
 * - Logs full error context: user, path, method, body summary, SQL details.
 * - Handles Sequelize-specific error types with appropriate HTTP status codes.
 * - Never leaks stack traces or raw SQL to the client in production.
 */
const errorMiddleware = (err, req, res, _next) => {
  const requestId = crypto.randomUUID();
  const isDev = process.env.NODE_ENV === 'development';

  // ── Structured Log ──────────────────────────────────────
  logger.error(`[${requestId}] Unhandled Error`, {
    requestId,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || 'anonymous',
    body: summarizeBody(req.body),
    // SQL-specific fields (Sequelize)
    sqlCode: err.original?.code || err.parent?.code || null,
    sqlMessage: err.original?.sqlMessage || err.parent?.sqlMessage || null,
    sql: err.sql || null,
  });

  // Set request ID header for client-side tracing
  res.setHeader('X-Request-Id', requestId);

  // ── Sequelize Validation Error (model-level) ────────────
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => e.message),
      requestId,
    });
  }

  // ── Sequelize Unique Constraint ─────────────────────────
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
      errors: err.errors.map((e) => e.message),
      requestId,
    });
  }

  // ── Sequelize Database Error (SQL-level) ────────────────
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: isDev
        ? `Database error: ${err.original?.sqlMessage || err.message}`
        : 'A database error occurred. Please try again later.',
      code: 'DB_ERROR',
      requestId,
    });
  }

  // ── Sequelize Foreign Key Constraint ────────────────────
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist or cannot be removed.',
      code: 'FK_CONSTRAINT',
      requestId,
    });
  }

  // ── Multer (file upload) ────────────────────────────────
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      requestId,
    });
  }

  // ── Generic / Unknown ───────────────────────────────────
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 && !isDev
      ? 'Internal Server Error. Please try again later.'
      : err.message || 'Internal Server Error',
    requestId,
  });
};

/**
 * Summarize request body for logging (avoid logging passwords/tokens).
 */
function summarizeBody(body) {
  if (!body || typeof body !== 'object') return null;
  const safe = {};
  for (const key of Object.keys(body)) {
    if (['password', 'token', 'secret', 'password_hash'].includes(key.toLowerCase())) {
      safe[key] = '[REDACTED]';
    } else {
      const val = body[key];
      safe[key] = typeof val === 'string' && val.length > 100 ? val.substring(0, 100) + '...' : val;
    }
  }
  return safe;
}

module.exports = errorMiddleware;
