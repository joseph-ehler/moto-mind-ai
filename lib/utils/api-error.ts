import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'

// Standard API error response
interface ApiError {
  error: string
  code: string
  message: string
  details?: any
  requestId?: string
}

// Standard API success response
interface ApiSuccess<T = any> {
  success: true
  data: T
  requestId?: string
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
} as const

// Custom API error class
export class ApiErrorClass extends Error {
  constructor(
    public code: keyof typeof ERROR_CODES,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Generate request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Error handler wrapper
export function withApiError<T = any>(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<T>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    // Add request ID to request object
    ;(req as any).requestId = requestId

    try {
      console.log(`🚀 API ${req.method} ${req.url} - Request ID: ${requestId}`)
      
      const result = await handler(req, res)
      
      const duration = Date.now() - startTime
      console.log(`✅ API ${req.method} ${req.url} - ${res.statusCode} in ${duration}ms`)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      if (error instanceof ApiErrorClass) {
        console.error(`❌ API ${req.method} ${req.url} - ${error.code}: ${error.message} (${duration}ms)`)
        
        return res.status(error.statusCode).json({
          error: error.code,
          code: error.code,
          message: error.message,
          details: error.details,
          requestId,
        } as ApiError)
      }

      if (error instanceof z.ZodError) {
        console.error(`❌ API ${req.method} ${req.url} - Validation Error (${duration}ms):`, error.errors)
        
        return res.status(400).json({
          error: ERROR_CODES.VALIDATION_ERROR,
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: error.errors,
          requestId,
        } as ApiError)
      }

      // Unknown error
      console.error(`💥 API ${req.method} ${req.url} - Unexpected Error (${duration}ms):`, error)
      
      return res.status(500).json({
        error: ERROR_CODES.INTERNAL_ERROR,
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Internal server error',
        requestId,
      } as ApiError)
    }
  }
}

// Helper functions for common errors
export const apiErrors = {
  notFound: (message = 'Resource not found') => 
    new ApiErrorClass('NOT_FOUND', message, 404),
  
  badRequest: (message = 'Bad request') => 
    new ApiErrorClass('BAD_REQUEST', message, 400),
  
  unauthorized: (message = 'Unauthorized') => 
    new ApiErrorClass('UNAUTHORIZED', message, 401),
  
  forbidden: (message = 'Forbidden') => 
    new ApiErrorClass('FORBIDDEN', message, 403),
  
  methodNotAllowed: (method: string) => 
    new ApiErrorClass('METHOD_NOT_ALLOWED', `Method ${method} not allowed`, 405),
  
  rateLimited: (message = 'Rate limit exceeded') => 
    new ApiErrorClass('RATE_LIMITED', message, 429),
  
  validation: (message = 'Validation failed', details?: any) => 
    new ApiErrorClass('VALIDATION_ERROR', message, 400, details),
}

// Success response helper
export function apiSuccess<T>(data: T, requestId?: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    requestId,
  }
}
