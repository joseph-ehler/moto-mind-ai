/**
 * Risk Scoring Service
 * 
 * Tracks auth attempts and calculates risk scores for progressive CAPTCHA challenges
 */

import { getSupabaseClient } from '../supabase'

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'blocked'
  captchaRequired: boolean
  blockedUntil: Date | null
  message?: string
}

export interface RecordAttemptParams {
  ipAddress: string
  identifier: string
  success: boolean
  captchaToken?: string
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback (won't work in production behind proxy)
  return 'unknown'
}

/**
 * Check if IP/identifier is currently blocked
 */
export async function isBlocked(
  ipAddress: string,
  identifier?: string
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase.rpc('is_auth_blocked', {
      p_ip_address: ipAddress,
      p_identifier: identifier || null,
    })
    
    if (error) {
      console.error('[Risk Scoring] Block check failed:', error)
      return false // Fail open
    }
    
    return data as boolean
  } catch (err) {
    console.error('[Risk Scoring] Block check exception:', err)
    return false
  }
}

/**
 * Record auth attempt and get updated risk assessment
 */
export async function recordAuthAttempt({
  ipAddress,
  identifier,
  success,
  captchaToken,
}: RecordAttemptParams): Promise<RiskAssessment> {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase.rpc('record_auth_attempt', {
      p_ip_address: ipAddress,
      p_identifier: identifier,
      p_success: success,
      p_captcha_token: captchaToken || null,
    })
    
    if (error) {
      console.error('[Risk Scoring] Record attempt failed:', error)
      // Return safe default
      return {
        riskLevel: 'low',
        captchaRequired: false,
        blockedUntil: null,
      }
    }
    
    // Parse result from RPC function
    const result = data[0] as {
      risk_level: string
      captcha_required: boolean
      blocked_until: string | null
    }
    
    return {
      riskLevel: result.risk_level as RiskAssessment['riskLevel'],
      captchaRequired: result.captcha_required,
      blockedUntil: result.blocked_until ? new Date(result.blocked_until) : null,
      message: result.blocked_until
        ? `Too many failed attempts. Try again after ${new Date(result.blocked_until).toLocaleTimeString()}`
        : undefined,
    }
  } catch (err) {
    console.error('[Risk Scoring] Record attempt exception:', err)
    return {
      riskLevel: 'low',
      captchaRequired: false,
      blockedUntil: null,
    }
  }
}

/**
 * Get current risk assessment without recording attempt
 */
export async function getRiskAssessment(
  ipAddress: string,
  identifier: string
): Promise<RiskAssessment> {
  const supabase = getSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('auth_risk_scores')
      .select('risk_level, captcha_required, blocked_until')
      .eq('ip_address', ipAddress)
      .eq('identifier', identifier)
      .order('last_attempt_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      // No history = low risk
      return {
        riskLevel: 'low',
        captchaRequired: false,
        blockedUntil: null,
      }
    }
    
    return {
      riskLevel: data.risk_level as RiskAssessment['riskLevel'],
      captchaRequired: data.captcha_required,
      blockedUntil: data.blocked_until ? new Date(data.blocked_until) : null,
    }
  } catch (err) {
    console.error('[Risk Scoring] Get assessment exception:', err)
    return {
      riskLevel: 'low',
      captchaRequired: false,
      blockedUntil: null,
    }
  }
}

/**
 * Verify CAPTCHA token (Cloudflare Turnstile)
 */
export async function verifyCaptchaToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  
  if (!secretKey) {
    console.warn('[CAPTCHA] TURNSTILE_SECRET_KEY not configured, skipping verification')
    return true // Fail open in development
  }
  
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    })
    
    const result = await response.json()
    
    if (!result.success) {
      console.warn('[CAPTCHA] Verification failed:', result['error-codes'])
      return false
    }
    
    console.log('[CAPTCHA] Verification successful')
    return true
  } catch (err) {
    console.error('[CAPTCHA] Verification exception:', err)
    return false
  }
}

/**
 * Check if request should proceed based on risk assessment
 */
export async function shouldAllowRequest(
  ipAddress: string,
  identifier: string,
  captchaToken?: string
): Promise<{
  allowed: boolean
  reason?: string
  captchaRequired: boolean
  riskLevel: RiskAssessment['riskLevel']
}> {
  // Check if blocked
  const blocked = await isBlocked(ipAddress, identifier)
  if (blocked) {
    return {
      allowed: false,
      reason: 'Too many failed attempts. Please try again later.',
      captchaRequired: false,
      riskLevel: 'blocked',
    }
  }
  
  // Get current risk assessment
  const risk = await getRiskAssessment(ipAddress, identifier)
  
  // If CAPTCHA required and provided, verify it
  if (risk.captchaRequired && captchaToken) {
    const valid = await verifyCaptchaToken(captchaToken)
    if (!valid) {
      return {
        allowed: false,
        reason: 'CAPTCHA verification failed. Please try again.',
        captchaRequired: true,
        riskLevel: risk.riskLevel,
      }
    }
  }
  
  // If CAPTCHA required but not provided
  if (risk.captchaRequired && !captchaToken) {
    return {
      allowed: false,
      reason: 'CAPTCHA verification required.',
      captchaRequired: true,
      riskLevel: risk.riskLevel,
    }
  }
  
  // All checks passed
  return {
    allowed: true,
    captchaRequired: false,
    riskLevel: risk.riskLevel,
  }
}
