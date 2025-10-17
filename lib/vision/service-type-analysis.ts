// Service-Type-Aware Analysis
// Separate analysis by service type with realistic thresholds

interface ServiceTypePattern {
  service_type: string
  expected_interval_days: number
  min_samples_required: number
  confidence_threshold: number
  typical_cost_range: [number, number]
}

const SERVICE_TYPE_DEFINITIONS: Record<string, ServiceTypePattern> = {
  'oil_change': {
    service_type: 'Oil Change',
    expected_interval_days: 120, // ~4 months
    min_samples_required: 4, // Need multiple oil changes to establish pattern
    confidence_threshold: 0.6,
    typical_cost_range: [30, 100]
  },
  'tire_rotation': {
    service_type: 'Tire Rotation',
    expected_interval_days: 180, // ~6 months
    min_samples_required: 3,
    confidence_threshold: 0.5,
    typical_cost_range: [20, 60]
  },
  'brake_service': {
    service_type: 'Brake Service',
    expected_interval_days: 730, // ~2 years
    min_samples_required: 2, // Brake work is infrequent
    confidence_threshold: 0.4,
    typical_cost_range: [200, 800]
  },
  'transmission_service': {
    service_type: 'Transmission Service',
    expected_interval_days: 1095, // ~3 years
    min_samples_required: 2,
    confidence_threshold: 0.3,
    typical_cost_range: [150, 400]
  },
  'major_repair': {
    service_type: 'Major Repair',
    expected_interval_days: -1, // Irregular, no pattern expected
    min_samples_required: 5, // Need many samples to identify any pattern
    confidence_threshold: 0.2,
    typical_cost_range: [500, 5000]
  }
}

export function analyzeServicesByType(documents: any[]): {
  service_analyses: ServiceTypeAnalysis[]
  overall_assessment: string
  limitations: string[]
} {
  const serviceDocuments = documents.filter(doc => 
    doc.document_type === 'service_invoice' && 
    doc.services && 
    doc.services.length > 0 &&
    doc.date &&
    isValidDate(doc.date)
  )

  if (serviceDocuments.length < 3) {
    return {
      service_analyses: [],
      overall_assessment: 'Insufficient service history for meaningful analysis',
      limitations: [
        'Need at least 3 service documents for any pattern analysis',
        'Different service types have different interval patterns',
        'Analysis requires multiple occurrences of the same service type'
      ]
    }
  }

  // Group documents by service type
  const serviceGroups = groupDocumentsByServiceType(serviceDocuments)
  const analyses = []

  // Analyze each service type separately
  for (const [serviceType, docs] of Object.entries(serviceGroups)) {
    const pattern = SERVICE_TYPE_DEFINITIONS[serviceType]
    if (!pattern) continue // Skip unknown service types

    const analysis = analyzeServiceTypePattern(docs, pattern)
    if (analysis) {
      analyses.push(analysis)
    }
  }

  // Generate overall assessment
  let overallAssessment = ''
  if (analyses.length === 0) {
    overallAssessment = 'No reliable service patterns detected. Need more consistent service history by type.'
  } else if (analyses.length === 1) {
    overallAssessment = `Pattern detected for ${analyses[0].service_type} only. Other service types need more data.`
  } else {
    overallAssessment = `Patterns detected for ${analyses.length} service types. Analysis limited by available data.`
  }

  return {
    service_analyses: analyses,
    overall_assessment: overallAssessment,
    limitations: [
      'Analysis is service-type specific and requires multiple occurrences',
      'Patterns based on historical documents only, not manufacturer recommendations',
      'Actual service needs depend on driving conditions, climate, and vehicle condition',
      'This analysis supplements but does not replace manufacturer maintenance schedules'
    ]
  }
}

interface ServiceTypeAnalysis {
  service_type: string
  sample_size: number
  confidence: number
  pattern_description: string
  next_service_estimate?: string
  cost_insights: string
  limitations: string[]
}

function groupDocumentsByServiceType(documents: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}

  documents.forEach(doc => {
    doc.services.forEach(service => {
      const serviceType = categorizeService(service)
      if (serviceType) {
        if (!groups[serviceType]) {
          groups[serviceType] = []
        }
        groups[serviceType].push({
          ...doc,
          primary_service: service
        })
      }
    })
  })

  return groups
}

function categorizeService(service: string): string | null {
  const serviceLower = service.toLowerCase()
  
  if (serviceLower.includes('oil')) return 'oil_change'
  if (serviceLower.includes('tire') && serviceLower.includes('rotat')) return 'tire_rotation'
  if (serviceLower.includes('brake')) return 'brake_service'
  if (serviceLower.includes('transmission')) return 'transmission_service'
  if (serviceLower.includes('engine') || serviceLower.includes('major')) return 'major_repair'
  
  return null // Unknown service type
}

