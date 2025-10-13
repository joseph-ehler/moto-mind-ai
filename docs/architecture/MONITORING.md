# 📊 MotoMind Monitoring & Logging

**Status:** ✅ Implemented (Phase 1B)  
**Purpose:** Complete observability for production debugging and optimization

---

## 📖 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Error Logging](#error-logging)
3. [Performance Metrics](#performance-metrics)
4. [Feature Analytics](#feature-analytics)
5. [Usage](#usage)
6. [Integration](#integration)
7. [Best Practices](#best-practices)

---

## 🎯 **OVERVIEW**

MotoMind's monitoring system provides:
- ✅ **Error tracking** - Catch and log errors with context
- ✅ **Performance metrics** - Track page load, API latency, Core Web Vitals
- ✅ **Feature analytics** - Monitor feature adoption and A/B tests
- ✅ **User tracking** - Privacy-safe user journey tracking
- ✅ **Integration ready** - Sentry, LogRocket, Datadog, etc.

---

## 🚨 **ERROR LOGGING**

**File:** `lib/monitoring/logger.ts`

### **Features:**

- Structured JSON logging
- Error tracking with context
- Privacy-safe user tracking
- Session tracking
- Integration ready (Sentry, LogRocket)

### **Usage:**

```typescript
import { logger } from '@/lib/monitoring/logger'

// Info log
logger.info('User logged in', {
  component: 'auth',
  action: 'login'
})

// Error log
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', error as Error, {
    component: 'my-component',
    action: 'risky_operation',
    userId: user.id
  })
}

// Track user actions
logger.trackAction('photo_captured', {
  vehicleId,
  eventType: 'fuel'
})

// Track page views
logger.trackPageView('/timeline', {
  vehicleId
})

// Track API calls
logger.trackAPICall('/api/events', 'POST', 250, 201)
```

### **Log Levels:**

```typescript
logger.debug('Debug info')        // Development only
logger.info('Info message')       // Informational
logger.warn('Warning')            // Warning
logger.error('Error', error)      // Error
logger.fatal('Critical', error)   // System failure
```

### **Set User Context:**

```typescript
// After login
logger.setUserId(user.id)

// After logout
logger.clearUserId()
```

### **React Error Boundary:**

```typescript
import { logErrorBoundary } from '@/lib/monitoring/logger'

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logErrorBoundary(error, errorInfo)
  }
}
```

---

## ⚡ **PERFORMANCE METRICS**

**File:** `lib/monitoring/metrics.ts`

### **Features:**

- Page load times
- Core Web Vitals (LCP, FID, CLS)
- API latency tracking
- Component render times
- Cache hit rates
- Memory usage
- Custom metrics

### **Usage:**

```typescript
import { metrics } from '@/lib/monitoring/metrics'

// Track API latency
metrics.trackAPILatency('/api/events', 250, 200)

// Track component render
metrics.trackComponentRender('Timeline', 150)

// Track cache performance
metrics.trackCacheHit('images')
metrics.trackCacheMiss('api')
metrics.trackCacheSize('images', 15728640)

// Track offline queue
metrics.trackQueueSize('photos', 5)
metrics.trackSyncSuccess('photos', 3)
metrics.trackSyncFailure('events', 'Network error')

// Time a function
const result = await metrics.timeFunction(
  'loadVehicleData',
  async () => await fetchVehicleData(vehicleId),
  { vehicleId }
)

// Record custom metric
metrics.record('custom_metric', 42, 'count', { tag: 'value' })
```

### **React Hooks:**

```typescript
import { usePerformanceTracking, useAPITracking } from '@/lib/monitoring/metrics'

// Track component performance
function MyComponent() {
  usePerformanceTracking('MyComponent')
  
  return <div>Content</div>
}

// Track API calls
function useVehicleData(vehicleId: string) {
  const { trackCall, trackError } = useAPITracking()
  
  const fetchData = async () => {
    const start = performance.now()
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`)
      const duration = performance.now() - start
      trackCall('/api/vehicles', duration, response.status)
      return response.json()
    } catch (error) {
      trackError('/api/vehicles', error.message)
      throw error
    }
  }
}
```

### **Auto-Tracked Metrics:**

Automatically tracked on load:
- ✅ Page load time
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ Memory usage (every 30s)

---

## 📈 **FEATURE ANALYTICS**

**File:** `lib/monitoring/feature-analytics.ts`

### **Features:**

- Feature usage tracking
- Adoption rate monitoring
- A/B test tracking
- Conversion tracking
- Feature engagement

### **Usage:**

```typescript
import { featureAnalytics } from '@/lib/monitoring/feature-analytics'

// Track feature enabled
featureAnalytics.trackFeatureEnabled('analyticsEngine', userId, 'treatment')

// Track feature used
featureAnalytics.trackFeatureUsed('analyticsEngine', userId, {
  page: 'dashboard',
  action: 'viewed_chart'
})

// Track feature disabled
featureAnalytics.trackFeatureDisabled('analyticsEngine', userId)

// Track conversion (A/B test)
featureAnalytics.trackFeatureConversion('newPricingPage', userId, 'treatment', 99.00)

// Get usage stats
const stats = featureAnalytics.getUsageStats('analyticsEngine')
// {
//   enabled: 100,
//   used: 75,
//   disabled: 10,
//   converted: 20,
//   adoptionRate: 75%,
//   conversionRate: 26.7%
// }

// Get A/B test stats
const abStats = featureAnalytics.getABTestStats('newPricingPage')
// {
//   control: { total: 50, conversions: 10, conversionRate: 20% },
//   treatment: { total: 50, conversions: 15, conversionRate: 30% }
// }
```

### **React Hook:**

```typescript
import { useFeatureTracking } from '@/lib/monitoring/feature-analytics'

function AnalyticsDashboard() {
  const hasAnalytics = useFeature('analyticsEngine')
  const variant = useFeatureVariant('analyticsEngine')
  const { trackUsed, trackConversion } = useFeatureTracking(
    'analyticsEngine',
    hasAnalytics,
    variant
  )
  
  useEffect(() => {
    if (hasAnalytics) {
      trackUsed({ page: 'dashboard' })
    }
  }, [hasAnalytics])
  
  const handleUpgrade = () => {
    trackConversion(99.00)
    // ... upgrade logic
  }
  
  return <div>Dashboard</div>
}
```

---

## 💻 **USAGE EXAMPLES**

### **Example 1: Track Photo Capture**

```typescript
import { logger } from '@/lib/monitoring/logger'
import { metrics } from '@/lib/monitoring/metrics'

async function capturePhoto() {
  const start = performance.now()
  
  try {
    const photo = await camera.capture()
    const duration = performance.now() - start
    
    // Log success
    logger.info('Photo captured', {
      component: 'camera',
      action: 'capture_photo',
      duration
    })
    
    // Track performance
    metrics.record('photo_capture_time', duration, 'ms')
    
    return photo
  } catch (error) {
    // Log error with context
    logger.error('Photo capture failed', error as Error, {
      component: 'camera',
      action: 'capture_photo'
    })
    
    throw error
  }
}
```

### **Example 2: Track API Call**

```typescript
import { logger } from '@/lib/monitoring/logger'
import { metrics } from '@/lib/monitoring/metrics'

async function createEvent(data: EventData) {
  const start = performance.now()
  
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    const duration = performance.now() - start
    
    // Track API performance
    metrics.trackAPILatency('/api/events', duration, response.status)
    logger.trackAPICall('/api/events', 'POST', duration, response.status)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    return response.json()
  } catch (error) {
    // Track API error
    metrics.trackAPIError('/api/events', (error as Error).message)
    logger.error('Event creation failed', error as Error, {
      component: 'events',
      action: 'create_event'
    })
    
    throw error
  }
}
```

### **Example 3: Track Offline Sync**

```typescript
import { logger } from '@/lib/monitoring/logger'
import { metrics } from '@/lib/monitoring/metrics'
import { offlineQueue } from '@/lib/memory/offline-queue'

