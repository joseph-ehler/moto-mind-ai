/**
 * JWT Verification Logic
 * 
 * Verifies Supabase JWT tokens and extracts user information.
 * Integrates with Supabase Auth for session validation.
 * 
 * @module lib/middleware/auth/jwt
 */

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { AuthUser, AuthResult } from './types'
import {
  createMissingTokenError,
  createInvalidTokenError,
  createExpiredTokenError,
  createInternalError,
} from './errors'

// ============================================================================
// Constants
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ============================================================================
// Token Extraction
// ============================================================================

/**
 * Extract Bearer token from Authorization header
 * 
 * @param request - NextRequest
 * @returns Token string or null
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }
  
  // Support both formats:
  // - Authorization: Bearer <token>
  // - Authorization: <token>
  const parts = authHeader.split(' ')
  
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1]
  }
  
  if (parts.length === 1) {
    return parts[0]
  }
  
  return null
}

// ============================================================================
// JWT Verification
// ============================================================================

/**
 * Verify Supabase JWT token and extract user information
 * 
 * @param token - JWT token string
 * @returns AuthResult with user info or error
 */
export async function verifyToken(token: string): Promise<AuthResult<AuthUser>> {
  try {
    // Create Supabase client with service role key for verification
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    // Verify token by getting the user
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      // Check if token is expired
      if (error.message.includes('expired') || error.message.includes('exp')) {
        // Try to extract exp from token (JWT is base64 encoded)
        const expiredAt = extractExpFromToken(token)
        return {
          ok: false,
          error: createExpiredTokenError(expiredAt),
        }
      }
      
      return {
        ok: false,
        error: createInvalidTokenError(error.message),
      }
    }
    
    if (!user) {
      return {
        ok: false,
        error: createInvalidTokenError('No user found in token'),
      }
    }
    
    // Extract user information
    const authUser: AuthUser = {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
      sessionId: user.app_metadata?.session_id,
    }
    
    return {
      ok: true,
      value: authUser,
    }
    
  } catch (error) {
    console.error('[JWT] Verification error:', error)
    return {
      ok: false,
      error: createInternalError(error),
    }
  }
}

/**
 * Extract expiration timestamp from JWT token
 * (without full verification - just for error messages)
 * 
 * @param token - JWT token
 * @returns Expiration timestamp or current time
 */
function extractExpFromToken(token: string): number {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return Date.now()
    }
    
    // Decode payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )
    
    return payload.exp ? payload.exp * 1000 : Date.now()
  } catch {
    return Date.now()
  }
}

// ============================================================================
// Token Validation (Lightweight)
// ============================================================================

/**
 * Quick validation of token format (before full verification)
 * Useful for early rejection of obviously invalid tokens
 * 
 * @param token - Token string
 * @returns true if format is valid
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }
  
  // Each part should be base64url encoded
  const base64urlPattern = /^[A-Za-z0-9_-]+$/
  return parts.every(part => base64urlPattern.test(part))
}

// ============================================================================
// Service Role Detection
// ============================================================================

/**
 * Check if request is using service role key
 * Service role bypasses RLS and has unrestricted access
 * 
 * @param request - NextRequest
 * @returns true if service role
 */
export function isServiceRoleRequest(request: NextRequest): boolean {
  const apiKey = request.headers.get('apikey') || 
                 request.headers.get('x-api-key')
  
  if (!apiKey) {
    return false
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return apiKey === serviceRoleKey
}

// ============================================================================
// Request Authentication
// ============================================================================

/**
 * Complete request authentication pipeline
 * Extracts token, verifies it, returns user info
 * 
 * @param request - NextRequest
 * @returns AuthResult with user or error
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult<{ user: AuthUser; token: string }>> {
  // Check for service role (bypass normal auth)
  if (isServiceRoleRequest(request)) {
    // Return a service role "user"
    return {
      ok: true,
      value: {
        user: {
          id: 'service-role',
          email: 'service@system',
          role: 'service_role',
        },
        token: 'service-role-key',
      },
    }
  }
  
  // Extract token from Authorization header
  const token = extractToken(request)
  
  if (!token) {
    return {
      ok: false,
      error: createMissingTokenError(),
    }
  }
  
  // Quick format validation
  if (!isValidTokenFormat(token)) {
    return {
      ok: false,
      error: createInvalidTokenError('Malformed token format'),
    }
  }
  
  // Verify token with Supabase
  const userResult = await verifyToken(token)
  
  if (!userResult.ok) {
    return userResult
  }
  
  return {
    ok: true,
    value: {
      user: userResult.value,
      token,
    },
  }
}
