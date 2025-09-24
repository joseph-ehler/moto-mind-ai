// MotoMindAI: LLM Safety with Zod Validation
// Bulletproof JSON parsing with template fallbacks

import { z } from 'zod'

export const ExplanationReasoningSchema = z.object({
  answer: z.string().max(500, 'Answer too long'),
  rootCause: z.array(z.string()).max(5, 'Too many root causes'),
  supportingData: z.array(z.object({
    metric: z.string(),
    value: z.union([z.number(), z.string()]),
    threshold: z.union([z.number(), z.string()]).optional(),
    period: z.string().optional(),
    sourceIds: z.array(z.number()).optional()
  })).max(10, 'Too many supporting data points'),
  recommendations: z.array(z.string()).max(3, 'Too many recommendations'),
  missingData: z.array(z.string()).optional()
})

export type ExplanationReasoning = z.infer<typeof ExplanationReasoningSchema>

export interface RuleResult {
  hit: boolean
  severity: 'info' | 'warn' | 'crit'
  type: string
  reason: string
  evidence: {
    metric: string
    value: any
    threshold?: any
    period?: string
    sourceIds: number[]
  }
}

export interface DataQualityReport {
  completeness: number // 0-100
  latency: number // seconds since last update
  sensors: Record<string, boolean>
  recommendations: string[]
}

// Safe LLM response parser with fallback
export function parseExplanationResponse(
  response: string,
  fallbackTemplate: ExplanationReasoning
): ExplanationReasoning {
  try {
    // Clean response (remove markdown code blocks if present)
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    
    // Validate with Zod
    return ExplanationReasoningSchema.parse(parsed)
  } catch (error) {
    console.warn('LLM response parsing failed, using template:', error)
    return fallbackTemplate
  }
}

// Template fallback generator (deterministic, always works)
export function generateTemplateExplanation(
  ruleResults: RuleResult[],
  dataQuality: DataQualityReport
): ExplanationReasoning {
  const criticalRules = ruleResults.filter(r => r.severity === 'crit')
  const warningRules = ruleResults.filter(r => r.severity === 'warn')
  
  let answer = 'Vehicle flagged due to: '
  const rootCause: string[] = []
  const supportingData: any[] = []
  const recommendations: string[] = []
  
  if (criticalRules.length > 0) {
    const rule = criticalRules[0]
    answer += rule.reason
    rootCause.push(rule.reason)
    supportingData.push({
      metric: rule.evidence.metric,
      value: rule.evidence.value,
      threshold: rule.evidence.threshold
    })
    recommendations.push('Schedule immediate inspection')
  } else if (warningRules.length > 0) {
    const rule = warningRules[0]
    answer += rule.reason
    rootCause.push(rule.reason)
    supportingData.push({
      metric: rule.evidence.metric,
      value: rule.evidence.value,
      threshold: rule.evidence.threshold
    })
    recommendations.push('Monitor and schedule maintenance')
  } else {
    answer = 'No critical issues detected'
    rootCause.push('Routine monitoring')
    recommendations.push('Continue normal operations')
  }
  
  return {
    answer,
    rootCause,
    supportingData,
    recommendations,
    missingData: dataQuality.recommendations
  }
}
