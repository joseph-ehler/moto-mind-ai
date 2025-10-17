// Document Validation Module
// Handles validation, sanitization, and confidence scoring

export function rollupValidation(validation: any): { rollup: string; reason?: string } {
  if (!validation || typeof validation !== 'object') {
    return { rollup: 'low_confidence', reason: 'No validation data available' }
  }
  
  // Check for high confidence indicators
  const highConfidenceFields = ['vendor', 'total_amount', 'date', 'mileage']
  const validFields = highConfidenceFields.filter(field => 
    validation[field] && validation[field].confidence > 0.8
  )
  
  if (validFields.length >= 3) {
    return { rollup: 'ok' }
  }
  
  // Check for medium confidence
  if (validFields.length >= 2) {
    return { rollup: 'needs_review', reason: 'Some fields have low confidence' }
  }
  
  // Low confidence
  const reasons = []
  highConfidenceFields.forEach(field => {
    if (!validation[field] || validation[field].confidence < 0.5) {
      reasons.push(field)
    }
  })
  
  return { 
    rollup: 'low_confidence', 
    reason: `Low confidence in: ${reasons.join(', ')}` 
  }
}

export function validateOdometerReading(visionData: any): {value: number, notes: string[], confidence: number} | null {
  if (!visionData) return null
  
  const notes = []
  let confidence = 0.8 // Start with high confidence
  
  // Extract mileage value
  const mileageValue = extractMileageValue(visionData)
  if (!mileageValue) return null
  
  // Validate range
  if (mileageValue < 0) {
    notes.push('Negative mileage detected')
    confidence = 0.1
  } else if (mileageValue > 1000000) {
    notes.push('Unusually high mileage (>1M miles)')
    confidence = 0.3
  } else if (mileageValue > 500000) {
    notes.push('High mileage vehicle (>500K miles)')
    confidence = 0.7
  }
  
  // Check for reasonable increments
  if (mileageValue % 1 !== 0) {
    notes.push('Non-integer mileage reading')
    confidence = Math.min(confidence, 0.6)
  }
  
  // Check for common OCR errors
  const mileageStr = mileageValue.toString()
  if (mileageStr.length < 3) {
    notes.push('Unusually low mileage reading')
    confidence = Math.min(confidence, 0.4)
  }
  
  // Validate against service context
  if (visionData.service_type && mileageValue < 1000) {
    notes.push('Low mileage for service record')
    confidence = Math.min(confidence, 0.5)
  }
  
  return {
    value: Math.round(mileageValue),
    notes,
    confidence
  }
}

function extractMileageValue(visionData: any): number | null {
  // Try multiple sources for mileage
  const sources = [
    'odometer_reading',
    'mileage', 
    'miles',
    'current_mileage',
    'vehicle_mileage'
  ]
  
  for (const source of sources) {
    if (visionData[source] !== undefined && visionData[source] !== null) {
      const value = typeof visionData[source] === 'number' 
        ? visionData[source]
        : parseFloat(String(visionData[source]).replace(/[^\d.]/g, ''))
      
      if (!isNaN(value) && value >= 0) {
        return value
      }
    }
  }
  
  return null
}

export function classifyDocument(visionData: any): {
  type: string;
  confidence: number;
  indicators: string[];
} {
  const indicators = []
  let confidence = 0.5
  
  if (!visionData || typeof visionData !== 'object') {
    return {
      type: 'unknown',
      confidence: 0.1,
      indicators: ['No vision data available']
    }
  }
  
  // Service invoice indicators
  if (visionData.service_description || visionData.work_performed) {
    indicators.push('Service description found')
    confidence += 0.3
  }
  
  if (visionData.line_items && Array.isArray(visionData.line_items)) {
    indicators.push('Line items detected')
    confidence += 0.2
  }
  
  if (visionData.labor_cost || visionData.parts_cost) {
    indicators.push('Labor/parts costs found')
    confidence += 0.2
  }
  
  // Fuel receipt indicators
  if (visionData.fuel_amount || visionData.gallons) {
    indicators.push('Fuel data detected')
    return {
      type: 'fuel_receipt',
      confidence: Math.min(confidence + 0.4, 1.0),
      indicators
    }
  }
  
  // Insurance document indicators
  if (visionData.policy_number || visionData.coverage) {
    indicators.push('Insurance data detected')
    return {
      type: 'insurance_document',
      confidence: Math.min(confidence + 0.3, 1.0),
      indicators
    }
  }
  
  // Registration indicators
  if (visionData.registration_number || visionData.license_plate) {
    indicators.push('Registration data detected')
    return {
      type: 'registration',
      confidence: Math.min(confidence + 0.3, 1.0),
      indicators
    }
  }
  
  // Default to service invoice if we have basic service indicators
  if (confidence > 0.7) {
    return {
      type: 'service_invoice',
      confidence,
      indicators
    }
  }
  
  return {
    type: 'unknown',
    confidence: Math.max(confidence, 0.1),
    indicators: indicators.length > 0 ? indicators : ['Document type unclear']
  }
}

export function validateAndSanitizeAmounts(result: any): any {
  if (!result || typeof result !== 'object') {
    return result
  }
  
  const sanitized = { ...result }
  
  // Amount fields to validate
  const amountFields = [
    'total_amount',
    'subtotal',
    'tax_amount',
    'labor_cost',
    'parts_cost',
    'fuel_amount'
  ]
  
  amountFields.forEach(field => {
    if (sanitized[field] !== undefined && sanitized[field] !== null) {
      const amount = sanitizeAmount(sanitized[field])
      if (amount !== null) {
        sanitized[field] = amount
        
        // Add validation metadata
        if (!sanitized.validation) sanitized.validation = {}
        sanitized.validation[field] = {
          original: result[field],
          sanitized: amount,
          confidence: validateAmountConfidence(amount)
        }
      } else {
        // Remove invalid amounts
        delete sanitized[field]
      }
    }
  })
  
  // Validate amount relationships
  if (sanitized.subtotal && sanitized.tax_amount && sanitized.total_amount) {
    const calculatedTotal = sanitized.subtotal + sanitized.tax_amount
    const difference = Math.abs(calculatedTotal - sanitized.total_amount)
    
    if (difference > 0.02) { // Allow for rounding differences
      if (!sanitized.validation) sanitized.validation = {}
      sanitized.validation.amount_mismatch = {
        calculated: calculatedTotal,
        stated: sanitized.total_amount,
        difference
      }
    }
  }
  
  return sanitized
}

function sanitizeAmount(value: any): number | null {
  if (value === null || value === undefined) return null
  
  // Handle numeric values
  if (typeof value === 'number') {
    return isNaN(value) || value < 0 ? null : Math.round(value * 100) / 100
  }
  
  // Handle string values
  if (typeof value === 'string') {
    // Remove currency symbols and clean up
    const cleaned = value
      .replace(/[$€£¥₹]/g, '')
      .replace(/[,\s]/g, '')
      .trim()
    
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) || parsed < 0 ? null : Math.round(parsed * 100) / 100
  }
  
  return null
}

function validateAmountConfidence(amount: number): number {
  if (amount <= 0) return 0.1
  if (amount > 50000) return 0.3 // Unusually high
  if (amount < 0.01) return 0.2 // Unusually low
  
  // Reasonable amounts get high confidence
  return 0.9
}
