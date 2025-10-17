// Simplified Vision Prompts - Focused on Essential Fields
// Reduces hallucination by requesting only what's actually visible

export interface PromptConfig {
  documentType: string
  prompt: string
  expectedFields: string[]
  fallbackValue: any
}

// Driver-focused prompts that match timeline display needs
export const SIMPLIFIED_PROMPTS: Record<string, PromptConfig> = {
  odometer: {
    documentType: 'odometer',
    prompt: 'Extract the odometer reading. Return only the number of miles/kilometers shown.',
    expectedFields: ['mileage'],
    fallbackValue: { mileage: null }
  },

  fuel: {
    documentType: 'fuel',
    prompt: `Extract fuel receipt data. Return JSON:
{
  "station": "station name",
  "total": 0.00,
  "gallons": 0.0,
  "date": "YYYY-MM-DD"
}
Only include fields you can clearly see.`,
    expectedFields: ['station', 'total', 'gallons', 'date'],
    fallbackValue: { station: null, total: null, gallons: null, date: null }
  },

  service: {
    documentType: 'service',
    prompt: `Extract service information. Return JSON:
{
  "shop": "business name",
  "services": ["oil change", "filter replacement"],
  "total": 0.00,
  "date": "YYYY-MM-DD",
  "mileage": 0
}
Only include what you can clearly read.`,
    expectedFields: ['shop', 'services', 'total', 'date', 'mileage'],
    fallbackValue: { shop: null, services: [], total: null, date: null, mileage: null }
  },

  insurance: {
    documentType: 'insurance',
    prompt: `Extract insurance information. Return JSON:
{
  "company": "insurance company name",
  "policy": "policy number",
  "expires": "YYYY-MM-DD",
  "coverage": "coverage type"
}
Only extract clearly visible information.`,
    expectedFields: ['company', 'policy', 'expires', 'coverage'],
    fallbackValue: { company: null, policy: null, expires: null, coverage: null }
  },

  registration: {
    documentType: 'registration',
    prompt: `Extract vehicle registration data. Return JSON:
{
  "year": 2020,
  "make": "Honda",
  "model": "Civic",
  "vin": "VIN number",
  "plate": "license plate",
  "expires": "YYYY-MM-DD"
}
Only include clearly readable fields.`,
    expectedFields: ['year', 'make', 'model', 'vin', 'plate', 'expires'],
    fallbackValue: { year: null, make: null, model: null, vin: null, plate: null, expires: null }
  },

  vin: {
    documentType: 'vin',
    prompt: 'Extract the 17-character VIN number. Return only the VIN.',
    expectedFields: ['vin'],
    fallbackValue: { vin: null }
  },

  license_plate: {
    documentType: 'license_plate',
    prompt: 'Extract the license plate number. Return only the plate number.',
    expectedFields: ['plate'],
    fallbackValue: { plate: null }
  },

  dashboard_snapshot: {
    documentType: 'dashboard_snapshot',
    prompt: `Extract dashboard information. Return JSON:
{
  "odometer_miles": 52205,
  "fuel_level": {"type": "eighths", "value": 6},
  "warning_lights": ["tpms", "check_engine"],
  "oil_life_percent": 45,
  "service_message": "Service due soon"
}
Only extract clearly visible data. Use null for unreadable fields.`,
    expectedFields: ['odometer_miles', 'fuel_level', 'warning_lights', 'oil_life_percent', 'service_message'],
    fallbackValue: { 
      odometer_miles: null, 
      fuel_level: null, 
      warning_lights: null, 
      oil_life_percent: null, 
      service_message: null 
    }
  }
}

// Get prompt for document type with fallback
export function getPrompt(documentType: string): PromptConfig {
  return SIMPLIFIED_PROMPTS[documentType] || {
    documentType: 'unknown',
    prompt: 'Extract key information from this document. Return simple JSON with only clearly visible data.',
    expectedFields: ['type', 'date', 'amount'],
    fallbackValue: { type: null, date: null, amount: null }
  }
}

// Validate extracted data against expected fields
export function validateExtraction(
  extracted: any, 
  expectedFields: string[]
): { isValid: boolean, missingFields: string[], confidence: number } {
  
  const missingFields: string[] = []
  let validFields = 0
  
  for (const field of expectedFields) {
    const value = extracted[field]
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      missingFields.push(field)
    } else {
      validFields++
    }
  }
  
  const confidence = (validFields / expectedFields.length) * 100
  const isValid = confidence >= 50 // At least 50% of expected fields
  
  return { isValid, missingFields, confidence }
}

