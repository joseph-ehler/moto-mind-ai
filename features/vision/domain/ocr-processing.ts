/**
 * OCR Processing Domain Logic
 * 
 * Pure functions for OCR text extraction and processing.
 * No React or UI dependencies.
 * 
 * Extracted to separate concerns (AI recommendation for decoupling).
 */

export interface OCRWord {
  text: string
  confidence: number
  boundingBox?: number[]
}

export interface OCRResult {
  text: string
  confidence: number
  language?: string
  words?: OCRWord[]
}

export interface OCRProcessingResult {
  success: boolean
  result?: OCRResult
  error?: string
}

/**
 * Validate OCR confidence threshold
 * 
 * @param confidence - Confidence score (0-1)
 * @param threshold - Minimum acceptable confidence (default: 0.7)
 * @returns true if confidence meets threshold
 */
export function isConfidenceAcceptable(
  confidence: number,
  threshold: number = 0.7
): boolean {
  return confidence >= threshold
}

/**
 * Extract structured data from OCR text
 * 
 * @param text - Raw OCR text
 * @returns Parsed structured data
 */
export function parseOCRText(text: string): Record<string, string> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  const data: Record<string, string> = {}

  for (const line of lines) {
    // Look for key-value patterns
    const colonMatch = line.match(/^([^:]+):\s*(.+)$/)
    if (colonMatch) {
      const [, key, value] = colonMatch
      data[key.trim().toLowerCase().replace(/\s+/g, '_')] = value.trim()
    }
  }

  return data
}

/**
 * Clean OCR text by removing noise and formatting
 * 
 * @param text - Raw OCR text
 * @returns Cleaned text
 */
export function cleanOCRText(text: string): string {
  return text
    .replace(/[^\w\s\-.,;:()]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Calculate average confidence from OCR words
 * 
 * @param words - Array of OCR words with confidence scores
 * @returns Average confidence (0-1)
 */
export function calculateAverageConfidence(words: OCRWord[]): number {
  if (words.length === 0) return 0

  const sum = words.reduce((acc, word) => acc + word.confidence, 0)
  return sum / words.length
}

/**
 * Filter OCR words by confidence threshold
 * 
 * @param words - Array of OCR words
 * @param threshold - Minimum confidence (default: 0.7)
 * @returns Filtered words meeting threshold
 */
export function filterByConfidence(
  words: OCRWord[],
  threshold: number = 0.7
): OCRWord[] {
  return words.filter(word => word.confidence >= threshold)
}

/**
 * Extract text from high-confidence words only
 * 
 * @param words - Array of OCR words
 * @param threshold - Minimum confidence
 * @returns Concatenated text from confident words
 */
export function getConfidentText(
  words: OCRWord[],
  threshold: number = 0.7
): string {
  return filterByConfidence(words, threshold)
    .map(word => word.text)
    .join(' ')
}

/**
 * Detect if OCR result contains specific keywords
 * 
 * @param text - OCR text to search
 * @param keywords - Array of keywords to find
 * @param caseSensitive - Whether to match case (default: false)
 * @returns true if any keyword is found
 */
export function containsKeywords(
  text: string,
  keywords: string[],
  caseSensitive: boolean = false
): boolean {
  const searchText = caseSensitive ? text : text.toLowerCase()
  return keywords.some(keyword => {
    const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase()
    return searchText.includes(searchKeyword)
  })
}

/**
 * Extract specific field from OCR text using patterns
 * 
 * @param text - OCR text
 * @param patterns - Array of regex patterns to try
 * @returns Matched value or null
 */
export function extractField(
  text: string,
  patterns: RegExp[]
): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

/**
 * Common patterns for document field extraction
 */
export const COMMON_PATTERNS = {
  licenseNumber: [
    /license\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
    /DL\s*#?\s*:?\s*([A-Z0-9\-]+)/i
  ],
  dateOfBirth: [
    /DOB\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /birth\s*date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ],
  expirationDate: [
    /exp(?:ires|iration)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /valid\s*until\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
  ],
  vin: [
    /VIN\s*:?\s*([A-HJ-NPR-Z0-9]{17})/i,
    /vehicle\s*identification\s*number\s*:?\s*([A-HJ-NPR-Z0-9]{17})/i
  ]
}

/**
 * Validate VIN (Vehicle Identification Number)
 * 
 * @param vin - VIN string to validate
 * @returns true if valid VIN format
 */
export function isValidVIN(vin: string): boolean {
  if (vin.length !== 17) return false
  
  // VIN should not contain I, O, or Q
  if (/[IOQ]/.test(vin.toUpperCase())) return false
  
  // Should be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())) return false
  
  return true
}

/**
 * Detect document type from OCR text
 * 
 * @param text - OCR text content
 * @returns Detected document type
 */
export function detectDocumentType(text: string): string {
  const lowercaseText = text.toLowerCase()

  const typeIndicators = [
    { keywords: ['driver', 'license', 'dl'], type: 'drivers_license' },
    { keywords: ['registration', 'vehicle registration'], type: 'registration' },
    { keywords: ['insurance', 'policy', 'coverage'], type: 'insurance_card' },
    { keywords: ['inspection', 'emission'], type: 'inspection_report' },
    { keywords: ['invoice', 'receipt', 'payment'], type: 'invoice' }
  ]

  for (const indicator of typeIndicators) {
    if (containsKeywords(lowercaseText, indicator.keywords)) {
      return indicator.type
    }
  }

  return 'unknown'
}