function analyzeServiceTypePattern(
  documents: any[], 
  pattern: ServiceTypePattern
): ServiceTypeAnalysis | null {
  
  if (documents.length < pattern.min_samples_required) {
    return null // Insufficient data for this service type
  }

  // Sort by date
  documents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate intervals between same service type
  const intervals = []
  for (let i = 1; i < documents.length; i++) {
    const prevDate = new Date(documents[i-1].date)
    const currDate = new Date(documents[i].date)
    const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 0 && daysDiff < 1825) { // Reasonable range: 0-5 years
      intervals.push(daysDiff)
    }
  }

  if (intervals.length === 0) {
    return null
  }

  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)

  // Calculate confidence based on consistency and expected interval
  let confidence = 0.2 // Start very low

  // Boost confidence if actual interval is close to expected
  if (pattern.expected_interval_days > 0) {
    const intervalDifference = Math.abs(avgInterval - pattern.expected_interval_days)
    const toleranceRatio = intervalDifference / pattern.expected_interval_days
    
    if (toleranceRatio < 0.3) confidence += 0.4 // Within 30% of expected
    else if (toleranceRatio < 0.5) confidence += 0.2 // Within 50% of expected
    else if (toleranceRatio < 0.7) confidence += 0.1 // Within 70% of expected
  }

  // Boost confidence for consistency
  if (stdDev < avgInterval * 0.3) confidence += 0.3
  else if (stdDev < avgInterval * 0.5) confidence += 0.2
  else if (stdDev < avgInterval * 0.7) confidence += 0.1

  // Boost confidence for sample size
  if (documents.length >= pattern.min_samples_required * 2) confidence += 0.2
  else if (documents.length >= pattern.min_samples_required) confidence += 0.1

  confidence = Math.min(confidence, pattern.confidence_threshold)

  // Only provide analysis if we meet minimum confidence
  if (confidence < pattern.confidence_threshold * 0.7) {
    return {
      service_type: pattern.service_type,
      sample_size: documents.length,
      confidence,
      pattern_description: `Insufficient data consistency for reliable ${pattern.service_type} pattern analysis.`,
      cost_insights: generateCostInsights(documents, pattern),
      limitations: [
        `Need more consistent ${pattern.service_type} history`,
        'Service intervals vary significantly by vehicle and usage',
        `Expected interval: ~${Math.round(pattern.expected_interval_days / 30)} months`
      ]
    }
  }

  // Generate pattern description
  let patternDescription = `${pattern.service_type} occurs approximately every ${Math.round(avgInterval)} days`
  
  if (stdDev > avgInterval * 0.3) {
    patternDescription += ` (high variability: ±${Math.round(stdDev)} days)`
  } else {
    patternDescription += ` (consistent pattern)`
  }

  // Generate next service estimate (very cautiously)
  let nextServiceEstimate = undefined
  if (confidence >= pattern.confidence_threshold && documents.length >= pattern.min_samples_required) {
    const lastService = documents[documents.length - 1]
    const daysSinceLastService = Math.round((new Date().getTime() - new Date(lastService.date).getTime()) / (1000 * 60 * 60 * 24))
    
    const estimatedRange = {
      min: Math.round(avgInterval - stdDev),
      max: Math.round(avgInterval + stdDev)
    }

    if (daysSinceLastService > estimatedRange.max) {
      nextServiceEstimate = `Overdue (last service ${daysSinceLastService} days ago, typical range: ${estimatedRange.min}-${estimatedRange.max} days)`
    } else if (daysSinceLastService > estimatedRange.min) {
      nextServiceEstimate = `Due soon (last service ${daysSinceLastService} days ago, typical range: ${estimatedRange.min}-${estimatedRange.max} days)`
    } else {
      nextServiceEstimate = `Not yet due (last service ${daysSinceLastService} days ago, typical range: ${estimatedRange.min}-${estimatedRange.max} days)`
    }
  }

  return {
    service_type: pattern.service_type,
    sample_size: documents.length,
    confidence,
    pattern_description: patternDescription,
    next_service_estimate: nextServiceEstimate,
    cost_insights: generateCostInsights(documents, pattern),
    limitations: [
      'Based on historical pattern only, not manufacturer recommendations',
      'Actual service needs depend on driving conditions and vehicle condition',
      `Confidence level: ${Math.round(confidence * 100)}%`,
      'Use as general guidance only'
    ]
  }
}

function generateCostInsights(documents: any[], pattern: ServiceTypePattern): string {
  const costs = documents
    .filter(doc => doc.total_amount && typeof doc.total_amount === 'number')
    .map(doc => doc.total_amount)

  if (costs.length === 0) {
    return 'No cost data available'
  }

  const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
  const minCost = Math.min(...costs)
  const maxCost = Math.max(...costs)

  let insight = `Average cost: $${avgCost.toFixed(2)} (range: $${minCost.toFixed(2)}-$${maxCost.toFixed(2)})`

  // Compare to typical range
  if (avgCost < pattern.typical_cost_range[0]) {
    insight += '. Below typical range - good value.'
  } else if (avgCost > pattern.typical_cost_range[1]) {
    insight += '. Above typical range - consider shopping around.'
  } else {
    insight += '. Within typical cost range.'
  }

  return insight
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() <= new Date().getFullYear()
}
