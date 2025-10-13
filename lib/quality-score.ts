/**
 * Quality Score System
 * 
 * Calculates data quality scores for timeline events to encourage
 * best practices (photo capture, complete data, odometer tracking).
 * 
 * Score Breakdown:
 * - Photo attached: +40%
 * - All fields filled: +30%
 * - Odometer included: +15%
 * - AI confidence: +10%
 * - Notes added: +5%
 * 
 * Total: 0-100%
 */

import type { TimelineItem } from '@/types/timeline'
import type { EventCardData } from '@/components/timeline/event-types/types'

export interface QualityScoreBreakdown {
  hasPhoto: boolean
  photoScore: number
  fieldsScore: number
  fieldCount: number
  odometerScore: number
  confidenceScore: number
  confidenceLevel?: 'high' | 'medium' | 'low'
  notesScore: number
}

export interface QualityScoreResult {
  score: number
  level: 1 | 2 | 3 | 4 | 5
  breakdown: QualityScoreBreakdown
  color: 'green' | 'yellow' | 'red'
  label: 'Excellent' | 'Good' | 'Needs Improvement'
}

/**
 * Calculate quality score for a timeline event
 */
export function calculateQualityScore(
  item: TimelineItem,
  cardData: EventCardData
): QualityScoreResult {
  let score = 0
  const breakdown: QualityScoreBreakdown = {
    hasPhoto: false,
    photoScore: 0,
    fieldsScore: 0,
    fieldCount: 0,
    odometerScore: 0,
    confidenceScore: 0,
    notesScore: 0,
  }

  // 1. Photo attached: +40%
  const hasPhoto = !!(item.photo_url || item.thumbnail_url || cardData.sourceImage)
  if (hasPhoto) {
    breakdown.hasPhoto = true
    breakdown.photoScore = 40
    score += 40
  }

  // 2. All fields filled: +30%
  const dataFieldCount = cardData.data.length
  breakdown.fieldCount = dataFieldCount
  
  if (dataFieldCount >= 4) {
    breakdown.fieldsScore = 30
    score += 30
  } else if (dataFieldCount >= 2) {
    breakdown.fieldsScore = 20
    score += 20
  } else if (dataFieldCount >= 1) {
    breakdown.fieldsScore = 10
    score += 10
  }

  // 3. Odometer included: +15%
  if (item.mileage && item.mileage > 0) {
    breakdown.odometerScore = 15
    score += 15
  }

  // 4. AI quality/confidence: +10%
  if (cardData.quality) {
    breakdown.confidenceLevel = cardData.quality.level
    if (cardData.quality.level === 'high') {
      breakdown.confidenceScore = 10
      score += 10
    } else if (cardData.quality.level === 'medium') {
      breakdown.confidenceScore = 5
      score += 5
    }
  }

  // 5. Notes added: +5%
  if (item.notes && item.notes.trim().length > 0) {
    breakdown.notesScore = 5
    score += 5
  }

  // Cap at 100%
  const finalScore = Math.min(score, 100)

  // Calculate level (1-5 stars)
  const level = finalScore >= 85 ? 5 
    : finalScore >= 70 ? 4 
    : finalScore >= 55 ? 3 
    : finalScore >= 40 ? 2 
    : 1

  // Determine color and label
  const color = finalScore >= 85 ? 'green' 
    : finalScore >= 55 ? 'yellow' 
    : 'red'

  const label = finalScore >= 85 ? 'Excellent' 
    : finalScore >= 55 ? 'Good' 
    : 'Needs Improvement'

  return {
    score: finalScore,
    level,
    breakdown,
    color,
    label,
  }
}

/**
 * Get Tailwind classes for quality badge based on score
 */
export function getQualityBadgeClasses(score: number): string {
  if (score >= 85) {
    return 'bg-green-100 text-green-700 border-green-200'
  } else if (score >= 55) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  } else {
    return 'bg-red-100 text-red-700 border-red-200'
  }
}

/**
 * Get quality badge color (for visual indicators)
 */
export function getQualityBadgeColor(score: number): 'green' | 'yellow' | 'red' {
  return score >= 85 ? 'green' : score >= 55 ? 'yellow' : 'red'
}

/**
 * Get quality suggestions based on what's missing
 */
export function getQualityImprovements(breakdown: QualityScoreBreakdown): string[] {
  const suggestions: string[] = []

  if (!breakdown.hasPhoto) {
    suggestions.push('Add a photo for +40%')
  }

  if (breakdown.fieldsScore < 30) {
    const needed = 4 - breakdown.fieldCount
    suggestions.push(`Fill ${needed} more field${needed > 1 ? 's' : ''} for better score`)
  }

  if (breakdown.odometerScore === 0) {
    suggestions.push('Add odometer reading for +15%')
  }

  if (breakdown.notesScore === 0) {
    suggestions.push('Add notes for +5%')
  }

  return suggestions
}

/**
 * Format quality score for display
 */
export function formatQualityScore(score: number): string {
  return `${score}%`
}
