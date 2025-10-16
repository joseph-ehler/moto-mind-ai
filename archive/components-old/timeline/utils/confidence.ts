// Timeline Event Confidence Analysis Utilities
// Pure functions for confidence scoring and warning detection

import { TimelineEvent } from '../VehicleTimeline'

// Determine if confidence warning should be shown
export function shouldShowConfidenceWarning(event: TimelineEvent): boolean {
  const confidence = getOverallConfidence(event)
  return confidence < 0.7 // Show warning if confidence below 70%
}

// Get reason for confidence warning
export function getConfidenceWarningReason(event: TimelineEvent): string {
  const confidence = getOverallConfidence(event)
  
  if (confidence < 0.5) {
    return 'Low confidence - please review extracted data'
  } else if (confidence < 0.7) {
    return 'Medium confidence - some fields may need verification'
  }
  
  return 'High confidence'
}

// Extract overall confidence from various payload structures
export function getOverallConfidence(event: TimelineEvent): number {
  const payload = event.payload
  if (!payload) return 0
  
  // Direct confidence field
  if (typeof payload.confidence === 'number') {
    return payload.confidence
  }
  
  // Dashboard snapshot confidence
  if (payload.data?.confidence) {
    return payload.data.confidence
  }
  
  // Validation rollup confidence
  if (payload.data?.validation?.rollup === 'ok') {
    return 0.8 // Assume good confidence if validation passed
  }
  
  // Legacy confidence fields
  if (payload.extracted_data?.confidence) {
    return payload.extracted_data.confidence
  }
  
  // Fallback: estimate from validation fields
  return estimateConfidenceFromValidation(payload)
}

// Estimate confidence from individual validation scores
function estimateConfidenceFromValidation(payload: any): number {
  const validationScores: number[] = []
  
  // Dashboard validation scores
  if (payload.data?.validation) {
    const val = payload.data.validation
    if (typeof val.odometer_conf === 'number') validationScores.push(val.odometer_conf)
    if (typeof val.fuel_conf === 'number') validationScores.push(val.fuel_conf)
    if (typeof val.lights_conf === 'number') validationScores.push(val.lights_conf)
  }
  
  // Generic validation scores
  if (payload.validation) {
    Object.values(payload.validation).forEach(score => {
      if (typeof score === 'number' && score >= 0 && score <= 1) {
        validationScores.push(score)
      }
    })
  }
  
  // Return average if we have scores, otherwise default to medium confidence
  return validationScores.length > 0 
    ? validationScores.reduce((sum, score) => sum + score, 0) / validationScores.length
    : 0.6
}

// Get confidence level as text
export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.6) return 'medium'
  return 'low'
}

// Get confidence color class
export function getConfidenceColor(confidence: number): string {
  const level = getConfidenceLevel(confidence)
  
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}
