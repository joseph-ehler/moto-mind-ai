/**
 * AI Insight Generator
 * 
 * Generates AI-powered insights for vehicles based on:
 * - VIN decode data
 * - NHTSA complaints, recalls, investigations
 * - Safety ratings
 * - User context (mileage, usage patterns)
 */

import { callOpenAI, callOpenAIJSON } from './openai-client'
import type { VINDecodeResult } from '@/lib/vin/types'
import type { VehicleSafetyData } from '@/lib/nhtsa/vehicle-safety'

export interface InsightContext {
  vehicle: {
    year: number
    make: string
    model: string
    trim?: string
    engine?: string
    mileage?: number
  }
  safetyData?: VehicleSafetyData
  userContext?: {
    mileage?: number
    drivePattern?: 'city' | 'highway' | 'mixed'
    recentIssues?: string[]
    maintenanceHistory?: string[]
  }
}

export interface GeneratedInsights {
  summary: string // 2-3 sentences
  reliabilityScore: number // 0-1 (0=poor, 1=excellent)
  maintenanceTip: string // Actionable advice
  costTip: string // Cost-saving advice
  riskFactors: string[] // Top 3-5 things to watch
  strengths: string[] // Top 3-5 positive aspects
  confidence: number // 0-1 (how confident is the AI)
}

/**
 * Build system prompt for insight generation
 */
function buildSystemPrompt(): string {
  return `You are an expert automotive analyst. Your job is to analyze vehicle data and generate accurate, helpful insights.

RULES:
1. Be specific and actionable
2. Use real data from complaints, recalls, and safety ratings
3. Reliability score: 0-1 scale (0.7-0.8 = average, 0.8-0.9 = good, 0.9+ = excellent)
4. Focus on what matters most to the owner
5. Be honest about risks but not alarmist
6. Provide cost-saving tips when possible
7. Keep summary to 2-3 sentences max
8. Output valid JSON only

OUTPUT FORMAT (JSON):
{
  "summary": "2-3 sentence overview",
  "reliabilityScore": 0.85,
  "maintenanceTip": "Specific actionable advice",
  "costTip": "Cost-saving advice",
  "riskFactors": ["Top concern 1", "Top concern 2", "Top concern 3"],
  "strengths": ["Positive 1", "Positive 2", "Positive 3"],
  "confidence": 0.9
}`
}

/**
 * Build context prompt from vehicle data
 */
function buildContextPrompt(context: InsightContext): string {
  const { vehicle, safetyData, userContext } = context
  
  let prompt = `VEHICLE: ${vehicle.year} ${vehicle.make} ${vehicle.model}`
  
  if (vehicle.trim) {
    prompt += ` ${vehicle.trim}`
  }
  
  if (vehicle.engine) {
    prompt += `\nEngine: ${vehicle.engine}`
  }
  
  if (userContext?.mileage) {
    prompt += `\nCurrent mileage: ${userContext.mileage.toLocaleString()} miles`
  }
  
  if (userContext?.drivePattern) {
    prompt += `\nDrive pattern: ${userContext.drivePattern}`
  }
  
  // Add safety data if available
  if (safetyData) {
    prompt += '\n\nSAFETY DATA:'
    
    // Complaints
    if (safetyData.complaints.total > 0) {
      prompt += `\n- ${safetyData.complaints.total} complaints (${safetyData.complaints.crashes} crashes, ${safetyData.complaints.fires} fires)`
      
      if (safetyData.complaints.topProblems.length > 0) {
        prompt += '\n- Top problems:'
        safetyData.complaints.topProblems.slice(0, 5).forEach(p => {
          prompt += `\n  * ${p.component}: ${p.count} complaints (${p.severity})`
        })
      }
    }
    
    // Recalls
    if (safetyData.recalls.totalRecalls > 0) {
      prompt += `\n- ${safetyData.recalls.totalRecalls} recalls (${safetyData.recalls.openRecalls} open)`
      
      if (safetyData.recalls.byComponent.length > 0) {
        prompt += '\n- Recall components:'
        safetyData.recalls.byComponent.slice(0, 5).forEach(c => {
          prompt += `\n  * ${c.component}: ${c.count} recalls`
        })
      }
    }
    
    // Safety ratings
    if (safetyData.safetyRatings.hasRatings) {
      const rating = safetyData.safetyRatings
      prompt += `\n- NCAP Overall Rating: ${rating.overallRating}/5 stars`
    }
  }
  
  // User context
  if (userContext?.recentIssues && userContext.recentIssues.length > 0) {
    prompt += '\n\nRECENT ISSUES:'
    userContext.recentIssues.forEach(issue => {
      prompt += `\n- ${issue}`
    })
  }
  
  if (userContext?.maintenanceHistory && userContext.maintenanceHistory.length > 0) {
    prompt += '\n\nMAINTENANCE HISTORY:'
    userContext.maintenanceHistory.forEach(service => {
      prompt += `\n- ${service}`
    })
  }
  
  prompt += '\n\nBased on this data, provide insights in JSON format.'
  
  return prompt
}

/**
 * Generate AI insights for a vehicle
 */