// Clean extracted data to remove hallucinated fields
export function cleanExtraction(extracted: any, expectedFields: string[]): any {
  const cleaned: any = {}
  
  // Only keep expected fields
  for (const field of expectedFields) {
    if (extracted.hasOwnProperty(field)) {
      const value = extracted[field]
      
      // Filter out obvious hallucinations
      if (typeof value === 'string') {
        const lowercaseValue = value.toLowerCase()
        const hallucinations = [
          'not visible', 'not found', 'unclear', 'unknown', 'n/a', 'null',
          'cannot determine', 'not specified', 'not available', 'not shown'
        ]
        
        if (!hallucinations.some(h => lowercaseValue.includes(h))) {
          cleaned[field] = value
        }
      } else if (typeof value === 'number' && value > 0) {
        cleaned[field] = value
      } else if (Array.isArray(value) && value.length > 0) {
        // Filter out hallucinated array items
        const cleanedArray = value.filter(item => 
          typeof item === 'string' && 
          !item.toLowerCase().includes('not') &&
          item.length > 0
        )
        if (cleanedArray.length > 0) {
          cleaned[field] = cleanedArray
        }
      }
    }
  }
  
  return cleaned
}

// Generate driver-friendly summary for timeline display
export function generateTimelineSummary(
  documentType: string, 
  extractedData: any
): { primary: string, secondary: string, context: string } {
  
  switch (documentType) {
    case 'fuel':
      const gallons = extractedData.gallons
      const total = extractedData.total
      const station = extractedData.station
      const pricePerGal = gallons && total ? (total / gallons).toFixed(2) : null
      
      return {
        primary: `Fuel${gallons ? ` • ${gallons} gal` : ''}${pricePerGal ? ` @ $${pricePerGal}/gal` : ''}`,
        secondary: `${station || 'Gas station'}${total ? ` • $${total}` : ''}${extractedData.date ? ` • ${extractedData.date}` : ''}`,
        context: extractedData.mileage ? `At ${extractedData.mileage.toLocaleString()} mi` : ''
      }
      
    case 'service':
      const services = Array.isArray(extractedData.services) ? extractedData.services.join(', ') : 'Service'
      
      return {
        primary: `${services}`,
        secondary: `${extractedData.shop || 'Service shop'}${extractedData.total ? ` • $${extractedData.total}` : ''}${extractedData.date ? ` • ${extractedData.date}` : ''}`,
        context: extractedData.mileage ? `At ${extractedData.mileage.toLocaleString()} mi` : ''
      }
      
    case 'odometer':
      return {
        primary: `${extractedData.mileage?.toLocaleString() || 'Unknown'} mi`,
        secondary: 'Odometer reading updated',
        context: ''
      }
      
    case 'insurance':
      return {
        primary: `Insurance ${extractedData.coverage ? `• ${extractedData.coverage}` : ''}`,
        secondary: `${extractedData.company || 'Insurance company'}${extractedData.policy ? ` • Policy #${extractedData.policy}` : ''}`,
        context: extractedData.expires ? `Expires ${extractedData.expires}` : ''
      }
      
    case 'registration':
      const vehicle = [extractedData.year, extractedData.make, extractedData.model]
        .filter(Boolean).join(' ')
      
      return {
        primary: `Registration${vehicle ? ` • ${vehicle}` : ''}`,
        secondary: `${extractedData.plate ? `Plate: ${extractedData.plate}` : ''}${extractedData.vin ? ` • VIN: ${extractedData.vin}` : ''}`,
        context: extractedData.expires ? `Expires ${extractedData.expires}` : ''
      }
      
    default:
      return {
        primary: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} document`,
        secondary: 'Document processed',
        context: ''
      }
  }
}

// Confidence scoring based on field completeness
export function calculateConfidence(
  extractedData: any, 
  expectedFields: string[],
  documentType: string
): number {
  const validation = validateExtraction(extractedData, expectedFields)
  let confidence = validation.confidence
  
  // Boost confidence for critical fields
  const criticalFields = {
    'fuel': ['total', 'gallons'],
    'service': ['shop', 'total'],
    'odometer': ['mileage'],
    'insurance': ['company', 'policy'],
    'registration': ['make', 'model']
  }
  
  const critical = criticalFields[documentType as keyof typeof criticalFields] || []
  const hasCriticalFields = critical.every(field => 
    extractedData[field] !== null && extractedData[field] !== undefined
  )
  
  if (hasCriticalFields) {
    confidence = Math.min(100, confidence + 20)
  }
  
  // Penalize for obvious data quality issues
  if (extractedData.total && extractedData.total < 0) confidence -= 30
  if (extractedData.gallons && extractedData.gallons > 50) confidence -= 20
  if (extractedData.mileage && (extractedData.mileage < 0 || extractedData.mileage > 999999)) confidence -= 25
  
  return Math.max(0, Math.min(100, confidence))
}
