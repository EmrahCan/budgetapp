const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class OCRService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-pro which supports vision
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  }

  /**
   * Process receipt image and extract data
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<Object>} Extracted receipt data
   */
  async processReceiptImage(imageBase64) {
    try {
      logger.info('🔍 Starting OCR processing for receipt image');
      
      // Validate input
      if (!imageBase64) {
        throw new Error('Image data is required');
      }

      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Create image part for Gemini
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };

      // Prompt for receipt data extraction
      const prompt = `
Bu fiş/fatura fotoğrafından aşağıdaki bilgileri çıkar ve JSON formatında döndür:

1. Toplam tutar (sadece sayı, para birimi olmadan)
2. Tarih (DD.MM.YYYY formatında)
3. Mağaza/İşletme adı
4. Güven skoru (0-100 arası, ne kadar emin olduğun)

Örnek çıktı:
{
  "total_amount": 125.50,
  "date": "08.12.2025",
  "merchant_name": "Migros",
  "confidence_score": 95,
  "raw_text": "Ham OCR metni buraya"
}

Eğer bilgi bulunamazsa null değer döndür. Sadece JSON döndür, başka açıklama yapma.
`;

      // Call Gemini Vision API
      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      logger.info('📄 Raw OCR response received');
      
      // Parse JSON response
      const extractedData = this.parseOCRResponse(text);
      
      logger.info('✅ OCR processing completed successfully', {
        hasAmount: !!extractedData.total_amount,
        hasDate: !!extractedData.date,
        hasMerchant: !!extractedData.merchant_name,
        confidence: extractedData.confidence_score
      });
      
      return extractedData;
      
    } catch (error) {
      logger.error('❌ OCR processing failed', {
        error: error.message,
        stack: error.stack
      });
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Parse OCR response and extract structured data
   * @param {string} responseText - Raw response from Gemini
   * @returns {Object} Parsed receipt data
   */
  parseOCRResponse(responseText) {
    try {
      // Clean response text
      let cleanText = responseText.trim();
      
      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to parse JSON
      const parsedData = JSON.parse(cleanText);
      
      // Validate and normalize data
      return {
        total_amount: this.parseAmount(parsedData.total_amount),
        date: this.parseDate(parsedData.date),
        merchant_name: this.parseMerchantName(parsedData.merchant_name),
        confidence_score: this.parseConfidence(parsedData.confidence_score),
        raw_text: parsedData.raw_text || responseText,
        processed_at: new Date().toISOString()
      };
      
    } catch (error) {
      logger.warn('⚠️ Failed to parse OCR JSON response, attempting fallback parsing', {
        error: error.message,
        responseText: responseText.substring(0, 200)
      });
      
      // Fallback: Try to extract data using regex
      return this.fallbackParsing(responseText);
    }
  }

  /**
   * Parse and validate amount
   * @param {any} amount - Raw amount value
   * @returns {number|null} Parsed amount
   */
  parseAmount(amount) {
    if (!amount) return null;
    
    // Convert to string and clean
    const amountStr = String(amount).replace(/[^0-9.,]/g, '');
    
    // Handle Turkish decimal format (comma as decimal separator)
    const normalizedAmount = amountStr.replace(',', '.');
    
    const parsed = parseFloat(normalizedAmount);
    return isNaN(parsed) ? null : Math.round(parsed * 100) / 100; // Round to 2 decimals
  }

  /**
   * Parse and validate date
   * @param {any} date - Raw date value
   * @returns {string|null} Parsed date in DD.MM.YYYY format
   */
  parseDate(date) {
    if (!date) return null;
    
    const dateStr = String(date).trim();
    
    // Try different date formats
    const dateFormats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];
    
    for (const format of dateFormats) {
      const match = dateStr.match(format);
      if (match) {
        let day, month, year;
        
        if (format.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD format
          [, year, month, day] = match;
        } else {
          // DD.MM.YYYY or DD/MM/YYYY format
          [, day, month, year] = match;
        }
        
        // Validate date
        const dateObj = new Date(year, month - 1, day);
        if (dateObj.getFullYear() == year && dateObj.getMonth() == month - 1 && dateObj.getDate() == day) {
          return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
        }
      }
    }
    
    return null;
  }

  /**
   * Parse and clean merchant name
   * @param {any} merchantName - Raw merchant name
   * @returns {string|null} Cleaned merchant name
   */
  parseMerchantName(merchantName) {
    if (!merchantName) return null;
    
    const cleaned = String(merchantName).trim();
    return cleaned.length > 0 ? cleaned : null;
  }

  /**
   * Parse and validate confidence score
   * @param {any} confidence - Raw confidence value
   * @returns {number} Confidence score (0-100)
   */
  parseConfidence(confidence) {
    const parsed = parseInt(confidence);
    if (isNaN(parsed)) return 50; // Default confidence
    return Math.max(0, Math.min(100, parsed)); // Clamp between 0-100
  }

  /**
   * Fallback parsing using regex when JSON parsing fails
   * @param {string} text - Raw OCR text
   * @returns {Object} Extracted data
   */
  fallbackParsing(text) {
    logger.info('🔄 Using fallback parsing method');
    
    const result = {
      total_amount: null,
      date: null,
      merchant_name: null,
      confidence_score: 30, // Lower confidence for fallback
      raw_text: text,
      processed_at: new Date().toISOString()
    };
    
    // Try to extract total amount
    const amountPatterns = [
      /toplam[:\s]*([0-9.,]+)/i,
      /total[:\s]*([0-9.,]+)/i,
      /genel\s*toplam[:\s]*([0-9.,]+)/i,
      /([0-9.,]+)\s*₺/,
      /([0-9.,]+)\s*tl/i
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.total_amount = this.parseAmount(match[1]);
        if (result.total_amount) break;
      }
    }
    
    // Try to extract date
    const datePattern = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/;
    const dateMatch = text.match(datePattern);
    if (dateMatch) {
      result.date = this.parseDate(dateMatch[0]);
    }
    
    return result;
  }

  /**
   * Validate image data
   * @param {string} imageBase64 - Base64 image data
   * @returns {boolean} Is valid
   */
  validateImage(imageBase64) {
    if (!imageBase64) return false;
    
    // Check if it's a valid base64 image
    const base64Pattern = /^data:image\/(jpeg|jpg|png|gif);base64,/;
    return base64Pattern.test(imageBase64);
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      service: 'OCRService',
      status: 'healthy',
      gemini_api_configured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new OCRService();
