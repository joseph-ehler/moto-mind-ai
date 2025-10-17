/**
 * Event Validation Utilities
 * 
 * Detects duplicates, validates mileage, and provides warnings
 */

export interface ValidationWarning {
  type: 'duplicate' | 'mileage_decrease' | 'mileage_jump' | 'missing_data'
  severity: 'warning' | 'error' | 'info'
  message: string
  details?: string
}

export interface EventValidationResult {
  isValid: boolean
  warnings: ValidationWarning[]
}

/**
 * Check for duplicate events
 * Returns warning if similar event exists within time window
 */
export function checkDuplicateEvent(
  newEvent: {
    type: string
    date: Date
    miles?: number
    cost?: number
  },
  existingEvents: Array<{
    type: string
    date: Date | string
    miles?: number
    cost?: number
  }>,
  timeWindowMinutes: number = 5
): ValidationWarning | null {
  const newDate = new Date(newEvent.date).getTime()
  
  for (const existing of existingEvents) {
    const existingDate = new Date(existing.date).getTime()
    const timeDiff = Math.abs(newDate - existingDate) / (1000 * 60) // minutes
    
    // Check if within time window and same type
    if (timeDiff <= timeWindowMinutes && existing.type === newEvent.type) {
      // Check if values are similar
      const mileageSimilar = !newEvent.miles || !existing.miles || 
        Math.abs(newEvent.miles - existing.miles) < 10
      const costSimilar = !newEvent.cost || !existing.cost || 
        Math.abs(newEvent.cost - existing.cost) < 1
      
      if (mileageSimilar && costSimilar) {
        return {
          type: 'duplicate',
          severity: 'warning',
          message: 'Possible duplicate event',
          details: `Similar ${newEvent.type} event logged ${Math.round(timeDiff)} minutes ago`
        }
      }
    }
  }
  
  return null
}

/**
 * Validate mileage against previous events
 * Detects decreases and suspicious jumps
 */
export function validateMileage(
  newMileage: number,
  existingEvents: Array<{
    date: Date | string
    miles?: number
  }>
): ValidationWarning | null {
  if (!newMileage || newMileage <= 0) return null
  
  // Find most recent event with mileage
  const eventsWithMiles = existingEvents
    .filter(e => e.miles && e.miles > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (eventsWithMiles.length === 0) return null
  
  const lastEvent = eventsWithMiles[0]
  const lastMileage = lastEvent.miles!
  const difference = newMileage - lastMileage
  
  // Check for decrease
  if (difference < 0) {
    return {
      type: 'mileage_decrease',
      severity: 'error',
      message: 'Mileage decreased',
      details: `New mileage (${newMileage.toLocaleString()}) is less than last recorded (${lastMileage.toLocaleString()}). This might indicate a rollback or error.`
    }
  }
  
  // Check for suspicious jump (>10,000 miles)
  if (difference > 10000) {
    return {
      type: 'mileage_jump',
      severity: 'warning',
      message: 'Large mileage increase',
      details: `New mileage increased by ${difference.toLocaleString()} miles. Please verify this is correct.`
    }
  }
  
  return null
}

/**
 * Validate event data completeness
 * Suggests missing fields that would be useful
 */
export function checkMissingData(event: {
  type: string
  cost?: number
  [key: string]: any
}): ValidationWarning | null {
  const suggestions: string[] = []
  
  switch (event.type) {
    case 'fuel':
      if (!event.cost) suggestions.push('cost')
      if (!event.gallons) suggestions.push('gallons')
      if (!event.station_name) suggestions.push('station name')
      break
      
    case 'service':
    case 'maintenance':
      if (!event.cost) suggestions.push('cost')
      if (!event.vendor_name) suggestions.push('vendor')
      if (!event.service_type) suggestions.push('service type')
      break
      
    case 'damage':
      if (!event.severity) suggestions.push('severity')
      if (!event.location) suggestions.push('location')
      break
  }
  
  if (suggestions.length === 0) return null
  
  return {
    type: 'missing_data',
    severity: 'info',
    message: 'Consider adding more details',
    details: `You can add: ${suggestions.join(', ')}`
  }
}

/**
 * Run all validations on an event
 */
export function validateEvent(
  newEvent: {
    type: string
    date: Date
    miles?: number
    cost?: number
    [key: string]: any
  },
  existingEvents: Array<{
    type: string
    date: Date | string
    miles?: number
    cost?: number
  }>
): EventValidationResult {
  const warnings: ValidationWarning[] = []
  
  // Check for duplicates
  const duplicateWarning = checkDuplicateEvent(newEvent, existingEvents)
  if (duplicateWarning) warnings.push(duplicateWarning)
  
  // Validate mileage
  if (newEvent.miles) {
    const mileageWarning = validateMileage(newEvent.miles, existingEvents)
    if (mileageWarning) warnings.push(mileageWarning)
  }
  
  // Check for missing data
  const missingDataWarning = checkMissingData(newEvent)
  if (missingDataWarning) warnings.push(missingDataWarning)
  
  // Event is invalid if there are any errors
  const hasErrors = warnings.some(w => w.severity === 'error')
  
  return {
    isValid: !hasErrors,
    warnings
  }
}

/**
 * Inline field validation for real-time feedback
 * Returns error message if invalid, null if valid
 */
export function validateField(
  fieldName: string,
  value: any,
  context?: {
    previousMiles?: number
    maxDate?: Date
  }
): string | null {
  // Empty values are handled by required field validation
  if (value === null || value === undefined || value === '') {
    return null
  }

  switch (fieldName) {
    case 'total_amount':
      const amount = parseFloat(value)
      if (isNaN(amount)) return 'Must be a number'
      if (amount <= 0) return 'Must be greater than $0'
      if (amount > 10000) return 'Amount seems too high (max $10,000)'
      break

    case 'gallons':
      const gallons = parseFloat(value)
      if (isNaN(gallons)) return 'Must be a number'
      if (gallons <= 0) return 'Must be greater than 0'
      if (gallons > 100) return 'Exceeds typical tank capacity (100 gal)'
      if (gallons < 0.1) return 'Must be at least 0.1 gallon'
      break

    case 'miles':
      const miles = parseInt(value)
      if (isNaN(miles)) return 'Must be a number'
      if (miles < 0) return 'Cannot be negative'
      if (miles > 9999999) return 'Mileage too high'
      if (context?.previousMiles && miles < context.previousMiles) {
        return `Cannot be less than previous odometer (${context.previousMiles.toLocaleString()} mi)`
      }
      break

    case 'date':
      const date = new Date(value)
      const maxDate = context?.maxDate || new Date()
      if (isNaN(date.getTime())) return 'Invalid date'
      if (date > maxDate) return 'Cannot be in the future'
      // Don't allow dates before 1900
      if (date.getFullYear() < 1900) return 'Date too far in the past'
      break

    case 'tax_amount':
      const tax = parseFloat(value)
      if (isNaN(tax)) return 'Must be a number'
      if (tax < 0) return 'Cannot be negative'
      if (tax > 1000) return 'Tax amount seems too high'
      break
  }

  return null
}
