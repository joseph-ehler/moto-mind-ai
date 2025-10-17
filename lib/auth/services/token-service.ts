/**
 * Token Service
 * 
 * Manages verification tokens using NextAuth's verification_tokens table
 * Supports: Email verification, Password reset, Magic links
 * 
 * @module lib/auth/services/token-service
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { randomBytes } from 'crypto'

const supabase = getSupabaseClient()

export type TokenType = 'email-verification' | 'password-reset' | 'magic-link'

interface TokenResult {
  success: boolean
  token?: string
  error?: string
}

interface VerifyResult {
  success: boolean
  identifier?: string
  error?: string
}

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a verification token
 * 
 * @param identifier - Email address
 * @param expiresInMinutes - Token expiration time (default: 60 minutes)
 * @returns Token string or error
 */
export async function createVerificationToken(
  identifier: string,
  expiresInMinutes: number = 60
): Promise<TokenResult> {
  try {
    const token = generateToken()
    const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000)

    const { error } = await supabase
      .from('verification_tokens')
      .insert({
        identifier,
        token,
        expires: expires.toISOString()
      })

    if (error) {
      console.error('[Token] Create failed:', error)
      return { success: false, error: 'Failed to create token' }
    }

    console.log(`[Token] Created for ${identifier}, expires in ${expiresInMinutes}min`)
    return { success: true, token }

  } catch (error) {
    console.error('[Token] Create error:', error)
    return { success: false, error: 'Token creation failed' }
  }
}

/**
 * Verify and consume a token
 * 
 * @param token - Token string to verify
 * @returns Identifier (email) if valid, error otherwise
 */
export async function verifyAndConsumeToken(token: string): Promise<VerifyResult> {
  try {
    // Find token and check expiration
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('identifier, expires')
      .eq('token', token)
      .single()

    if (error || !data) {
      console.error('[Token] Not found:', token.substring(0, 8))
      return { success: false, error: 'Invalid or expired token' }
    }

    // Check if expired
    if (new Date(data.expires) < new Date()) {
      console.error('[Token] Expired:', data.identifier)
      
      // Delete expired token
      await supabase
        .from('verification_tokens')
        .delete()
        .eq('token', token)

      return { success: false, error: 'Token has expired' }
    }

    // Token is valid - consume it (delete so it can't be reused)
    const { error: deleteError } = await supabase
      .from('verification_tokens')
      .delete()
      .eq('token', token)

    if (deleteError) {
      console.error('[Token] Delete failed:', deleteError)
      return { success: false, error: 'Token validation failed' }
    }

    console.log(`[Token] Verified and consumed for ${data.identifier}`)
    return { success: true, identifier: data.identifier }

  } catch (error) {
    console.error('[Token] Verify error:', error)
    return { success: false, error: 'Token verification failed' }
  }
}

/**
 * Check if a token exists and is valid (without consuming it)
 * 
 * @param token - Token string to check
 * @returns true if valid, false otherwise
 */
export async function isTokenValid(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('verification_tokens')
      .select('expires')
      .eq('token', token)
      .single()

    if (error || !data) return false

    return new Date(data.expires) > new Date()
  } catch (error) {
    console.error('[Token] Check error:', error)
    return false
  }
}

/**
 * Delete all tokens for an identifier
 * 
 * @param identifier - Email address
 */
export async function deleteTokensForIdentifier(identifier: string): Promise<void> {
  try {
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('identifier', identifier)

    console.log(`[Token] Deleted all tokens for ${identifier}`)
  } catch (error) {
    console.error('[Token] Delete error:', error)
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('verification_tokens')
      .delete()
      .lt('expires', new Date().toISOString())
      .select('token')

    if (error) {
      console.error('[Token] Cleanup failed:', error)
      return 0
    }

    const count = data?.length || 0
    console.log(`[Token] Cleaned up ${count} expired tokens`)
    return count

  } catch (error) {
    console.error('[Token] Cleanup error:', error)
    return 0
  }
}
