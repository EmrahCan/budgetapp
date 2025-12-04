const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

// Import performance services - temporarily disabled
// const reportPerformanceService = require('./services/reportPerformanceService');
const logger = require('./utils/logger');

// Import notification generator service
const notificationGeneratorService = require('./services/notificationGeneratorService');

// Import email service
const emailService = require('./services/emailService');

// Import health monitoring
const {
  healthCheckMiddleware,
  systemHealthMiddleware,
  memoryMonitoringMiddleware,
  errorTrackingMiddleware,
  initializeHealthMonitoring,
  shutdownHealthMonitoring
} = require('./middleware/healthCheck');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required when behind nginx/reverse proxy
// This allows Express to correctly identify client IPs from X-Forwarded-For header
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting - very relaxed for production stability
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health' || req.path === '/api/health'
});

// Apply rate limiting only to auth routes (most sensitive)
app.use('/api/auth', rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 login attempts per minute
  message: 'Too many login attempts, please try again later.'
}));

// Parse additional allowed origins from environment
const additionalOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3001',
  // Azure VM IP addresses - FIXED for port 80
  'http://4.210.173.21',        // Frontend on port 80 (default HTTP)
  'http://4.210.173.21:80',     // Explicit port 80
  'http://4.210.173.21:3000',   // Alternative port
  'https://4.210.173.21',       // HTTPS variant
  'https://4.210.173.21:443',   // HTTPS explicit port
  // Docker network internal communication
  'http://budget-frontend:3000',
  'http://frontend:3000',
  // Additional origins from environment
  ...additionalOrigins
];

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      // Production domain
      'https://budgetapp.site',
      'https://www.budgetapp.site',
      'http://budgetapp.site',
      'http://www.budgetapp.site',
      // Current Azure VM IP - comprehensive coverage
      'http://98.71.149.168',
      'http://98.71.149.168:80',
      'http://98.71.149.168:3000',
      'https://98.71.149.168',
      'https://98.71.149.168:443',
      // Previous Azure VM IPs
      'http://108.143.146.143',
      'http://108.143.146.143:80',
      'http://108.143.146.143:3000',
      'https://108.143.146.143',
      'https://108.143.146.143:443',
      // Docker network internal communication
      'http://budget-frontend:3000',
      'http://frontend:3000'
    ];
    
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Explicitly reject with error to prevent any middleware override
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://98.71.149.168',
      'http://98.71.149.168:80',
      'http://98.71.149.168:3000',
      'https://98.71.149.168',
      'https://98.71.149.168:443',
      'http://108.143.146.143',
      'http://108.143.146.143:80',
      'http://108.143.146.143:3000',
      'https://108.143.146.143',
      'https://108.143.146.143:443',
      'http://budget-frontend:3000',
      'http://frontend:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger.requestMiddleware);

// Enhanced health check endpoint with email metrics
app.get('/health', async (req, res) => {
  try {
    const emailHealth = await emailService.healthCheck();
    
    // Get email delivery stats from database
    let emailMetrics = null;
    try {
      const EmailDeliveryLog = require('./models/EmailDeliveryLog');
      const stats = await EmailDeliveryLog.getStats();
      emailMetrics = {
        totalEmails: stats.totals.total,
        sent: stats.totals.sent,
        failed: stats.totals.failed,
        queued: stats.totals.queued,
        successRate: stats.successRate,
      };
    } catch (error) {
      logger.error('Failed to get email metrics for health check', { error: error.message });
    }
    
    // Check if email service is healthy
    const isEmailHealthy = emailHealth.status === 'healthy' && emailHealth.enabled;
    
    // Overall health status
    const overallStatus = isEmailHealthy ? 'OK' : 'DEGRADED';
    
    res.status(200).json({ 
      status: overallStatus, 
      message: 'Budget App Backend is running',
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      services: {
        email: {
          ...emailHealth,
          metrics: emailMetrics,
        }
      }
    });
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
const authRoutes = require('./routes/auth');
const creditCardRoutes = require('./routes/creditCards');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const fixedPaymentRoutes = require('./routes/fixedPayments');
const installmentPaymentRoutes = require('./routes/installmentPayments');
const reportRoutes = require('./routes/reports');
const optimizedReportRoutes = require('./routes/optimizedReports');
const enhancedReportRoutes = require('./routes/enhancedReports');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const emailRoutes = require('./routes/email');

app.use('/api/auth', authRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-payments', fixedPaymentRoutes);
app.use('/api/installment-payments', installmentPaymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports/optimized', optimizedReportRoutes);
app.use('/api/reports/enhanced', enhancedReportRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.errorWithContext('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize services - simplified for stability
async function initializeServices() {
  try {
    // Initialize email service
    await emailService.initialize();
    logger.info('Email service initialized');

    // Initialize scheduled notification job
    // Runs daily at 6:00 AM
    cron.schedule('0 6 * * *', async () => {
      logger.info('Running scheduled notification generation job');
      try {
        await notificationGeneratorService.generateDailyNotifications();
        logger.info('Scheduled notification generation completed successfully');
      } catch (error) {
        logger.error('Scheduled notification generation failed', {
          error: error.message,
          stack: error.stack,
        });
      }
    });

    logger.info('Scheduled notification job initialized (runs daily at 6:00 AM)');
    logger.info('Basic services initialized successfully');
  } catch (error) {
    logger.errorWithContext('Failed to initialize services', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.errorWithContext('Failed to start server', error);
    process.exit(1);
  }
}

startServer();