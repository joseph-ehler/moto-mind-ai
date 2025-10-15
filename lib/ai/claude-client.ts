/**
 * Claude API Client
 * 
 * Wrapper for Claude API calls with error handling and retries
 */

import Anthropic from '@anthropic-ai/sdk'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeRequest {
  model?: string
  messages: ClaudeMessage[]
  max_tokens?: number
  temperature?: number
  system?: string
}

export interface ClaudeResponse {
  content: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Call Claude API with retry logic
 */
export async function callClaude(request: ClaudeRequest): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set')
  }
  
  const client = new Anthropic({ apiKey })
  
  const response = await client.messages.create({
    model: request.model || 'claude-sonnet-4-20250514',
    max_tokens: request.max_tokens || 4000,
    temperature: request.temperature || 0.3,
    system: request.system,
    messages: request.messages
  })
  
  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }
  
  return {
    content: content.text,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens
    }
  }
}

/**
 * Helper to parse JSON from Claude response
 */
export function parseClaudeJSON<T>(response: ClaudeResponse): T {
  try {
    // Claude sometimes wraps JSON in markdown code blocks
    let content = response.content.trim()
    
    // Remove markdown code blocks if present
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '')
    }
    
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to parse JSON from Claude: ${error}`)
  }
}
