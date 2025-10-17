// Corrected Document Intelligence Module
// Realistic pattern recognition with data quality safeguards

export interface DataQualityAssessment {
  sample_size: number
  consistency_score: number
  completeness_score: number
  reliability_rating: 'high' | 'medium' | 'low' | 'insufficient'
  quality_issues: string[]
}

export interface CautiousRecommendation {
  type: string
  confidence: number
  recommendation: string
  uncertainty_range?: string
  data_quality: DataQualityAssessment
  disclaimers: string[]
  min_confidence_threshold: number
}

// Enhanced document analysis with data quality safeguards
export function analyzeDocumentPatternsWithQuality(documents: any[]): CautiousRecommendation[] {
  const recommendations = []
  
  // First, assess overall data quality
  const dataQuality = assessDataQuality(documents)
  
  // Only proceed with analysis if we have sufficient data quality
  if (dataQuality.reliability_rating === 'insufficient') {
    return [{
      type: 'insufficient_data',
      confidence: 0.1,
      recommendation: 'More service history needed for pattern analysis',
      data_quality: dataQuality,
      disclaimers: ['Insufficient data for reliable predictions'],
      min_confidence_threshold: 0.7
    }]
  }
  
  // Service frequency analysis (with heavy caveats)
  const serviceAnalysis = analyzeServiceFrequencyWithCaution(documents, dataQuality)
  if (serviceAnalysis) recommendations.push(serviceAnalysis)
  
  // Cost trend analysis (with uncertainty ranges)
  const costAnalysis = analyzeCostTrendsWithUncertainty(documents, dataQuality)
  if (costAnalysis) recommendations.push(costAnalysis)
  
  // Vendor analysis (descriptive only, no predictions)
  const vendorAnalysis = analyzeVendorPatternsDescriptive(documents, dataQuality)
  if (vendorAnalysis) recommendations.push(vendorAnalysis)
  
  return recommendations
}

function assessDataQuality(documents: any[]): DataQualityAssessment {
  const issues = []
  let consistencyScore = 1.0
  let completenessScore = 1.0
  
  // Check sample size
  if (documents.length < 3) {
    issues.push('Very small sample size')
    consistencyScore *= 0.3
  } else if (documents.length < 6) {
    issues.push('Small sample size')
    consistencyScore *= 0.6
  }
  
  // Check date consistency
  const documentsWithDates = documents.filter(doc => doc.date && isValidDate(doc.date))
  if (documentsWithDates.length < documents.length * 0.8) {
    issues.push('Missing or invalid dates in many documents')
    completenessScore *= 0.5
  }
  
  // Check for date ordering issues
  const sortedDocs = documentsWithDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const dateSpan = sortedDocs.length > 1 
    ? (new Date(sortedDocs[sortedDocs.length - 1].date).getTime() - new Date(sortedDocs[0].date).getTime()) / (1000 * 60 * 60 * 24)
    : 0
  
  if (dateSpan < 90) {
    issues.push('Documents span less than 3 months')
    consistencyScore *= 0.7
  }
  
  // Check amount consistency
  const documentsWithAmounts = documents.filter(doc => 
    doc.total_amount && typeof doc.total_amount === 'number' && doc.total_amount > 0
  )
  if (documentsWithAmounts.length < documents.length * 0.7) {
    issues.push('Missing or invalid amounts in many documents')
    completenessScore *= 0.6
  }
  
  // Check vendor consistency
  const documentsWithVendors = documents.filter(doc => 
    doc.vendor_name && doc.vendor_name !== 'Unknown Vendor'
  )
  if (documentsWithVendors.length < documents.length * 0.6) {
    issues.push('Missing vendor information in many documents')
    completenessScore *= 0.7
  }
  
  // Check mileage consistency
  const documentsWithMileage = documents.filter(doc => 
    doc.odometer_reading && doc.odometer_reading > 0
  )
  if (documentsWithMileage.length < documents.length * 0.5) {
    issues.push('Missing mileage data in many documents')
    completenessScore *= 0.8
  }
  
  // Calculate overall scores
  const overallScore = (consistencyScore + completenessScore) / 2
  
  let reliability: 'high' | 'medium' | 'low' | 'insufficient'
  if (overallScore >= 0.8 && documents.length >= 6) {
    reliability = 'high'
  } else if (overallScore >= 0.6 && documents.length >= 4) {
    reliability = 'medium'
  } else if (overallScore >= 0.4 && documents.length >= 3) {
    reliability = 'low'
  } else {
    reliability = 'insufficient'
  }
  
  return {
    sample_size: documents.length,
    consistency_score: Math.round(consistencyScore * 100) / 100,
    completeness_score: Math.round(completenessScore * 100) / 100,
    reliability_rating: reliability,
    quality_issues: issues
  }
}

