const logger = require('../utils/logger');

const auditMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.user) {
      logger.info(`[AUDIT] ${req.method} ${req.originalUrl} - User:${req.user.id} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
};

module.exports = auditMiddleware;
