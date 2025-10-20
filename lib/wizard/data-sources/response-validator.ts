/**
 * Ultra God-Tier Wizard: Response Validator
 * 
 * Validates data source responses against Zod schemas.
 * Prevents "bad shape → broken UI" bugs.
 * 
 * Phase B-3: Data Source Registry (Production Polish)
 */

import { z } from 'zod'
import { DataSourceError, DataSourceErrorCode } from './errors'

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate response data against schema
 * 
 * Throws DataSourceError if validation fails
 */
export function validateResponse(
  data: unknown,
  schema: z.ZodType<any>,
  sourceName: string
): any {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors
      const issues = error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`[DataSource] Response validation failed for "${sourceName}":`, {
          issues,
          received: getRedactedPreview(data),
        })
      }
      
      throw new DataSourceError(
        DataSourceErrorCode.VALIDATION,
        `Response validation failed for ${sourceName}`,
        { issues }
      )
    }
    
    throw error
  }
}

/**
 * Check if response matches schema (non-throwing)
 */
export function isValidResponse(
  data: unknown,
  schema: z.ZodType<any>
): boolean {
  const result = schema.safeParse(data)
  return result.success
}

/**
 * Get validation errors without throwing
 */
export function getValidationErrors(
  data: unknown,
  schema: z.ZodType<any>
): Array<{ path: string; message: string }> | null {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return null
  }
  
  return result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

// ============================================================================
// REDACTED PREVIEW (for logging)
// ============================================================================

/**
 * Get redacted preview of data for safe logging
 * 
 * Shows structure but masks values
 */
export function getRedactedPreview(
  data: unknown,
  depth = 2,
  currentDepth = 0
): any {
  if (currentDepth >= depth) {
    return '...'
  }
  
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'string') {
    // Show length, mask content
    return data.length <= 4 ? '***' : `***${data.slice(-4)} (${data.length} chars)`
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return []
    }
    
    // Show first item only
    return [
      getRedactedPreview(data[0], depth, currentDepth + 1),
      `... ${data.length - 1} more`,
    ]
  }
  
  if (typeof data === 'object') {
    const preview: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      preview[key] = getRedactedPreview(value, depth, currentDepth + 1)
    }
    
    return preview
  }
  
  return String(data)
}

// ============================================================================
// COMMON SCHEMAS (helpers)
// ============================================================================

/**
 * Schema for VIN decode response
 */
export const VINDecodeSchema = z.object({
  vehicle: z.object({
    vin: z.string().length(17),
    year: z.number().min(1900).max(2100),
    make: z.string(),
    model: z.string(),
    trim: z.string().optional(),
  }),
  rollup: z.object({
    safety: z.object({
      rating: z.number().min(0).max(5).optional(),
      features: z.array(z.string()).optional(),
    }).optional(),
    epa: z.object({
      city: z.number().optional(),
      highway: z.number().optional(),
      combined: z.number().optional(),
    }).optional(),
  }).optional(),
})

/**
 * Schema for user profile response
 */
export const UserProfileSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  preferences: z.record(z.string(), z.any()).optional(),
})

/**
 * Schema for async validation response
 */
export const AsyncValidationSchema = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  suggestions: z.array(z.string()).optional(),
})
