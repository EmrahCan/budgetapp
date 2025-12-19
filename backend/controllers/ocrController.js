const ocrService = require('../services/ocrService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class OCRController {
  /**
   * Process receipt image with OCR
   * @route POST /api/ocr/process
   */
  async processReceiptImage(req, res) {
    try {
      const { imageData } = req.body;
      const userId = req.user.id;
      
      logger.info('🔍 OCR processing request received', {
        userId,
        hasImageData: !!imageData,
        imageDataLength: imageData?.length
      });
      
      // Validate image data
      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: 'Resim verisi gerekli',
          error: 'MISSING_IMAGE_DATA'
        });
      }
      
      // Validate image format
      if (!ocrService.validateImage(imageData)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz resim formatı. JPEG, JPG veya PNG olmalı.',
          error: 'INVALID_IMAGE_FORMAT'
        });
      }
      
      // Process image with OCR
      const startTime = Date.now();
      const extractedData = await ocrService.processReceiptImage(imageData);
      const processingTime = Date.now() - startTime;
      
      logger.info('✅ OCR processing completed', {
        userId,
        processingTimeMs: processingTime,
        extractedAmount: extractedData.total_amount,
        extractedDate: extractedData.date,
        extractedMerchant: extractedData.merchant_name,
        confidence: extractedData.confidence_score
      });
      
      // Return success response
      res.json({
        success: true,
        message: 'Fiş başarıyla işlendi',
        data: {
          ...extractedData,
          processing_time_ms: processingTime,
          user_id: userId
        }
      });
      
    } catch (error) {
      logger.error('❌ OCR processing failed', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });
      
      // Handle specific errors
      if (error.message.includes('API key')) {
        return res.status(503).json({
          success: false,
          message: 'OCR servisi geçici olarak kullanılamıyor',
          error: 'SERVICE_UNAVAILABLE'
        });
      }
      
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'Çok fazla istek gönderildi. Lütfen bekleyin.',
          error: 'RATE_LIMITED'
        });
      }
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Fiş işlenirken bir hata oluştu',
        error: 'OCR_PROCESSING_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Process uploaded receipt image file
   * @route POST /api/ocr/upload
   */
  async processUploadedImage(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      logger.info('📁 OCR file upload request received', {
        userId,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype
      });
      
      // Validate file
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Dosya yüklenmedi',
          error: 'NO_FILE_UPLOADED'
        });
      }
      
      // Convert file buffer to base64
      const imageBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Process image with OCR
      const startTime = Date.now();
      const extractedData = await ocrService.processReceiptImage(imageBase64);
      const processingTime = Date.now() - startTime;
      
      logger.info('✅ OCR file processing completed', {
        userId,
        fileName: file.originalname,
        processingTimeMs: processingTime,
        extractedAmount: extractedData.total_amount,
        extractedDate: extractedData.date,
        extractedMerchant: extractedData.merchant_name,
        confidence: extractedData.confidence_score
      });
      
      // Return success response
      res.json({
        success: true,
        message: 'Fiş başarıyla işlendi',
        data: {
          ...extractedData,
          processing_time_ms: processingTime,
          user_id: userId,
          file_info: {
            original_name: file.originalname,
            size: file.size,
            mime_type: file.mimetype
          }
        }
      });
      
    } catch (error) {
      logger.error('❌ OCR file processing failed', {
        userId: req.user?.id,
        fileName: req.file?.originalname,
        error: error.message,
        stack: error.stack
      });
      
      // Handle specific errors
      if (error.message.includes('API key')) {
        return res.status(503).json({
          success: false,
          message: 'OCR servisi geçici olarak kullanılamıyor',
          error: 'SERVICE_UNAVAILABLE'
        });
      }
      
      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Dosya işlenirken bir hata oluştu',
        error: 'FILE_PROCESSING_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  /**
   * Get OCR service health status
   * @route GET /api/ocr/health
   */
  async getHealthStatus(req, res) {
    try {
      const healthStatus = ocrService.getHealthStatus();
      
      logger.info('🏥 OCR health check requested', {
        userId: req.user?.id,
        status: healthStatus.status
      });
      
      res.json({
        success: true,
        data: healthStatus
      });
      
    } catch (error) {
      logger.error('❌ OCR health check failed', {
        userId: req.user?.id,
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        message: 'Sağlık durumu kontrol edilemedi',
        error: 'HEALTH_CHECK_FAILED'
      });
    }
  }
  
  /**
   * Test OCR with sample data (development only)
   * @route POST /api/ocr/test
   */
  async testOCR(req, res) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
      });
    }
    
    try {
      const { testText } = req.body;
      
      if (!testText) {
        return res.status(400).json({
          success: false,
          message: 'Test metni gerekli'
        });
      }
      
      // Test parsing without actual OCR
      const parsedData = ocrService.parseOCRResponse(testText);
      
      res.json({
        success: true,
        message: 'Test başarılı',
        data: parsedData
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Test başarısız',
        error: error.message
      });
    }
  }
}

module.exports = new OCRController();
