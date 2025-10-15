/**
 * AI Helper - Simplified OpenAI Integration for Scripts
 * 
 * Purpose: Get counterpoint perspective from different model family
 * Use: Strategic decisions, architecture reviews, diagnostics
 * 
 * NOT for orchestration - just for getting different AI opinions
 */

import { callOpenAI, parseOpenAIJSON } from '../../lib/ai/openai-client'

export interface AIAnalysisRequest {
  role: string        // "product strategist", "database expert", etc.
  task: string        // What to analyze/decide
  data: any          // Context/data to analyze
  format?: string    // Expected output format (optional)
}

export interface AIAnalysisResult<T = any> {
  analysis: T
  model: string
  tokens: {
    input: number
    output: number
  }
  cost: number
}

/**
 * Get OpenAI analysis/recommendation
 * Use this for counterpoint perspective on strategic decisions
 */
export async function getOpenAIAnalysis<T = any>(
  request: AIAnalysisRequest
): Promise<AIAnalysisResult<T>> {
  const systemPrompt = `You are a ${request.role}.

Task: ${request.task}

${request.format ? `Output format: ${request.format}` : 'Provide structured, actionable analysis.'}

Be specific, concrete, and focused on practical value.`

  const response = await callOpenAI({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(request.data, null, 2) }
    ],
    temperature: 0.2, // Deterministic for consistency
    max_tokens: 2000
  })

  // Calculate cost (GPT-4 Turbo pricing: $0.01/1K input, $0.03/1K output)
  const cost = (response.usage.prompt_tokens / 1000 * 0.01) + 
               (response.usage.completion_tokens / 1000 * 0.03)

  return {
    analysis: request.format?.includes('JSON') 
      ? parseOpenAIJSON<T>(response)
      : response.content as T,
    model: response.model,
    tokens: {
      input: response.usage.prompt_tokens,
      output: response.usage.completion_tokens
    },
    cost
  }
}

/**
 * Get multiple perspectives (useful for key decisions)
 * Returns both to compare/contrast
 */
export async function getCounterpointAnalysis<T = any>(
  request: AIAnalysisRequest,
  windsurf: T
): Promise<{
  windsurf: T
  openai: T
  agreement: boolean
  differences: string[]
}> {
  const openaiResult = await getOpenAIAnalysis<T>(request)
  
  // Simple agreement check (can be enhanced)
  const agreement = JSON.stringify(windsurf) === JSON.stringify(openaiResult.analysis)
  
  return {
    windsurf,
    openai: openaiResult.analysis,
    agreement,
    differences: agreement ? [] : [
      'Different perspectives detected - review both recommendations'
    ]
  }
}

/**
 * Quick OpenAI question (no structured response)
 */
export async function askOpenAI(
  role: string,
  question: string,
  context?: any
): Promise<string> {
  const response = await callOpenAI({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: `You are a ${role}. Be concise and practical.` },
      { 
        role: 'user', 
        content: context 
          ? `${question}\n\nContext: ${JSON.stringify(context)}`
          : question
      }
    ],
    temperature: 0.2,
    max_tokens: 1000
  })

  return response.content
}

/**
 * Get OpenAI recommendations (structured)
 */
export async function getOpenAIRecommendations(
  expert: string,
  situation: string,
  data: any
): Promise<{
  recommendation: string
  reasoning: string[]
  alternatives: string[]
  risks: string[]
  confidence: number
}> {
  const result = await getOpenAIAnalysis<any>({
    role: expert,
    task: `Analyze the situation and provide recommendations.

Situation: ${situation}`,
    data,
    format: 'JSON with: recommendation, reasoning[], alternatives[], risks[], confidence (0-1)'
  })

  return result.analysis
}

/**
 * Usage tracking for AI calls
 */
let totalCost = 0
let totalCalls = 0

export function trackAIUsage(cost: number) {
  totalCost += cost
  totalCalls += 1
}

export function getAIUsageStats() {
  return {
    totalCalls,
    totalCost: totalCost.toFixed(2),
    averageCost: (totalCost / totalCalls).toFixed(4)
  }
}

/**
 * Reset usage tracking (useful for per-script tracking)
 */
export function resetAIUsage() {
  totalCost = 0
  totalCalls = 0
}
