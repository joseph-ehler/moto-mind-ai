/**
 * Session Tracking Service
 * 
 * Tracks user sessions with:
 * - Device information (browser, OS, device type)
 * - IP address and location
 * - Last active timestamp
 * - Session management
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { parseUserAgent, type DeviceInfo } from '../utils/device-parser'
import { getLocationFromIP, type LocationInfo } from '../utils/geo-location'

const supabase = getSupabaseClient()

export interface SessionData {
  id: string
  userId: string
  deviceId: string
  deviceInfo: DeviceInfo
  ipAddress: string
  location: LocationInfo | null
  lastActive: Date
  createdAt: Date
  isCurrent?: boolean
}

/**
 * Generate a unique device ID using Web Crypto API (edge-compatible)
 */
function generateDeviceId(): string {
  // Use crypto.randomUUID() which works in both Node and Edge runtime
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: generate from timestamp + random
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Create or update session
 */
export async function trackSession(
  userId: string,
  userAgent: string,
  ipAddress: string,
  deviceId?: string
): Promise<{ sessionId: string; deviceId: string }> {
  try {
    // Parse device info
    const deviceInfo = parseUserAgent(userAgent)

    // Get location (async, don't wait)
    let location: LocationInfo | null = null
    try {
      location = await getLocationFromIP(ipAddress)
    } catch (error) {
      console.warn('[SESSION] Failed to get location:', error)
    }

    // Generate device ID if not provided
    const finalDeviceId = deviceId || generateDeviceId()

    // Check if session exists (get most recent if multiple exist)
    const { data: existingSessions } = await supabase
      .from('sessions')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('device_id', finalDeviceId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingSessions && existingSessions.length > 0) {
      const existingSession = existingSessions[0]
      
      // Update existing session
      await supabase
        .from('sessions')
        .update({
          last_active: new Date().toISOString(),
          ip_address: ipAddress,
          location_country: location?.country,
          location_city: location?.city,
          location_flag: location?.flag
        })
        .eq('id', existingSession.id)

      console.log(`[SESSION] ♻️  Updated existing session for ${userId}`)

      return {
        sessionId: existingSession.id,
        deviceId: finalDeviceId
      }
    }

    // Create new session
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        device_id: finalDeviceId,
        device_type: deviceInfo.deviceType,
        device_name: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        os: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        ip_address: ipAddress,
        location_country: location?.country,
        location_city: location?.city,
        location_flag: location?.flag,
        last_active: new Date().toISOString(),
        created_at: new Date().toISOString(),
        // NextAuth columns (set to NULL for device tracking sessions)
        session_token: null,
        expires: null,
        session_type: 'device'
      })
      .select('id')
      .single()

    if (error || !newSession) {
      // Log the error but DON'T throw - session tracking should never break login
      console.error('[SESSION] Failed to create session:', error)
      console.error('[SESSION] This is non-critical - user can still use the app')
      
      // Return a fallback session ID
      return {
        sessionId: 'fallback-' + Date.now(),
        deviceId: finalDeviceId
      }
    }

    console.log(`[SESSION] ✅ Tracked session for user ${userId} from ${location?.city || 'Unknown'}`)

    return {
      sessionId: newSession.id,
      deviceId: finalDeviceId
    }

  } catch (error) {
    // CRITICAL: Never throw errors from session tracking - it should never break login
    console.error('[SESSION] Track session error:', error)
    console.error('[SESSION] Returning fallback - user can still proceed')
    
    // Return fallback values
    return {
      sessionId: 'error-fallback-' + Date.now(),
      deviceId: deviceId || generateDeviceId()
    }
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active', { ascending: false })

    if (error) {
      console.error('[SESSION] Failed to get sessions:', error)
      return []
    }

    return sessions.map(session => ({
      id: session.id,
      userId: session.user_id,
      deviceId: session.device_id,
      deviceInfo: {
        browser: session.browser || 'Unknown',
        browserVersion: session.browser_version || '',
        os: session.os || 'Unknown',
        osVersion: session.os_version || '',
        deviceType: session.device_type || 'unknown',
        deviceName: session.device_name || 'Unknown Device'
      },
      ipAddress: session.ip_address || '',
      location: session.location_country ? {
        country: session.location_country,
        countryCode: '',
        city: session.location_city || '',
        region: '',
        timezone: '',
        flag: session.location_flag || '🌍'
      } : null,
      lastActive: new Date(session.last_active),
      createdAt: new Date(session.created_at)
    }))

  } catch (error) {
    console.error('[SESSION] Get sessions error:', error)
    return []
  }
}

/**
 * Terminate a specific session
 */
export async function terminateSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      console.error('[SESSION] Failed to terminate session:', error)
      return false
    }

    console.log(`[SESSION] Terminated session ${sessionId}`)
    return true

  } catch (error) {
    console.error('[SESSION] Terminate session error:', error)
    return false
  }
}

/**
 * Terminate all sessions except current device
 */
export async function terminateAllOtherSessions(
  userId: string,
  currentDeviceId: string
): Promise<{ terminated: number }> {
  try {
    const { error, count } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId)
      .neq('device_id', currentDeviceId)

    if (error) {
      console.error('[SESSION] Failed to terminate sessions:', error)
      return { terminated: 0 }
    }

    console.log(`[SESSION] Terminated ${count || 0} sessions for user ${userId}`)
    return { terminated: count || 0 }

  } catch (error) {
    console.error('[SESSION] Terminate all sessions error:', error)
    return { terminated: 0 }
  }
}

/**
 * Update last active timestamp
 */
export async function updateLastActive(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('sessions')
      .update({
        last_active: new Date().toISOString()
      })
      .eq('id', sessionId)

  } catch (error) {
    console.error('[SESSION] Update last active error:', error)
  }
}

/**
 * Clean up old sessions (inactive for > 30 days)
 */
export async function cleanupOldSessions(): Promise<{ deleted: number }> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { error, count } = await supabase
      .from('sessions')
      .delete()
      .lt('last_active', thirtyDaysAgo.toISOString())

    if (error) {
      console.error('[SESSION] Cleanup failed:', error)
      return { deleted: 0 }
    }

    console.log(`[SESSION] Cleaned up ${count || 0} old sessions`)
    return { deleted: count || 0 }

  } catch (error) {
    console.error('[SESSION] Cleanup error:', error)
    return { deleted: 0 }
  }
}

/**
 * Detect suspicious activity
 * (Foundation for future security alerts)
 */
export async function detectSuspiciousActivity(
  userId: string,
  ipAddress: string,
  location: LocationInfo | null
): Promise<{
  suspicious: boolean
  reasons: string[]
}> {
  try {
    // Get recent sessions
    const sessions = await getUserSessions(userId)

    if (sessions.length === 0) {
      return { suspicious: false, reasons: [] }
    }

    const reasons: string[] = []

    // Check for multiple locations in short time
    const recentSessions = sessions.filter(s => {
      const hourAgo = new Date()
      hourAgo.setHours(hourAgo.getHours() - 1)
      return s.lastActive > hourAgo
    })

    if (recentSessions.length > 1 && location) {
      const countries = new Set(recentSessions.map(s => s.location?.country).filter(Boolean))
      if (countries.size > 1) {
        reasons.push('Multiple countries in short time')
      }
    }

    // Check for unusual device count
    if (sessions.length > 5) {
      reasons.push('Unusual number of active sessions')
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    }

  } catch (error) {
    console.error('[SESSION] Detect suspicious activity error:', error)
    return { suspicious: false, reasons: [] }
  }
}
