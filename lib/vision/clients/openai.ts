// OpenAI Vision Client with retry, timeout, and error handling
// Centralized client for all vision processing requests

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface VisionCallOptions {
  prompt: string
  image: string
  mimeType: string
  model?: string
  maxTokens?: number
  maxOutputTokens?: number // GPT-5 parameter
  temperature?: number
  reasoning?: { effort: 'minimal' | 'low' | 'medium' | 'high' } // GPT-5 parameter
  text?: { verbosity: 'low' | 'medium' | 'high' } // GPT-5 parameter
  timeout?: number
  maxRetries?: number
}

interface VisionResponse {
  content: string
  model: string
  inputTokens?: number
  outputTokens?: number
  processingMs: number
}
export class OpenAIVisionClient {
  private defaultTimeout = 120000 // 120 seconds for large images
  private defaultMaxRetries = 2 // Reduce retries since timeouts are long
  private defaultModel = 'gpt-4o' // Back to working GPT-4o for now

  async vision(options: VisionCallOptions): Promise<VisionResponse> {
    const {
      prompt,
      image,
      mimeType,
      model = this.defaultModel,
      maxTokens = 1000,
      maxOutputTokens,
      temperature = 0,
      reasoning = { effort: 'low' }, // GPT-5 parameters (ignored for now)
      text = { verbosity: 'medium' }, // GPT-5 parameters (ignored for now)
      timeout = this.defaultTimeout,
      maxRetries = this.defaultMaxRetries
    } = options

    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const startTime = performance.now()
        
        const response = await Promise.race([
          this.makeVisionCall({
            prompt,
            image,
            mimeType,
            model,
            maxTokens: maxOutputTokens || maxTokens,
            temperature
          }),
          this.timeoutPromise(timeout)
        ])

        const processingMs = Math.round(performance.now() - startTime)
        
        return {
          content: response.content,
          model: response.model,
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
          processingMs
        }
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          break
        }
        
        // Exponential backoff for retryable errors
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          await this.sleep(backoffMs)
        }
      }
    }

    throw lastError || new Error('Vision call failed after all retries')
  }

  private async makeVisionCall(options: {
    prompt: string
    image: string
    mimeType: string
    model: string
    maxTokens: number
    temperature?: number
  }) {
    const response = await openai.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: options.prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${options.mimeType};base64,${options.image}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response content from OpenAI Vision API')
    }

    return {
      content,
      model: response.model,
      usage: response.usage
    }
  }

  private timeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('UPSTREAM_TIMEOUT')), timeoutMs)
    })
  }

  private isNonRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || ''
    const errorCode = error?.code
    
    // Don't retry on authentication, invalid requests, etc.
    if (errorCode === 'invalid_api_key' || errorCode === 'invalid_request_error') {
      return true
    }
    
    if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
      return true
    }
    
    return false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const openaiVisionClient = new OpenAIVisionClient()

// Error codes for consistent error handling
export const VisionErrorCodes = {
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT', 
  PARSE_FAILED: 'PARSE_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MODE_UNSUPPORTED: 'MODE_UNSUPPORTED',
  NO_FILE: 'NO_FILE',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE'
} as const

export type VisionErrorCode = typeof VisionErrorCodes[keyof typeof VisionErrorCodes]
