const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const ocrController = require('../controllers/ocrController');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting for OCR endpoints
const ocrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each user to 20 OCR requests per windowMs
  message: {
    success: false,
    message: 'Çok fazla OCR isteği gönderildi. 15 dakika sonra tekrar deneyin.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Use user ID if authenticated, otherwise IP
  }
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPEG, JPG ve PNG dosyaları desteklenir.'), false);
    }
  }
});

// Validation middleware
const validateOCRRequest = [
  body('imageData')
    .optional()
    .isString()
    .isLength({ min: 100 })
    .withMessage('Geçerli bir resim verisi gerekli'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('OCR validation failed', {
        errors: errors.array(),
        userId: req.user?.id
      });
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }
    next();
  }
];

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük. Maksimum 5MB olmalı.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Sadece bir dosya yükleyebilirsiniz.',
        error: 'TOO_MANY_FILES'
      });
    }
  }
  
  if (error.message.includes('desteklenir')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
};

/**
 * @route POST /api/ocr/process
 * @desc Process receipt image with OCR
 * @access Private
 */
router.post('/process',
  authMiddleware,
  ocrRateLimit,
  validateOCRRequest,
  ocrController.processReceiptImage
);

/**
 * @route POST /api/ocr/upload
 * @desc Upload and process receipt image file
 * @access Private
 */
router.post('/upload',
  authMiddleware,
  ocrRateLimit,
  upload.single('receiptImage'),
  handleMulterError,
  ocrController.processUploadedImage
);

/**
 * @route GET /api/ocr/health
 * @desc Get OCR service health status
 * @access Private
 */
router.get('/health',
  authMiddleware,
  ocrController.getHealthStatus
);

/**
 * @route GET /api/ocr/supported-formats
 * @desc Get supported image formats and limits
 * @access Private
 */
router.get('/supported-formats',
  authMiddleware,
  (req, res) => {
    res.json({
      success: true,
      data: {
        supported_formats: ['image/jpeg', 'image/jpg', 'image/png'],
        max_file_size: '5MB',
        max_files: 1,
        rate_limit: {
          requests_per_window: 20,
          window_minutes: 15
        },
        features: [
          'total_amount_extraction',
          'date_extraction',
          'merchant_name_extraction',
          'confidence_scoring'
        ]
      }
    });
  }
);

module.exports = router;
