const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'budget-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write performance logs separately
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/performance.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Performance logging helper
logger.performance = (operation, duration, metadata = {}) => {
  logger.info('Performance metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Query logging helper
logger.query = (query, duration, params = {}) => {
  logger.info('Database query', {
    query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    duration,
    params: Object.keys(params).length > 0 ? params : undefined,
    timestamp: new Date().toISOString()
  });
};

// Cache logging helper
logger.cache = (operation, key, hit = null, ttl = null) => {
  logger.info('Cache operation', {
    operation,
    key,
    hit,
    ttl,
    timestamp: new Date().toISOString()
  });
};

// Error logging with context
logger.errorWithContext = (message, error, context = {}) => {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date().toISOString()
  });
};

// Request logging middleware
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Skip logging for health check endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : null,
      contentLength: res.get('Content-Length'),
      referrer: req.get('Referrer') || req.get('Referer')
    };
    
    // Log as error if status code >= 400
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

module.exports = logger;