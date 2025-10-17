// Dashboard Snapshot Rate Limiter
// Allows multiple attempts for retakes while preventing abuse

interface RateLimitWindow {
  attempts: number
  windowStart: number
  lastSuccess?: number
}

const rateLimitCache = new Map<string, RateLimitWindow>()

export function checkDashboardRateLimit(vehicleId: string, tenantId: string): {
  allowed: boolean
  reason?: string
  attemptsRemaining?: number
} {
  const key = `${tenantId}:${vehicleId}`
  const now = Date.now()
  const windowDuration = 5 * 60 * 1000 // 5 minutes
  const maxAttempts = 5 // Allow 5 attempts per 5-minute window
  const successCooldown = 2 * 60 * 1000 // 2 minutes between successful snapshots
  
  let window = rateLimitCache.get(key)
  
  // Initialize or reset window if expired
  if (!window || (now - window.windowStart) > windowDuration) {
    window = {
      attempts: 0,
      windowStart: now
    }
    rateLimitCache.set(key, window)
  }
  
  // Check success cooldown (prevent spam of successful snapshots)
  if (window.lastSuccess && (now - window.lastSuccess) < successCooldown) {
    return {
      allowed: false,
      reason: 'Please wait 2 minutes between successful snapshots'
    }
  }
  
  // Check attempt limit
  if (window.attempts >= maxAttempts) {
    const timeRemaining = Math.ceil((windowDuration - (now - window.windowStart)) / 1000 / 60)
    return {
      allowed: false,
      reason: `Too many attempts. Try again in ${timeRemaining} minutes`
    }
  }
  
  return {
    allowed: true,
    attemptsRemaining: maxAttempts - window.attempts - 1
  }
}

export function recordDashboardAttempt(vehicleId: string, tenantId: string, success: boolean) {
  const key = `${tenantId}:${vehicleId}`
  const now = Date.now()
  
  let window = rateLimitCache.get(key)
  if (!window) {
    window = {
      attempts: 0,
      windowStart: now
    }
  }
  
  window.attempts++
  
  if (success) {
    window.lastSuccess = now
  }
  
  rateLimitCache.set(key, window)
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  const windowDuration = 5 * 60 * 1000
  
  rateLimitCache.forEach((window, key) => {
    if ((now - window.windowStart) > windowDuration * 2) {
      rateLimitCache.delete(key)
    }
  })
}, 10 * 60 * 1000) // Cleanup every 10 minutes