async function syncOfflineData() {
  const stats = await offlineQueue.getStats()
  
  // Track queue size
  metrics.trackQueueSize('photos', stats.photos)
  metrics.trackQueueSize('events', stats.events)
  
  logger.info('Starting sync', {
    component: 'offline_queue',
    action: 'sync_start',
    photos: stats.photos,
    events: stats.events
  })
  
  try {
    const result = await offlineQueue.syncNow()
    
    // Track success
    metrics.trackSyncSuccess('photos', result.photos)
    metrics.trackSyncSuccess('events', result.events)
    
    logger.info('Sync complete', {
      component: 'offline_queue',
      action: 'sync_complete',
      photos: result.photos,
      events: result.events,
      errors: result.errors.length
    })
  } catch (error) {
    // Track failure
    metrics.trackSyncFailure('photos', (error as Error).message)
    logger.error('Sync failed', error as Error, {
      component: 'offline_queue',
      action: 'sync_failed'
    })
  }
}
```

---

## 🔌 **INTEGRATION**

### **Backend API Routes**

**Logs:** `app/api/logs/route.ts`
```typescript
// Receives logs from client
POST /api/logs
```

**Metrics:** `app/api/metrics/route.ts`
```typescript
// Receives metrics from client
POST /api/metrics
```

### **Sentry Integration**

```typescript
// lib/monitoring/logger.ts
import * as Sentry from '@sentry/nextjs'

