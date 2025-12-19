// Manuel OCR Test Script
const fs = require('fs');

// Simulate OCR response parsing
function parseOCRResponse(responseText) {
  const result = {
    total_amount: null,
    date: null,
    merchant_name: null,
    confidence_score: 30, // Lower confidence for fallback
    raw_text: responseText,
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
    const match = responseText.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/[^0-9.,]/g, '');
      const normalizedAmount = amountStr.replace(',', '.');
      const parsed = parseFloat(normalizedAmount);
      if (!isNaN(parsed)) {
        result.total_amount = Math.round(parsed * 100) / 100;
        break;
      }
    }
  }
  
  // Try to extract date
  const datePattern = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/;
  const dateMatch = responseText.match(datePattern);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    result.date = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
  }
  
  // Try to extract merchant name (first line usually)
  const lines = responseText.split('\n');
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length > 2 && firstLine.length < 50) {
      result.merchant_name = firstLine;
    }
  }
  
  return result;
}

// Test with sample receipt text
const sampleReceiptText = `MIGROS
TARIH: 08.12.2025 14:30
KASIYER: AYŞE
--------------------------
EKMEK                 3.50
SÜT 1LT              12.75
PEYNIR 500GR         45.80
DOMATES 1KG          15.25
--------------------------
ARA TOPLAM:          77.30
KDV %8:               6.18
GENEL TOPLAM:        83.48 TL
--------------------------
NAKİT:               90.00
PARA ÜSTÜ:            6.52
TEŞEKKÜRLER`;

console.log('🔍 OCR Test Sonucu:');
console.log(JSON.stringify(parseOCRResponse(sampleReceiptText), null, 2));