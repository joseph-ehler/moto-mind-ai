// Robust Retry Logic for OpenAI Vision API
// Handles temporary failures with exponential backoff and model escalation

import OpenAI from 'openai'
import { selectOptimalModel, ModelSelectionConfig } from './smart-model-selection'

export interface RetryConfig {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  escalateModel?: boolean
  timeout?: number
}

export interface VisionRequest {
  base64Image: string
  prompt: string
  documentType: string
  costBudget?: 'low' | 'medium' | 'high'
}

export interface VisionResponse {
  content: string
  model: string
  attempt: number
  totalCost: number
  processingTime: number
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Default retry configuration
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  escalateModel: true,
  timeout: 60000 // 60 seconds
}

// Exponential backoff with jitter
const calculateDelay = (attempt: number, baseDelay: number, maxDelay: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 0.1 * exponentialDelay // 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay)
}

// Check if error is retryable
const isRetryableError = (error: any): boolean => {
  if (!error) return false
  
  // OpenAI specific retryable errors
  const retryableCodes = [
    'rate_limit_exceeded',
    'server_error',
    'timeout',
    'service_unavailable'
  ]
  
  // HTTP status codes that are retryable
  const retryableStatus = [429, 500, 502, 503, 504]
  
  return (
    retryableCodes.includes(error.code) ||
    retryableStatus.includes(error.status) ||
    error.message?.includes('timeout') ||
    error.message?.includes('network')
  )
}

// Main retry function with smart model selection
export async function visionWithRetry(
  request: VisionRequest,
  retryConfig: RetryConfig = {}
): Promise<VisionResponse> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig }
  const { base64Image, prompt, documentType, costBudget = 'medium' } = request
  
  let lastError: any
  let totalCost = 0
  const startTime = Date.now()
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Select optimal model for this attempt
      const modelConfig: ModelSelectionConfig = {
        documentType,
        retryAttempt: attempt,
        costBudget
      }
      
      const modelChoice = selectOptimalModel(modelConfig)
      console.log(`🤖 Attempt ${attempt + 1}: Using ${modelChoice.model} - ${modelChoice.reasoning}`)
      
      // Make the API call with timeout
      const apiCall = openai.chat.completions.create({
        model: modelChoice.model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: modelChoice.maxTokens,
        temperature: 0.1
      })
      
      // Add timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), config.timeout)
      })
      
      const response = await Promise.race([apiCall, timeoutPromise]) as any
      const content = response.choices[0]?.message?.content
      
      if (!content) {
        throw new Error('Empty response from OpenAI Vision')
      }
      
      totalCost += modelChoice.estimatedCost
      const processingTime = Date.now() - startTime
      
      console.log(`✅ Success on attempt ${attempt + 1} with ${modelChoice.model}`)
      
      return {
        content: content.trim(),
        model: modelChoice.model,
        attempt: attempt + 1,
        totalCost,
        processingTime
      }
      
    } catch (error) {
      lastError = error
      console.error(`❌ Attempt ${attempt + 1} failed:`, error)
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        console.log('🚫 Non-retryable error, failing immediately')
        break
      }
      
      // Don't wait after the last attempt
      if (attempt < config.maxRetries) {
        const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay)
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // All attempts failed
  const processingTime = Date.now() - startTime
  console.error(`💥 All ${config.maxRetries + 1} attempts failed`)
  
  throw new Error(`Vision extraction failed after ${config.maxRetries + 1} attempts. Last error: ${lastError?.message || 'Unknown error'}`)
}

// Convenience functions for common document types
export const extractOdometer = (base64Image: string, retryConfig?: RetryConfig) => {
  return visionWithRetry({
    base64Image,
    prompt: 'Extract the odometer reading. Return only the numeric mileage value.',
    documentType: 'odometer',
    costBudget: 'low'
  }, retryConfig)
}

export const extractFuelReceipt = (base64Image: string, retryConfig?: RetryConfig) => {
  return visionWithRetry({
    base64Image,
    prompt: 'Extract fuel receipt data: {"station": "name", "total": 0.00, "gallons": 0.0, "date": "YYYY-MM-DD"}',
    documentType: 'fuel',
    costBudget: 'low'
  }, retryConfig)
}

export const extractServiceInvoice = (base64Image: string, retryConfig?: RetryConfig) => {
  return visionWithRetry({
    base64Image,
    prompt: 'Extract service invoice: {"shop": "name", "services": ["list"], "total": 0.00, "date": "YYYY-MM-DD"}',
    documentType: 'service_invoice',
    costBudget: 'medium'
  }, retryConfig)
}

// Circuit breaker pattern for system-wide failures
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private successCount = 0
  
  constructor(
    private threshold = CircuitBreaker.getRecommendedThreshold(),
    private timeout = 300000, // 5 minutes for OpenAI outages
    private halfOpenSuccessThreshold = 3 // Require 3 successes to close circuit
  ) {}
  
  // Smart threshold based on deployment scale
  static getRecommendedThreshold(): number {
    const dailyVolume = parseInt(process.env.EXPECTED_DAILY_DOCUMENTS || '100')
    
    if (dailyVolume < 50) return 5      // Small deployment: 5 failures
    if (dailyVolume < 200) return 10    // Medium deployment: 10 failures  
    if (dailyVolume < 1000) return 20   // Large deployment: 20 failures
    return 50                           // Enterprise: 50 failures
  }
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open - too many recent failures')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    if (this.state === 'half-open') {
      this.successCount++
      if (this.successCount >= this.halfOpenSuccessThreshold) {
        this.failures = 0
        this.successCount = 0
        this.state = 'closed'
      }
    } else {
      this.failures = 0
      this.state = 'closed'
    }
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

export const visionCircuitBreaker = new CircuitBreaker()

// Enhanced wrapper with circuit breaker
export const safeVisionExtraction = async (
  request: VisionRequest,
  retryConfig?: RetryConfig
): Promise<VisionResponse> => {
  return visionCircuitBreaker.execute(() => visionWithRetry(request, retryConfig))
}
