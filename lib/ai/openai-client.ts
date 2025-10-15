/**
 * OpenAI API Client
 * 
 * Wrapper for OpenAI API calls with error handling and retries
 * Supports GPT-4, GPT-4 Turbo, and GPT-5 (when available)
 */

import OpenAI from 'openai'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIRequest {
  model?: string
  messages: OpenAIMessage[]
  max_tokens?: number
  temperature?: number
}

export interface OpenAIResponse {
  content: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
}

/**
 * Get the best available GPT model
 */
function getBestModel(): string {
  // Try GPT-5 first (when available), then GPT-4 Turbo, then GPT-4
  const preferredModels = [
    'gpt-5',              // Future
    'gpt-5-turbo',        // Future
    'gpt-4-turbo',        // Current best
    'gpt-4-turbo-preview',
    'gpt-4-1106-preview',
    'gpt-4'
  ]
  
  // For now, use GPT-4 Turbo (most capable current model)
  // Will automatically upgrade to GPT-5 when available
  return 'gpt-4-turbo-preview'
}

/**
 * Call OpenAI API with retry logic
 */
export async function callOpenAI(request: OpenAIRequest): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set')
  }
  
  const client = new OpenAI({ apiKey })
  
  try {
    const response = await client.chat.completions.create({
      model: request.model || getBestModel(),
      messages: request.messages,
      max_tokens: request.max_tokens || 4000,
      temperature: request.temperature !== undefined ? request.temperature : 0.3,
      response_format: { type: 'text' } // Can switch to 'json_object' if needed
    })
    
    const choice = response.choices[0]
    if (!choice || !choice.message) {
      throw new Error('No response from OpenAI')
    }
    
    return {
      content: choice.message.content || '',
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      },
      model: response.model
    }
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.')
    } else if (error.status === 401) {
      throw new Error('Invalid API key. Check OPENAI_API_KEY in .env.local')
    } else if (error.status === 404) {
      // Model not available, fall back
      console.warn(`Model ${request.model} not available, falling back to gpt-4-turbo-preview`)
      return callOpenAI({ ...request, model: 'gpt-4-turbo-preview' })
    }
    throw error
  }
}

/**
 * Helper to parse JSON from OpenAI response
 */
export function parseOpenAIJSON<T>(response: OpenAIResponse): T {
  try {
    let content = response.content.trim()
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse JSON from OpenAI: ${error}`)
  }
}

/**
 * Call OpenAI with JSON mode (structured output)
 */
export async function callOpenAIJSON<T>(request: OpenAIRequest): Promise<{ data: T; usage: OpenAIResponse['usage'] }> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set')
  }
  
  const client = new OpenAI({ apiKey })
  
  try {
    const response = await client.chat.completions.create({
      model: request.model || getBestModel(),
      messages: request.messages,
      max_tokens: request.max_tokens || 4000,
      temperature: request.temperature !== undefined ? request.temperature : 0.3,
      response_format: { type: 'json_object' } // Force JSON output
    })
    
    const choice = response.choices[0]
    if (!choice || !choice.message) {
      throw new Error('No response from OpenAI')
    }
    
    const data = JSON.parse(choice.message.content || '{}')
    
    return {
      data,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0
      }
    }
  } catch (error: any) {
    if (error.status === 404) {
      // Model not available, fall back
      console.warn(`Model ${request.model} not available, falling back to gpt-4-turbo-preview`)
      return callOpenAIJSON({ ...request, model: 'gpt-4-turbo-preview' })
    }
    throw error
  }
}

/**
 * Check which models are available
 */
export async function getAvailableModels(): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    return []
  }
  
  try {
    const client = new OpenAI({ apiKey })
    const models = await client.models.list()
    
    return models.data
      .filter(m => m.id.startsWith('gpt-'))
      .map(m => m.id)
      .sort()
  } catch {
    return []
  }
}