export async function generateInsights(context: InsightContext): Promise<GeneratedInsights> {
  try {
    const response = await callOpenAIJSON<GeneratedInsights>({
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildContextPrompt(context) }
      ],
      temperature: 0.3, // Low temperature for consistent, factual responses
      max_tokens: 1000
    })
    
    return response.data
  } catch (error) {
    console.error('[InsightGenerator] Error:', error)
    
    // Return fallback insights
    return {
      summary: `${context.vehicle.year} ${context.vehicle.make} ${context.vehicle.model} - Unable to generate insights at this time.`,
      reliabilityScore: 0.75, // Neutral score
      maintenanceTip: 'Follow manufacturer maintenance schedule',
      costTip: 'Regular maintenance prevents costly repairs',
      riskFactors: ['Check for open recalls', 'Monitor common issues'],
      strengths: ['Research safety ratings online'],
      confidence: 0.5
    }
  }
}

/**
 * Generate quick insights (faster, simpler)
 * Use for VIN decode without full NHTSA data
 */
export async function generateQuickInsights(vehicle: {
  year: number
  make: string
  model: string
  trim?: string
  mileage?: number
}): Promise<{ summary: string; reliabilityScore: number; maintenanceTip: string; costTip: string }> {
  try {
    const prompt = `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}
${vehicle.mileage ? `Current mileage: ${vehicle.mileage.toLocaleString()} miles` : ''}

Generate brief insights in JSON format:
{
  "summary": "2 sentences",
  "reliabilityScore": 0.75,
  "maintenanceTip": "One tip",
  "costTip": "One tip"
}`

    const response = await callOpenAIJSON<{
      summary: string
      reliabilityScore: number
      maintenanceTip: string
      costTip: string
    }>({
      messages: [
        { role: 'system', content: 'You are an automotive expert. Provide brief, accurate insights.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
    
    return response.data
  } catch (error) {
    console.error('[InsightGenerator] Quick insights error:', error)
    
    // Return minimal fallback
    return {
      summary: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      reliabilityScore: 0.75,
      maintenanceTip: 'Follow manufacturer maintenance schedule',
      costTip: 'Regular maintenance prevents costly repairs'
    }
  }
}

/**
 * Generate maintenance recommendations based on mileage
 */
export async function generateMaintenanceRecommendations(
  vehicle: { year: number; make: string; model: string },
  mileage: number
): Promise<string[]> {
  try {
    const prompt = `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}
Current mileage: ${mileage.toLocaleString()} miles

List 3-5 maintenance items that should be checked or serviced at this mileage.
Output as JSON array of strings: ["Service 1", "Service 2", ...]`

    const response = await callOpenAIJSON<string[]>({
      messages: [
        { role: 'system', content: 'You are an automotive maintenance expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 200
    })
    
    return response.data
  } catch (error) {
    console.error('[InsightGenerator] Maintenance recommendations error:', error)
    
    // Return generic recommendations
    const recommendations = ['Oil change', 'Tire rotation', 'Check brake pads']
    
    if (mileage >= 30000) recommendations.push('Air filter replacement')
    if (mileage >= 60000) recommendations.push('Transmission fluid check')
    if (mileage >= 100000) recommendations.push('Timing belt inspection')
    
    return recommendations
  }
}

/**
 * Calculate reliability score from NHTSA data
 * This is a deterministic calculation as a fallback
 */
export function calculateReliabilityScore(safetyData?: VehicleSafetyData): number {
  if (!safetyData) return 0.75 // Neutral if no data
  
  let score = 1.0
  
  // Complaints impact (0-0.2 penalty)
  const complaintRate = Math.min(safetyData.complaints.total / 100, 1)
  score -= complaintRate * 0.2
  
  // Crash rate impact (0-0.15 penalty)
  const crashRate = Math.min(safetyData.complaints.crashes / 20, 1)
  score -= crashRate * 0.15
  
  // Fire rate impact (0-0.15 penalty)  
  const fireRate = Math.min(safetyData.complaints.fires / 10, 1)
  score -= fireRate * 0.15
  
  // Open recalls impact (0-0.1 penalty)
  const openRecallRate = Math.min(safetyData.recalls.openRecalls / 5, 1)
  score -= openRecallRate * 0.1
  
  // Safety rating bonus (0-0.1 bonus)
  if (safetyData.safetyRatings.hasRatings) {
    const ratingBonus = (safetyData.safetyRatings.overallRating / 5) * 0.1
    score += ratingBonus
  }
  
  // Clamp between 0.3 and 1.0
  return Math.max(0.3, Math.min(1.0, score))
}

/**
 * Build comprehensive context for onboarding
 * Aggregates all data for final analysis
 */
export function buildOnboardingContext(data: {
  vehicleData: VINDecodeResult
  safetyData?: VehicleSafetyData
  userInputs?: {
    mileage?: number
    drivePattern?: 'city' | 'highway' | 'mixed'
    issues?: string
    maintenanceHistory?: string[]
  }
}): InsightContext {
  return {
    vehicle: {
      year: data.vehicleData.vehicle.year,
      make: data.vehicleData.vehicle.make,
      model: data.vehicleData.vehicle.model,
      trim: data.vehicleData.vehicle.trim,
      engine: data.vehicleData.specs.engine,
      mileage: data.userInputs?.mileage
    },
    safetyData: data.safetyData,
    userContext: {
      mileage: data.userInputs?.mileage,
      drivePattern: data.userInputs?.drivePattern,
      recentIssues: data.userInputs?.issues ? [data.userInputs.issues] : undefined,
      maintenanceHistory: data.userInputs?.maintenanceHistory
    }
  }
}
