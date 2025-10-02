// MotoMindAI: Hardened LLM Client with Zod Validation
// Production-safe LLM integration with fallbacks

import { OpenAI } from 'openai'
import { ExplanationReasoningSchema, ExplanationReasoning, generateTemplateExplanation, parseExplanationResponse } from './explanation-schema'
import { RuleResult, VehicleMetrics } from './reasoning/fleet-rules'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface LLMExplanationRequest {
  question: string
  ruleResults: RuleResult[]
  metrics: VehicleMetrics
  vehicleLabel?: string
}

export interface LLMExplanationResponse {
  reasoning: ExplanationReasoning
  confidence: 'high' | 'medium' | 'low'
  tokensUsed: { in: number; out: number }
  fallbackUsed: boolean
}

export async function generateExplanationWithLLM(
  request: LLMExplanationRequest
): Promise<LLMExplanationResponse> {
  const { question, ruleResults, metrics, vehicleLabel = 'Vehicle' } = request
  
  // Check data quality first
  const dataQuality = calculateDataQuality(metrics)
  if (dataQuality.completeness < 50) {
    // Use template fallback for insufficient data
    const templateReasoning = generateTemplateExplanation(ruleResults, dataQuality)
    return {
      reasoning: templateReasoning,
      confidence: 'low',
      tokensUsed: { in: 0, out: 0 },
      fallbackUsed: true
    }
  }
  
  try {
    // Construct safe prompt with whitelisted metrics only
    const prompt = buildSafePrompt(question, ruleResults, metrics, vehicleLabel)
    
    // Call OpenAI with timeout protection
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a fleet management expert. Provide clear, actionable explanations for vehicle issues. Always respond with valid JSON matching the required schema.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent responses
        max_tokens: 1000,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('LLM timeout')), 15000)
      )
    ])
    
    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Empty LLM response')
    }
    
    // Parse with Zod validation and fallback
    const templateFallback = generateTemplateExplanation(ruleResults, dataQuality)
    const reasoning = parseExplanationResponse(response, templateFallback)
    
    // Determine confidence based on data quality and parsing success
    const confidence = determineConfidence(dataQuality, reasoning, response)
    
    return {
      reasoning,
      confidence,
      tokensUsed: {
        in: completion.usage?.prompt_tokens || 0,
        out: completion.usage?.completion_tokens || 0
      },
      fallbackUsed: false
    }
  } catch (error) {
    console.warn('LLM generation failed, using template fallback:', error)
    
    // Always provide a working response via template
    const templateReasoning = generateTemplateExplanation(ruleResults, dataQuality)
    return {
      reasoning: templateReasoning,
      confidence: 'low',
      tokensUsed: { in: 0, out: 0 },
      fallbackUsed: true
    }
  }
}

function buildSafePrompt(
  question: string,
  ruleResults: RuleResult[],
  metrics: VehicleMetrics,
  vehicleLabel: string
): string {
  // Whitelist only safe metric fields to prevent prompt injection
  const safeMetrics = {
    brake_wear_pct: metrics.brake_wear_pct,
    fuel_efficiency_mpg: metrics.fuel_efficiency_mpg,
    harsh_events: metrics.harsh_events,
    idle_minutes: metrics.idle_minutes,
    miles_driven: metrics.miles_driven,
    data_completeness_pct: metrics.data_completeness_pct,
    source_latency_sec: metrics.source_latency_sec
  }
  
  const hitRules = ruleResults.filter(r => r.hit)
  const criticalRules = hitRules.filter(r => r.severity === 'critical')
  const warningRules = hitRules.filter(r => r.severity === 'warning')
  
  return `
Question: "${question}"

Vehicle: ${vehicleLabel}
Current Metrics: ${JSON.stringify(safeMetrics, null, 2)}

Rule Evaluation Results:
${hitRules.length > 0 ? hitRules.map(r => `- ${r.severity.toUpperCase()}: ${r.reason}`).join('\n') : '- No issues detected'}

Critical Issues: ${criticalRules.length}
Warning Issues: ${warningRules.length}

Please provide a clear explanation in JSON format with:
{
  "answer": "Brief explanation (max 500 chars)",
  "rootCause": ["Primary causes as array"],
  "supportingData": [{"metric": "name", "value": number, "threshold": number}],
  "recommendations": ["Actionable recommendations"],
  "missingData": ["Any missing sensors or data points"]
}

Focus on actionable insights for fleet managers and DOT compliance.
`
}

function calculateDataQuality(metrics: VehicleMetrics) {
  const requiredFields = ['brake_wear_pct', 'fuel_efficiency_mpg', 'harsh_events', 'idle_minutes']
  const availableFields = requiredFields.filter(field => metrics[field as keyof VehicleMetrics] !== undefined)
  const completeness = Math.round((availableFields.length / requiredFields.length) * 100)
  
  const sensors = {
    brake_wear: !!metrics.brake_wear_pct,
    fuel_efficiency: !!metrics.fuel_efficiency_mpg,
    harsh_events: !!metrics.harsh_events,
    idle_time: !!metrics.idle_minutes
  }
  
  const recommendations: string[] = []
  if (!sensors.brake_wear) recommendations.push('Install brake wear sensors')
  if (!sensors.fuel_efficiency) recommendations.push('Enable fuel monitoring')
  if (!sensors.harsh_events) recommendations.push('Configure harsh event detection')
  if (!sensors.idle_time) recommendations.push('Enable idle time tracking')
  
  return {
    completeness,
    latency: metrics.source_latency_sec,
    sensors,
    recommendations
  }
}

function determineConfidence(
  dataQuality: ReturnType<typeof calculateDataQuality>,
  reasoning: ExplanationReasoning,
  originalResponse: string
): 'high' | 'medium' | 'low' {
  // High confidence: good data quality + successful parsing
  if (dataQuality.completeness >= 80 && dataQuality.latency < 300 && originalResponse.includes('{')) {
    return 'high'
  }
  
  // Medium confidence: decent data or successful parsing
  if (dataQuality.completeness >= 60 || originalResponse.includes('{')) {
    return 'medium'
  }
  
  // Low confidence: poor data quality or template fallback
  return 'low'
}
