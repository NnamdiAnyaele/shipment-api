const winston = require('winston');
const path = require('path');
const config = require('../config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
  ],
});

// Add file transports in production
if (config.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    })
  );
}

/**
 * Express middleware for request logging
 */
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * Log error utility
 */
const logError = (context, error) => {
  logger.error(`[${context}] ${error.message}`, { stack: error.stack });
};

/**
 * Log info utility
 */
const logInfo = (context, message) => {
  logger.info(`[${context}] ${message}`);
};

/**
 * Log debug utility
 */
const logDebug = (context, message) => {
  logger.debug(`[${context}] ${message}`);
};

module.exports = {
  logger,
  loggerMiddleware,
  logError,
  logInfo,
  logDebug,
};
