// API Authentication Middleware
// Provides JWT-based authentication for API endpoints

import { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  email: string
  tenantId: string
  role: 'user' | 'admin'
  permissions: string[]
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: AuthenticatedUser
}

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

// Extract token from Authorization header
function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return null
  }
  
  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return authHeader
}

// Verify JWT token and extract user info
function verifyToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Validate required fields
    if (!decoded.id || !decoded.email || !decoded.tenantId) {
      console.warn('Invalid token payload:', decoded)
      return null
    }
    
    return {
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    }
  } catch (error) {
    console.warn('Token verification failed:', error.message)
    return null
  }
}

// Authentication middleware
export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  next?: () => void
): AuthenticatedUser | null {
  const token = extractToken(req)
  
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_TOKEN_MISSING'
    })
    return null
  }
  
  const user = verifyToken(token)
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'AUTH_TOKEN_INVALID'
    })
    return null
  }
  
  // Attach user to request
  ;(req as AuthenticatedRequest).user = user
  
  if (next) {
    next()
  }
  
  return user
}

// Role-based authorization
export function requireRole(allowedRoles: string[]) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const user = requireAuth(req, res)
    if (!user) return null // Auth already handled response
    
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_ROLE',
        required: allowedRoles,
        current: user.role
      })
      return null
    }
    
    if (next) {
      next()
    }
    
    return user
  }
}

// Permission-based authorization
export function requirePermission(requiredPermissions: string[]) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const user = requireAuth(req, res)
    if (!user) return null // Auth already handled response
    
    const hasPermission = requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    )
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        required: requiredPermissions,
        current: user.permissions
      })
      return null
    }
    
    if (next) {
      next()
    }
    
    return user
  }
}

// Combined validation and authentication
export async function withAuthAndValidation<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  schema: any,
  handler: (validatedData: T, user: AuthenticatedUser) => Promise<any>,
  options: {
    requireRole?: string[]
    requirePermissions?: string[]
  } = {}
) {
  // First authenticate
  let user: AuthenticatedUser | null = null
  
  if (options.requireRole) {
    user = requireRole(options.requireRole)(req, res)
  } else if (options.requirePermissions) {
    user = requirePermission(options.requirePermissions)(req, res)
  } else {
    user = requireAuth(req, res)
  }
  
  if (!user) return // Response already sent
  
  // Then validate input
  try {
    const validatedData = schema.parse(req.body)
    
    // Execute handler with both validated data and user
    const result = await handler(validatedData, user)
    
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    } else {
      console.error('Handler error:', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}

// Tenant isolation middleware
export function requireTenantAccess(resourceTenantId: string) {
  return (req: NextApiRequest, res: NextApiResponse, next?: () => void) => {
    const user = requireAuth(req, res)
    if (!user) return null // Auth already handled response
    
    // Admin users can access any tenant
    if (user.role === 'admin') {
      if (next) next()
      return user
    }
    
    // Regular users can only access their own tenant
    if (user.tenantId !== resourceTenantId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this resource',
        code: 'AUTH_TENANT_MISMATCH'
      })
      return null
    }
    
    if (next) {
      next()
    }
    
    return user
  }
}

// Generate JWT token (for login endpoints)
export function generateToken(user: Omit<AuthenticatedUser, 'permissions'> & { permissions?: string[] }): string {
  const payload = {
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
    permissions: user.permissions || []
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'motomind-api'
  })
}

// Verify and refresh token
export function refreshToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Generate new token with extended expiry
    return generateToken({
      id: decoded.id,
      email: decoded.email,
      tenantId: decoded.tenantId,
      role: decoded.role,
      permissions: decoded.permissions
    })
  } catch (error) {
    return null
  }
}

// Common permission sets
export const PERMISSIONS = {
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_WRITE: 'vehicle:write',
  VEHICLE_DELETE: 'vehicle:delete',
  GARAGE_READ: 'garage:read',
  GARAGE_WRITE: 'garage:write',
  GARAGE_DELETE: 'garage:delete',
  ADMIN_ACCESS: 'admin:access',
  DEMO_ACCESS: 'demo:access'
} as const

// Common role sets
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const
