// Backend Usage Tracker
// API usage monitoring and rate limiting

export interface UsageMetrics {
  endpoint: string
  method: string
  count: number
  avgResponseTime: number
  errorRate: number
  lastAccessed: string
}

export interface UsageStats {
  totalRequests: number
  uniqueEndpoints: number
  avgResponseTime: number
  errorRate: number
  topEndpoints: UsageMetrics[]
  timeRange: string
}

// In-memory usage tracking (replace with database in production)
const usageData = new Map<string, UsageMetrics>()

export function trackApiUsage(
  endpoint: string,
  method: string,
  responseTime: number,
  isError: boolean = false
) {
  const key = `${method}:${endpoint}`
  const existing = usageData.get(key)
  
  if (existing) {
    const totalRequests = existing.count + 1
    const totalResponseTime = (existing.avgResponseTime * existing.count) + responseTime
    const totalErrors = (existing.errorRate * existing.count) + (isError ? 1 : 0)
    
    usageData.set(key, {
      endpoint,
      method,
      count: totalRequests,
      avgResponseTime: totalResponseTime / totalRequests,
      errorRate: totalErrors / totalRequests,
      lastAccessed: new Date().toISOString()
    })
  } else {
    usageData.set(key, {
      endpoint,
      method,
      count: 1,
      avgResponseTime: responseTime,
      errorRate: isError ? 1 : 0,
      lastAccessed: new Date().toISOString()
    })
  }
}

export function getUsageStats(timeRange: string = '24h'): UsageStats {
  const metrics = Array.from(usageData.values())
  
  const totalRequests = metrics.reduce((sum, m) => sum + m.count, 0)
  const totalResponseTime = metrics.reduce((sum, m) => sum + (m.avgResponseTime * m.count), 0)
  const totalErrors = metrics.reduce((sum, m) => sum + (m.errorRate * m.count), 0)
  
  return {
    totalRequests,
    uniqueEndpoints: metrics.length,
    avgResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
    errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    topEndpoints: metrics
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    timeRange
  }
}

export function getEndpointMetrics(endpoint: string, method: string): UsageMetrics | null {
  const key = `${method}:${endpoint}`
  return usageData.get(key) || null
}

export function resetUsageStats() {
  usageData.clear()
}

// Rate limiting (simple implementation)
const rateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const existing = rateLimits.get(identifier)
  
  if (!existing || now > existing.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }
  
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime }
  }
  
  existing.count++
  return { allowed: true, remaining: limit - existing.count, resetTime: existing.resetTime }
}

// Usage tracker instance (for metrics endpoint compatibility)
export const usageTracker = {
  getBatchStatus() {
    return {
      batchSize: usageData.size,
      pendingCount: 0,
      lastFlush: new Date().toISOString()
    }
  },
  
  getStats() {
    return getUsageStats()
  }
}
