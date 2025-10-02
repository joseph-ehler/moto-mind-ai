// Document Intelligence Module
// Realistic enhancements within our technical capabilities

export interface DocumentPattern {
  type: string
  confidence: number
  indicators: string[]
  next_actions: string[]
}

export interface MaintenancePattern {
  service_type: string
  frequency_days: number
  cost_range: [number, number]
  seasonal_factor: number
}

// Enhanced document classification with pattern recognition
export function analyzeDocumentPatterns(documents: any[]): DocumentPattern[] {
  const patterns = []
  
  // Service frequency patterns
  const servicePattern = analyzeServiceFrequency(documents)
  if (servicePattern) patterns.push(servicePattern)
  
  // Cost trend patterns
  const costPattern = analyzeCostTrends(documents)
  if (costPattern) patterns.push(costPattern)
  
  // Vendor preference patterns
  const vendorPattern = analyzeVendorPreferences(documents)
  if (vendorPattern) patterns.push(vendorPattern)
  
  return patterns
}

function analyzeServiceFrequency(documents: any[]): DocumentPattern | null {
  const serviceDocuments = documents.filter(doc => 
    doc.document_type === 'service_invoice' && doc.date && doc.services
  )
  
  if (serviceDocuments.length < 3) return null
  
  // Sort by date
  serviceDocuments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Calculate intervals between services
  const intervals = []
  for (let i = 1; i < serviceDocuments.length; i++) {
    const prevDate = new Date(serviceDocuments[i-1].date)
    const currDate = new Date(serviceDocuments[i].date)
    const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    intervals.push(daysDiff)
  }
  
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  
  let confidence = 0.7
  const indicators = [`Average ${Math.round(avgInterval)} days between services`]
  
  // Check for consistency
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  
  if (stdDev < avgInterval * 0.3) {
    confidence += 0.2
    indicators.push('Consistent service intervals')
  }
  
  // Predict next service
  const lastService = serviceDocuments[serviceDocuments.length - 1]
  const lastServiceDate = new Date(lastService.date)
  const nextServiceDate = new Date(lastServiceDate.getTime() + avgInterval * 24 * 60 * 60 * 1000)
  
  return {
    type: 'service_frequency',
    confidence,
    indicators,
    next_actions: [
      `Next service likely around ${nextServiceDate.toLocaleDateString()}`,
      `Consider scheduling ${Math.round(avgInterval)}-day service reminder`
    ]
  }
}

function analyzeCostTrends(documents: any[]): DocumentPattern | null {
  const costDocuments = documents.filter(doc => 
    doc.total_amount && doc.date && typeof doc.total_amount === 'number'
  )
  
  if (costDocuments.length < 4) return null
  
  // Sort by date
  costDocuments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Calculate cost trend
  const costs = costDocuments.map(doc => doc.total_amount)
  const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
  
  // Simple linear trend analysis
  let trendSum = 0
  for (let i = 1; i < costs.length; i++) {
    trendSum += costs[i] - costs[i-1]
  }
  const avgTrend = trendSum / (costs.length - 1)
  
  const indicators = [`Average cost: $${avgCost.toFixed(2)}`]
  let confidence = 0.6
  
  if (Math.abs(avgTrend) > avgCost * 0.1) {
    confidence += 0.2
    if (avgTrend > 0) {
      indicators.push(`Costs increasing by ~$${avgTrend.toFixed(2)} per service`)
    } else {
      indicators.push(`Costs decreasing by ~$${Math.abs(avgTrend).toFixed(2)} per service`)
    }
  }
  
  // Identify cost outliers
  const outliers = costs.filter(cost => Math.abs(cost - avgCost) > avgCost * 0.5)
  if (outliers.length > 0) {
    indicators.push(`${outliers.length} cost outlier(s) detected`)
  }
  
  return {
    type: 'cost_trend',
    confidence,
    indicators,
    next_actions: [
      avgTrend > avgCost * 0.1 ? 'Consider shopping for better service rates' : '',
      outliers.length > 0 ? 'Review high-cost services for accuracy' : ''
    ].filter(action => action.length > 0)
  }
}

