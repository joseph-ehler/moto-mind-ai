// OpenAI JSON Response Parser
// Handles code fence removal and safe JSON parsing with helpful errors

import { VisionErrorCodes } from '../clients/openai'

export interface ParsedResponse<T = any> {
  data: T
  confidence: number
  warnings: string[]
}

/**
 * Strips markdown code fences from OpenAI responses
 * Handles: ```json, ```typescript, ``` (generic), and plain text
 */
export function stripCodeFences(content: string): string {
  if (!content || typeof content !== 'string') {
    return ''
  }

  // Remove leading/trailing whitespace
  let cleaned = content.trim()
  
  // Pattern to match code fences with optional language
  const fencePattern = /^```(?:json|typescript|ts|javascript|js)?\s*\n?([\s\S]*?)\n?```$/
  const match = cleaned.match(fencePattern)
  
  if (match) {
    cleaned = match[1].trim()
  }
  
  return cleaned
}

/**
 * Safely parses JSON with detailed error information
 */
export function safeJsonParse<T = any>(jsonString: string): T {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error(`${VisionErrorCodes.PARSE_FAILED}: Empty or invalid JSON string`)
  }

  try {
    const parsed = JSON.parse(jsonString)
    
    // Basic validation - should be an object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error(`${VisionErrorCodes.PARSE_FAILED}: JSON must be an object, got ${typeof parsed}`)
    }
    
    return parsed as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Provide helpful context for JSON syntax errors
      const lines = jsonString.split('\n')
      const errorContext = lines.slice(0, 5).join('\n') // First 5 lines for context
      
      throw new Error(
        `${VisionErrorCodes.PARSE_FAILED}: JSON syntax error - ${error.message}\n` +
        `Context: ${errorContext}${lines.length > 5 ? '\n...' : ''}`
      )
    }
    
    throw error
  }
}

/**
 * Complete OpenAI response parsing pipeline
 * Strips fences, parses JSON, and provides validation
 */
export function parseOpenAIResponse<T = any>(content: string): ParsedResponse<T> {
  const warnings: string[] = []
  
  // Step 1: Strip code fences
  const cleanedContent = stripCodeFences(content)
  
  if (cleanedContent !== content.trim()) {
    warnings.push('Removed markdown code fences from response')
  }
  
  // Step 2: Parse JSON
  const data = safeJsonParse<T>(cleanedContent)
  
  // Step 3: Extract confidence if present
  let confidence = 1.0 // Default confidence
  if (typeof data === 'object' && data !== null) {
    const dataObj = data as any
    if (typeof dataObj.confidence === 'number') {
      confidence = Math.max(0, Math.min(1, dataObj.confidence))
    } else if (typeof dataObj.confidence === 'string') {
      const parsed = parseFloat(dataObj.confidence)
      if (!isNaN(parsed)) {
        confidence = Math.max(0, Math.min(1, parsed))
      }
    }
  }
  
  return {
    data,
    confidence,
    warnings
  }
}

/**
 * Validates that required fields are present in parsed data
 */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missing: string[] = []
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === null || data[field] === undefined) {
      missing.push(field)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `${VisionErrorCodes.VALIDATION_FAILED}: Missing required fields: ${missing.join(', ')}`
    )
  }
}

/**
 * Sanitizes extracted data by removing null/undefined values and empty strings
 */
export function sanitizeExtractedData(data: any): any {
  if (data === null || data === undefined) {
    return null
  }
  
  if (Array.isArray(data)) {
    return data
      .map(item => sanitizeExtractedData(item))
      .filter(item => item !== null && item !== undefined)
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      const cleanValue = sanitizeExtractedData(value)
      
      // Skip null, undefined, empty strings, and empty objects
      if (cleanValue !== null && 
          cleanValue !== undefined && 
          cleanValue !== '' &&
          !(typeof cleanValue === 'object' && Object.keys(cleanValue).length === 0)) {
        sanitized[key] = cleanValue
      }
    }
    
    return sanitized
  }
  
  // Return primitive values as-is (strings, numbers, booleans)
  return data
}
