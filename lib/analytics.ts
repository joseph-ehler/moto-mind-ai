/**
 * Analytics Tracking Utilities
 * 
 * Centralized analytics tracking for user behavior
 * Can be swapped for any analytics provider (PostHog, Mixpanel, GA, etc.)
 */

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
}

class Analytics {
  private isEnabled: boolean

  constructor() {
    // Enable analytics in production only
    this.isEnabled = process.env.NODE_ENV === 'production'
  }

  /**
   * Track an event
   */
  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics]', eventName, properties)
      return
    }

    try {
      // TODO: Replace with actual analytics provider
      // Examples:
      // posthog.capture(eventName, properties)
      // mixpanel.track(eventName, properties)
      // gtag('event', eventName, properties)
      
      console.log('[Analytics]', eventName, properties)
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Identify:', userId, traits)
      return
    }

    try {
      // TODO: Replace with actual analytics provider
      // posthog.identify(userId, traits)
      // mixpanel.identify(userId)
      // mixpanel.people.set(traits)
      
      console.log('[Analytics] Identify:', userId, traits)
    } catch (error) {
      console.error('Analytics identify error:', error)
    }
  }

  /**
   * Track page view
   */
  page(pageName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Page:', pageName, properties)
      return
    }

    try {
      // TODO: Replace with actual analytics provider
      // posthog.capture('$pageview', { ...properties, page: pageName })
      // gtag('config', 'GA_MEASUREMENT_ID', { page_path: pageName })
      
      console.log('[Analytics] Page:', pageName, properties)
    } catch (error) {
      console.error('Analytics page tracking error:', error)
    }
  }
}

// Singleton instance
export const analytics = new Analytics()

// Capture-specific event helpers
export const captureAnalytics = {
  // Modal events
  modalOpened: (vehicleId: string) => {
    analytics.track('Capture Modal Opened', { vehicleId })
  },
  
  modalClosed: (vehicleId: string, reason: 'user_action' | 'escape' | 'backdrop') => {
    analytics.track('Capture Modal Closed', { vehicleId, reason })
  },

  // Path selection
  quickCaptureSelected: (vehicleId: string) => {
    analytics.track('Quick Capture Selected', { 
      vehicleId,
      path: 'quick',
      timestamp: new Date().toISOString()
    })
  },

  guidedCaptureSelected: (vehicleId: string, eventType: string) => {
    analytics.track('Guided Capture Selected', { 
      vehicleId,
      eventType,
      path: 'guided',
      timestamp: new Date().toISOString()
    })
  },

  // Smart features
  suggestionShown: (vehicleId: string, eventType: string, confidence: number) => {
    analytics.track('Suggestion Shown', {
      vehicleId,
      eventType,
      confidence,
      timestamp: new Date().toISOString()
    })
  },

  suggestionUsed: (vehicleId: string, eventType: string, confidence: number) => {
    analytics.track('Suggestion Used', {
      vehicleId,
      eventType,
      confidence,
      timestamp: new Date().toISOString()
    })
  },

  recentTypeUsed: (vehicleId: string, eventType: string, position: number) => {
    analytics.track('Recent Type Used', {
      vehicleId,
      eventType,
      position, // 0-indexed position in recent list
      timestamp: new Date().toISOString()
    })
  },

  // Keyboard shortcuts
  keyboardShortcutUsed: (shortcut: string, action: string) => {
    analytics.track('Keyboard Shortcut Used', {
      shortcut,
      action,
      timestamp: new Date().toISOString()
    })
  },

  // Photo capture
  photoCaptured: (vehicleId: string, eventType: string, stepId: string, method: 'camera' | 'upload') => {
    analytics.track('Photo Captured', {
      vehicleId,
      eventType,
      stepId,
      method,
      timestamp: new Date().toISOString()
    })
  },

  photoRetaken: (vehicleId: string, eventType: string, stepId: string) => {
    analytics.track('Photo Retaken', {
      vehicleId,
      eventType,
      stepId,
      timestamp: new Date().toISOString()
    })
  },

  stepSkipped: (vehicleId: string, eventType: string, stepId: string, required: boolean) => {
    analytics.track('Step Skipped', {
      vehicleId,
      eventType,
      stepId,
      required,
      timestamp: new Date().toISOString()
    })
  },

  // Completion
  eventSaved: (vehicleId: string, eventType: string, photoCount: number, duration: number) => {
    analytics.track('Event Saved', {
      vehicleId,
      eventType,
      photoCount,
      duration, // Time in ms from start to save
      timestamp: new Date().toISOString()
    })
  },

  eventSaveFailed: (vehicleId: string, eventType: string, error: string) => {
    analytics.track('Event Save Failed', {
      vehicleId,
      eventType,
      error,
      timestamp: new Date().toISOString()
    })
  },

  // AI Detection
  aiDetectionSuccess: (vehicleId: string, detectedType: string, confidence: number) => {
    analytics.track('AI Detection Success', {
      vehicleId,
      detectedType,
      confidence,
      timestamp: new Date().toISOString()
    })
  },

  aiDetectionFailed: (vehicleId: string, error: string) => {
    analytics.track('AI Detection Failed', {
      vehicleId,
      error,
      timestamp: new Date().toISOString()
    })
  },

  aiDetectionCorrected: (vehicleId: string, detectedType: string, actualType: string) => {
    analytics.track('AI Detection Corrected', {
      vehicleId,
      detectedType,
      actualType,
      timestamp: new Date().toISOString()
    })
  }
}