// In sendLog()
if (entry.error) {
  Sentry.captureException(new Error(entry.error.message), {
    contexts: { log: entry.context },
    level: entry.level
  })
}
```

### **LogRocket Integration**

```typescript
// lib/monitoring/logger.ts
import LogRocket from 'logrocket'

// Initialize
LogRocket.init('your-app-id')

// In sendLog()
LogRocket.log(entry.level, entry.message, entry.context)

// Identify user
logger.setUserId = (userId) => {
  LogRocket.identify(userId)
}
```

### **Datadog Integration**

```typescript
// lib/monitoring/metrics.ts
import { datadogLogs } from '@datadog/browser-logs'
import { datadogRum } from '@datadog/browser-rum'

// Initialize
datadogLogs.init({
  clientToken: 'your-token',
  site: 'datadoghq.com',
  forwardErrorsToLogs: true
})

datadogRum.init({
  applicationId: 'your-app-id',
  clientToken: 'your-token',
  site: 'datadoghq.com',
  trackInteractions: true
})
```

---

## 📋 **BEST PRACTICES**

### **✅ DO:**

1. **Log with context**
   ```typescript
   // ✅ Good
   logger.error('Failed to save', error, {
     component: 'events',
     action: 'save_event',
     vehicleId,
     eventType
   })
   
   // ❌ Bad
   logger.error('Failed')
   ```

2. **Track key metrics**
   ```typescript
   // Track user journeys
   logger.trackAction('user_upgraded', { tier: 'pro' })
   
   // Track performance
   metrics.trackAPILatency('/api/events', duration, status)
   
   // Track features
   featureAnalytics.trackFeatureUsed('analyticsEngine')
   ```

3. **Use structured logging**
   ```typescript
   // ✅ JSON structured
   logger.info('Event created', {
     eventId,
     vehicleId,
     type: 'fuel',
     amount: 50.00
   })
   
   // ❌ Unstructured string
   logger.info(`Created event ${eventId} for ${vehicleId}`)
   ```

4. **Track errors with stack traces**
   ```typescript
   try {
     await operation()
   } catch (error) {
     // Pass error object, not string
     logger.error('Operation failed', error as Error, context)
   }
   ```

### **❌ DON'T:**

1. **Don't log sensitive data**
   ```typescript
   // ❌ Bad
   logger.info('User data', { password, ssn, creditCard })
   
   // ✅ Good
   logger.info('User updated', { userId })
   ```

2. **Don't log in hot loops**
   ```typescript
   // ❌ Bad
   array.forEach(item => {
     logger.debug('Processing item', { item })
   })
   
   // ✅ Good
   logger.debug('Processing items', { count: array.length })
   ```

3. **Don't ignore errors**
   ```typescript
   // ❌ Bad
   try {
     await operation()
   } catch (error) {
     // Silent failure
   }
   
   // ✅ Good
   try {
     await operation()
   } catch (error) {
     logger.error('Operation failed', error as Error)
     throw error // Re-throw if needed
   }
   ```

---

## 📊 **MONITORING DASHBOARD**

### **Key Metrics to Watch:**

**Error Rate:**
- Errors per minute
- Error types distribution
- Most common errors

**Performance:**
- Page load time (< 3s)
- LCP (< 2.5s)
- FID (< 100ms)
- CLS (< 0.1)
- API latency (< 500ms)

**Feature Adoption:**
- Feature usage count
- Adoption rate (%)
- Time to first use
- Conversion rate (A/B tests)

**Offline Queue:**
- Queue size
- Sync success rate
- Sync failures
- Average sync time

**Memory:**
- Heap usage
- Memory leaks
- Cache sizes

---

## 🎯 **ALERTS**

### **Critical Alerts:**

- Error rate > 5% (5 min window)
- API latency > 2s (p95)
- Page load time > 5s (p95)
- Sync failure rate > 20%
- Memory usage > 80%

### **Warning Alerts:**

- Error rate > 2% (15 min window)
- API latency > 1s (p95)
- Cache miss rate > 50%
- Feature adoption < 10% (after 1 week)

---

## 📝 **CHECKLIST**

### **Development:**
- [ ] Logs include context
- [ ] Errors are tracked
- [ ] Performance is measured
- [ ] Features are tracked

### **Production:**
- [ ] Logging service configured
- [ ] Metrics service configured
- [ ] Alerts configured
- [ ] Dashboard created
- [ ] Error tracking active

---

## 📚 **RESOURCES**

- [Sentry Documentation](https://docs.sentry.io/)
- [LogRocket Documentation](https://docs.logrocket.com/)
- [Datadog Documentation](https://docs.datadoghq.com/)
- [Web Vitals](https://web.dev/vitals/)

---

**Status:** ✅ Monitoring & Logging Complete  
**Next:** Phase 1C (PWA Polish & Production Deployment)
