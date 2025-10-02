// MotoMind: Structured Error System
// Production-ready error handling with proper HTTP status codes

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

// Database-specific errors
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(`Database error: ${message}`, 500, 'DATABASE_ERROR', originalError)
    this.name = 'DatabaseError'
  }
}

export class TenantIsolationError extends AppError {
  constructor(tenantId: string) {
    super(`Tenant isolation violation: ${tenantId}`, 403, 'TENANT_ISOLATION_ERROR')
    this.name = 'TenantIsolationError'
  }
}

// Error response formatter
export interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
  path?: string
}

export function formatErrorResponse(error: AppError, path?: string): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    },
    timestamp: new Date().toISOString(),
    path
  }
}

// Error handler for API routes
export function handleApiError(error: unknown, path?: string): { status: number; body: ErrorResponse } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: formatErrorResponse(error, path)
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const validationError = new ValidationError('Validation failed', error)
    return {
      status: validationError.statusCode,
      body: formatErrorResponse(validationError, path)
    }
  }

  // Unknown error - don't leak details in production
  const unknownError = new AppError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : String(error)
  )
  
  return {
    status: unknownError.statusCode,
    body: formatErrorResponse(unknownError, path)
  }
}
