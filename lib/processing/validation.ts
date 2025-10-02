// Vision API Validation Pipeline
// Catches bad extractions before they reach the timeline

interface ExtractionValidation {
  valid: boolean
  issues: string[]
  needs_review: boolean
  confidence_adjusted: number
}

// Date validation helper
const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return date instanceof Date && 
         !isNaN(date.getTime()) && 
         date.getFullYear() >= 2000 && 
         date.getFullYear() <= new Date().getFullYear() + 1
}

// Robust mileage extraction with comprehensive patterns
export const extractMiles = (payload: any): number | null => {
  // Try structured data first
  const structuredSources = [
    payload?.extracted_data?.odometer_reading,
    payload?.extracted_data?.mileage,
    payload?.miles,
    payload?.document_details?.mileage
  ]
  
  for (const source of structuredSources) {
    if (typeof source === 'number' && source > 0 && source < 999999) {
      return source
    }
    if (typeof source === 'string') {
      const parsed = parseInt(source.replace(/[,\s]/g, ''))
      if (!isNaN(parsed) && parsed > 0 && parsed < 999999) {
        return parsed
      }
    }
  }
  
  // Comprehensive text parsing patterns
  const textSources = [
    payload?.extracted_data?.raw_text,
    payload?.extracted_data?.header,
    payload?.extracted_data?.body
  ].filter(Boolean)
  
  const patterns = [
    // "MILEAGE: 45,678" or "Miles: 45678" or "Odometer Reading: 45,678"
    /(?:MILEAGE|MILES|ODOMETER)[\s:]+(\d{1,3}(?:,\d{3})*)/i,
    
    // "MILEAGE IN: 45,678 OUT: 45,690" (prefer OUT)
    /(?:MILEAGE\s+)?IN[:\s]*(\d{1,3}(?:,\d{3})*)[,\s]*OUT[:\s]*(\d{1,3}(?:,\d{3})*)/i,
    
    // "45678/45690" (slash format, prefer second)
    /(\d{5,6})\/(\d{5,6})/,
    
    // "Current: 45,678" or "Reading: 45678"
    /(?:CURRENT|READING)[:\s]+(\d{1,3}(?:,\d{3})*)/i,
    
    // Standalone 5-6 digit numbers (last resort)
    /\b(\d{5,6})\b/
  ]
  
  for (const text of textSources) {
    for (let i = 0; i < patterns.length; i++) {
      const match = text.match(patterns[i])
      if (match) {
        // For IN/OUT and slash patterns, prefer the second (OUT) value
        const mileageStr = (i === 1 || i === 2) && match[2] ? match[2] : match[1]
        const miles = parseInt(mileageStr.replace(/,/g, ''))
        
        // Validate reasonable mileage range
        if (!isNaN(miles) && miles >= 1000 && miles <= 999999) {
          return miles
        }
      }
    }
  }
  
  return null
}

// Main validation function
export const validateExtraction = (extracted: any, originalConfidence: number): ExtractionValidation => {
  const issues: string[] = []
  let confidenceAdjustment = 0
  
  // Vendor validation
  const invalidVendors = ['not visible', 'unknown', 'n/a', 'null', 'undefined', '', 'not found']
  if (!extracted.vendor || invalidVendors.includes(extracted.vendor.toLowerCase().trim())) {
    issues.push('vendor_unclear')
    confidenceAdjustment -= 15
  }
  
  // Financial data validation
  if (extracted.total_amount) {
    if (typeof extracted.total_amount !== 'number' || extracted.total_amount <= 0) {
      issues.push('amount_invalid')
      confidenceAdjustment -= 20
    } else if (originalConfidence < 85) {
      issues.push('amount_uncertain')
      confidenceAdjustment -= 10
    }
  }
  
  // Date validation
  if (extracted.date && !isValidDate(extracted.date)) {
    issues.push('date_invalid')
    confidenceAdjustment -= 10
  }
  
  // Mileage validation using robust extraction
  const extractedMiles = extractMiles({ extracted_data: extracted })
  if (extracted.mileage && !extractedMiles) {
    issues.push('mileage_invalid')
    confidenceAdjustment -= 10
  }
  
  // Critical field missing
  const hasEssentialData = extracted.vendor || extracted.total_amount || extracted.services_performed
  if (!hasEssentialData) {
    issues.push('insufficient_data')
    confidenceAdjustment -= 25
  }
  
  const adjustedConfidence = Math.max(0, Math.min(100, originalConfidence + confidenceAdjustment))
  
  return {
    valid: issues.length === 0,
    issues,
    needs_review: issues.length > 0 || adjustedConfidence < 70,
    confidence_adjusted: adjustedConfidence
  }
}

// Priority determination for review queue
export const determinePriority = (issues: string[]): 'high' | 'medium' | 'low' => {
  const highPriorityIssues = ['amount_invalid', 'insufficient_data', 'extraction_failed']
  const mediumPriorityIssues = ['amount_uncertain', 'vendor_unclear']
  
  if (issues.some(issue => highPriorityIssues.includes(issue))) {
    return 'high'
  }
  
  if (issues.some(issue => mediumPriorityIssues.includes(issue))) {
    return 'medium'
  }
  
  return 'low'
}

// Integration function for processing pipeline
export const processDocument = async (imageUrl: string, eventType: string) => {
  try {
    // This would integrate with your existing Vision API call
    // const rawExtraction = await visionAPI.extractData(imageUrl)
    
    // For now, return a mock structure showing the integration point
    const mockRawExtraction = {
      extracted_data: {
        vendor: 'Sample Shop',
        total_amount: 755.81,
        date: '2024-01-15'
      },
      confidence: 92
    }
    
    // Validate extraction
    const validation = validateExtraction(mockRawExtraction.extracted_data, mockRawExtraction.confidence)
    
    // Enhanced payload with validation
    const payload = {
      ...mockRawExtraction,
      confidence: validation.confidence_adjusted,
      validation: {
        rollup: validation.needs_review ? 'needs_review' : 'validated',
        issues: validation.issues,
        original_confidence: mockRawExtraction.confidence
      }
    }
    
    // Flag for manual review if needed
    if (validation.needs_review) {
      await flagForReview(payload, validation.issues)
    }
    
    return payload
    
  } catch (error) {
    // Fallback to manual entry mode
    return {
      extracted_data: {},
      confidence: 0,
      validation: {
        rollup: 'needs_review',
        issues: ['extraction_failed'],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Review queue integration
interface ReviewItem {
  id: string
  event_payload: any
  issues: string[]
  priority: 'high' | 'medium' | 'low'
  created_at: string
  assigned_to?: string
}

const flagForReview = async (payload: any, issues: string[]): Promise<void> => {
  const priority = determinePriority(issues)
  
  const reviewItem: ReviewItem = {
    id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    event_payload: payload,
    issues,
    priority,
    created_at: new Date().toISOString()
  }
  
  // In a real implementation, this would save to your database
  console.log('Flagged for review:', reviewItem)
  
  // Notify review team for high priority items
  if (priority === 'high') {
    await notifyReviewTeam(reviewItem)
  }
}

const notifyReviewTeam = async (reviewItem: ReviewItem): Promise<void> => {
  // In a real implementation, this would send notifications
  console.log('High priority review needed:', reviewItem.id, reviewItem.issues)
}