function analyzeVendorPreferences(documents: any[]): DocumentPattern | null {
  const vendorDocuments = documents.filter(doc => 
    doc.vendor_name && doc.vendor_name !== 'Unknown Vendor'
  )
  
  if (vendorDocuments.length < 3) return null
  
  // Count vendor frequency
  const vendorCounts = {}
  vendorDocuments.forEach(doc => {
    vendorCounts[doc.vendor_name] = (vendorCounts[doc.vendor_name] || 0) + 1
  })
  
  const sortedVendors = Object.entries(vendorCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
  
  const totalDocs = vendorDocuments.length
  const topVendor = sortedVendors[0]
  const topVendorPercentage = (topVendor[1] / totalDocs) * 100
  
  let confidence = 0.5
  const indicators = [`Most used: ${topVendor[0]} (${topVendorPercentage.toFixed(1)}%)`]
  
  if (topVendorPercentage > 60) {
    confidence += 0.3
    indicators.push('Strong vendor preference detected')
  }
  
  // Add other frequent vendors
  if (sortedVendors.length > 1) {
    sortedVendors.slice(1).forEach(([vendor, count]) => {
      const percentage = (count / totalDocs) * 100
      indicators.push(`${vendor}: ${percentage.toFixed(1)}%`)
    })
  }
  
  return {
    type: 'vendor_preference',
    confidence,
    indicators,
    next_actions: [
      `Consider loyalty programs with ${topVendor[0]}`,
      sortedVendors.length > 2 ? 'Compare service quality across vendors' : ''
    ].filter(action => action.length > 0)
  }
}

// Enhanced document type detection
export function enhancedDocumentClassification(visionData: any): {
  primary_type: string
  secondary_types: string[]
  confidence: number
  classification_reasons: string[]
} {
  const reasons = []
  let confidence = 0.5
  let primaryType = 'unknown'
  const secondaryTypes = []
  
  // Service invoice detection
  if (visionData.service_description || visionData.work_performed || visionData.labor_cost) {
    primaryType = 'service_invoice'
    confidence += 0.4
    reasons.push('Service-related content detected')
    
    if (visionData.line_items && Array.isArray(visionData.line_items)) {
      confidence += 0.2
      reasons.push('Itemized services found')
    }
  }
  
  // Fuel receipt detection
  if (visionData.gallons || visionData.fuel_amount || visionData.price_per_gallon) {
    if (primaryType === 'unknown') {
      primaryType = 'fuel_receipt'
      confidence += 0.4
    } else {
      secondaryTypes.push('fuel_receipt')
    }
    reasons.push('Fuel purchase data detected')
  }
  
  // Insurance document detection
  if (visionData.policy_number || visionData.coverage || visionData.premium) {
    if (primaryType === 'unknown') {
      primaryType = 'insurance_document'
      confidence += 0.3
    } else {
      secondaryTypes.push('insurance_document')
    }
    reasons.push('Insurance information detected')
  }
  
  // Registration detection
  if (visionData.registration_number || visionData.license_plate || visionData.vehicle_registration) {
    if (primaryType === 'unknown') {
      primaryType = 'registration'
      confidence += 0.3
    } else {
      secondaryTypes.push('registration')
    }
    reasons.push('Registration data detected')
  }
  
  // Inspection certificate detection
  if (visionData.inspection_date || visionData.inspection_station || visionData.certificate_number) {
    if (primaryType === 'unknown') {
      primaryType = 'inspection_certificate'
      confidence += 0.3
    } else {
      secondaryTypes.push('inspection_certificate')
    }
    reasons.push('Inspection information detected')
  }
  
  // Generic receipt detection
  if (visionData.total_amount && visionData.vendor_name && primaryType === 'unknown') {
    primaryType = 'receipt'
    confidence += 0.2
    reasons.push('Basic receipt structure detected')
  }
  
  return {
    primary_type: primaryType,
    secondary_types: secondaryTypes,
    confidence: Math.min(confidence, 1.0),
    classification_reasons: reasons
  }
}

// Timeline intelligence for maintenance patterns
export function generateMaintenanceIntelligence(documents: any[]): {
  patterns: MaintenancePattern[]
  recommendations: string[]
  risk_factors: string[]
} {
  const serviceDocuments = documents.filter(doc => 
    doc.document_type === 'service_invoice' && 
    doc.services && 
    doc.date && 
    doc.total_amount
  )
  
  if (serviceDocuments.length < 2) {
    return {
      patterns: [],
      recommendations: ['Need more service history for pattern analysis'],
      risk_factors: []
    }
  }
  
  const patterns = []
  const recommendations = []
  const riskFactors = []
  
  // Analyze service type patterns
  const serviceTypes = {}
  serviceDocuments.forEach(doc => {
    doc.services.forEach(service => {
      if (!serviceTypes[service]) {
        serviceTypes[service] = []
      }
      serviceTypes[service].push({
        date: new Date(doc.date),
        cost: doc.total_amount,
        mileage: doc.odometer_reading
      })
    })
  })
  
  // Generate patterns for each service type
  Object.entries(serviceTypes).forEach(([serviceType, occurrences]) => {
    if (occurrences.length >= 2) {
      occurrences.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      // Calculate average frequency
      const intervals = []
      for (let i = 1; i < occurrences.length; i++) {
        const daysDiff = Math.round(
          (occurrences[i].date.getTime() - occurrences[i-1].date.getTime()) / (1000 * 60 * 60 * 24)
        )
        intervals.push(daysDiff)
      }
      
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const costs = occurrences.map(occ => occ.cost)
      const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
      const minCost = Math.min(...costs)
      const maxCost = Math.max(...costs)
      
      patterns.push({
        service_type: serviceType,
        frequency_days: Math.round(avgInterval),
        cost_range: [minCost, maxCost],
        seasonal_factor: calculateSeasonalFactor(occurrences)
      })
      
      // Generate recommendations
      const lastOccurrence = occurrences[occurrences.length - 1]
      const daysSinceLastService = Math.round(
        (new Date().getTime() - lastOccurrence.date.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastService > avgInterval * 1.2) {
        recommendations.push(`${serviceType} is overdue (last: ${daysSinceLastService} days ago, avg: ${Math.round(avgInterval)} days)`)
        riskFactors.push(`Overdue ${serviceType}`)
      } else if (daysSinceLastService > avgInterval * 0.8) {
        recommendations.push(`${serviceType} due soon (last: ${daysSinceLastService} days ago)`)
      }
    }
  })
  
  return { patterns, recommendations, risk_factors: riskFactors }
}

function calculateSeasonalFactor(occurrences: any[]): number {
  // Simple seasonal analysis based on month distribution
  const monthCounts = new Array(12).fill(0)
  
  occurrences.forEach(occ => {
    monthCounts[occ.date.getMonth()]++
  })
  
  const maxCount = Math.max(...monthCounts)
  const minCount = Math.min(...monthCounts)
  
  // Return seasonal factor (1.0 = no seasonality, higher = more seasonal)
  return maxCount > 0 ? (maxCount - minCount) / maxCount : 0
}