function analyzeServiceFrequencyWithCaution(
  documents: any[], 
  dataQuality: DataQualityAssessment
): CautiousRecommendation | null {
  
  const serviceDocuments = documents.filter(doc => 
    doc.document_type === 'service_invoice' && 
    doc.date && 
    isValidDate(doc.date) &&
    doc.services && 
    doc.services.length > 0
  )
  
  if (serviceDocuments.length < 3) return null
  
  // Sort by date
  serviceDocuments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Calculate intervals
  const intervals = []
  for (let i = 1; i < serviceDocuments.length; i++) {
    const prevDate = new Date(serviceDocuments[i-1].date)
    const currDate = new Date(serviceDocuments[i].date)
    const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 0 && daysDiff < 730) { // Reasonable range: 0-2 years
      intervals.push(daysDiff)
    }
  }
  
  if (intervals.length < 2) return null
  
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  
  // Calculate confidence based on consistency and data quality
  let confidence = 0.3 // Start low
  
  // Boost confidence for consistency
  if (stdDev < avgInterval * 0.3) confidence += 0.3
  else if (stdDev < avgInterval * 0.5) confidence += 0.2
  else if (stdDev < avgInterval * 0.7) confidence += 0.1
  
  // Boost confidence for data quality
  confidence += dataQuality.consistency_score * 0.3
  
  // Boost confidence for sample size
  if (intervals.length >= 5) confidence += 0.2
  else if (intervals.length >= 3) confidence += 0.1
  
  confidence = Math.min(confidence, 0.8) // Cap at 80%
  
  // Only make predictions if confidence is reasonable
  if (confidence < 0.5) {
    return {
      type: 'service_frequency_low_confidence',
      confidence,
      recommendation: `Service intervals vary significantly (${Math.round(avgInterval - stdDev)} to ${Math.round(avgInterval + stdDev)} days). More consistent data needed for reliable predictions.`,
      data_quality: dataQuality,
      disclaimers: [
        'Service intervals vary by vehicle type, driving conditions, and maintenance needs',
        'Predictions based on limited historical data',
        'Consult vehicle manual for manufacturer recommendations'
      ],
      min_confidence_threshold: 0.5
    }
  }
  
  // Generate cautious recommendation
  const lastService = serviceDocuments[serviceDocuments.length - 1]
  const lastServiceDate = new Date(lastService.date)
  const daysSinceLastService = Math.round((new Date().getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const uncertaintyRange = Math.round(stdDev)
  const estimatedNextRange = {
    min: Math.round(avgInterval - uncertaintyRange),
    max: Math.round(avgInterval + uncertaintyRange)
  }
  
  let recommendation = `Based on ${intervals.length} service intervals, services typically occur every ${Math.round(avgInterval)} days (range: ${estimatedNextRange.min}-${estimatedNextRange.max} days).`
  
  if (daysSinceLastService > avgInterval + uncertaintyRange) {
    recommendation += ` Last service was ${daysSinceLastService} days ago, which is beyond the typical range.`
  } else if (daysSinceLastService > avgInterval - uncertaintyRange) {
    recommendation += ` Last service was ${daysSinceLastService} days ago, approaching typical service time.`
  }
  
  return {
    type: 'service_frequency_pattern',
    confidence,
    recommendation,
    uncertainty_range: `${estimatedNextRange.min}-${estimatedNextRange.max} days`,
    data_quality: dataQuality,
    disclaimers: [
      'Patterns based on historical documents only',
      'Actual service needs depend on driving conditions, vehicle condition, and manufacturer recommendations',
      'This is not a substitute for following your vehicle\'s maintenance schedule',
      `Prediction confidence: ${Math.round(confidence * 100)}%`
    ],
    min_confidence_threshold: 0.5
  }
}

function analyzeCostTrendsWithUncertainty(
  documents: any[], 
  dataQuality: DataQualityAssessment
): CautiousRecommendation | null {
  
  const costDocuments = documents.filter(doc => 
    doc.total_amount && 
    typeof doc.total_amount === 'number' && 
    doc.total_amount > 0 &&
    doc.date && 
    isValidDate(doc.date)
  )
  
  if (costDocuments.length < 4) return null
  
  // Sort by date
  costDocuments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  const costs = costDocuments.map(doc => doc.total_amount)
  const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
  const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avgCost, 2), 0) / costs.length
  const stdDev = Math.sqrt(variance)
  
  // Simple trend analysis
  let trendSum = 0
  for (let i = 1; i < costs.length; i++) {
    trendSum += costs[i] - costs[i-1]
  }
  const avgTrend = trendSum / (costs.length - 1)
  
  // Calculate confidence based on data consistency
  let confidence = 0.4 // Start moderate
  
  // Reduce confidence for high variability
  if (stdDev > avgCost * 0.5) confidence -= 0.2
  else if (stdDev > avgCost * 0.3) confidence -= 0.1
  
  // Adjust for data quality
  confidence += dataQuality.completeness_score * 0.2
  
  // Adjust for sample size
  if (costDocuments.length >= 8) confidence += 0.2
  else if (costDocuments.length >= 6) confidence += 0.1
  
  confidence = Math.max(0.2, Math.min(confidence, 0.7)) // Cap between 20-70%
  
  let recommendation = `Based on ${costDocuments.length} documents, average service cost is $${avgCost.toFixed(2)} (range: $${(avgCost - stdDev).toFixed(2)}-$${(avgCost + stdDev).toFixed(2)}).`
  
  if (Math.abs(avgTrend) > avgCost * 0.1) {
    const trendDirection = avgTrend > 0 ? 'increasing' : 'decreasing'
    recommendation += ` Costs appear to be ${trendDirection} by approximately $${Math.abs(avgTrend).toFixed(2)} per service, but this trend has low confidence due to cost variability.`
  } else {
    recommendation += ` No clear cost trend detected.`
  }
  
  return {
    type: 'cost_trend_analysis',
    confidence,
    recommendation,
    uncertainty_range: `$${(avgCost - stdDev).toFixed(2)}-$${(avgCost + stdDev).toFixed(2)}`,
    data_quality: dataQuality,
    disclaimers: [
      'Cost analysis based on historical documents only',
      'Service costs vary by vehicle age, condition, and service type',
      'Inflation and market conditions affect pricing trends',
      'Use for general budgeting guidance only',
      `Analysis confidence: ${Math.round(confidence * 100)}%`
    ],
    min_confidence_threshold: 0.4
  }
}

function analyzeVendorPatternsDescriptive(
  documents: any[], 
  dataQuality: DataQualityAssessment
): CautiousRecommendation | null {
  
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
  
  let recommendation = `Service vendor distribution: ${topVendor[0]} (${topVendorPercentage.toFixed(1)}%)`
  
  if (sortedVendors.length > 1) {
    sortedVendors.slice(1).forEach(([vendor, count]) => {
      const percentage = (count / totalDocs) * 100
      recommendation += `, ${vendor} (${percentage.toFixed(1)}%)`
    })
  }
  
  recommendation += '. This is descriptive information only and does not constitute a recommendation.'
  
  return {
    type: 'vendor_distribution',
    confidence: 0.9, // High confidence for descriptive data
    recommendation,
    data_quality: dataQuality,
    disclaimers: [
      'This shows historical vendor usage patterns only',
      'Does not constitute a recommendation for any specific vendor',
      'Service quality and pricing should be evaluated independently'
    ],
    min_confidence_threshold: 0.8
  }
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && date.getFullYear() > 1990 && date.getFullYear() <= new Date().getFullYear()
}

// Export corrected function
export { analyzeDocumentPatternsWithQuality as analyzeDocumentPatterns }
