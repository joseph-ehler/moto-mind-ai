/**
 * FEATURE USAGE ANALYTICS
 * 
 * Track feature usage, adoption, and engagement
 * 
 * Features:
 * - Feature usage tracking
 * - Adoption rate monitoring
 * - A/B test tracking
 * - Conversion tracking
 * - User engagement metrics
 */

import { logger } from './logger'
import { metrics } from './metrics'

export interface FeatureEvent {
  featureId: string
  eventType: 'enabled' | 'used' | 'disabled' | 'converted'
  userId?: string
  variant?: 'control' | 'treatment'
  timestamp: string
  context?: Record<string, any>
}

class FeatureAnalytics {
  private events: FeatureEvent[] = []
  private sessionFeatures: Set<string> = new Set()

  /**
   * Track feature enabled
   */
  trackFeatureEnabled(featureId: string, userId?: string, variant?: 'control' | 'treatment') {
    const event: FeatureEvent = {
      featureId,
      eventType: 'enabled',
      userId,
      variant,
      timestamp: new Date().toISOString()
    }

    this.events.push(event)
    metrics.trackFeatureUsage(featureId, true)
    
    logger.info(`Feature enabled: ${featureId}`, {
      component: 'feature_flags',
      action: 'feature_enabled',
      featureId,
      variant
    })
  }

  /**
   * Track feature used (first time in session)
   */
  trackFeatureUsed(featureId: string, userId?: string, context?: Record<string, any>) {
    // Track adoption if first time
    if (!this.sessionFeatures.has(featureId)) {
      this.sessionFeatures.add(featureId)
      metrics.trackFeatureAdoption(featureId)
      
      logger.info(`Feature adopted: ${featureId}`, {
        component: 'feature_flags',
        action: 'feature_adopted',
        featureId
      })
    }

    const event: FeatureEvent = {
      featureId,
      eventType: 'used',
      userId,
      timestamp: new Date().toISOString(),
      context
    }

    this.events.push(event)
    
    logger.trackAction(`Feature used: ${featureId}`, {
      featureId,
      ...context
    })
  }

  /**
   * Track feature disabled
   */
  trackFeatureDisabled(featureId: string, userId?: string) {
    const event: FeatureEvent = {
      featureId,
      eventType: 'disabled',
      userId,
      timestamp: new Date().toISOString()
    }

    this.events.push(event)
    metrics.trackFeatureUsage(featureId, false)
    
    logger.info(`Feature disabled: ${featureId}`, {
      component: 'feature_flags',
      action: 'feature_disabled',
      featureId
    })
  }

  /**
   * Track feature conversion (A/B test)
   */
  trackFeatureConversion(
    featureId: string,
    userId?: string,
    variant?: 'control' | 'treatment',
    conversionValue?: number
  ) {
    const event: FeatureEvent = {
      featureId,
      eventType: 'converted',
      userId,
      variant,
      timestamp: new Date().toISOString(),
      context: { conversionValue }
    }

    this.events.push(event)
    
    logger.info(`Feature conversion: ${featureId}`, {
      component: 'feature_flags',
      action: 'feature_converted',
      featureId,
      variant,
      conversionValue
    })
  }

  /**
   * Get feature events
   */
  getEvents(featureId?: string): FeatureEvent[] {
    if (featureId) {
      return this.events.filter(e => e.featureId === featureId)
    }
    return [...this.events]
  }

  /**
   * Get feature usage stats
   */
  getUsageStats(featureId: string) {
    const events = this.getEvents(featureId)
    
    const enabled = events.filter(e => e.eventType === 'enabled').length
    const used = events.filter(e => e.eventType === 'used').length
    const disabled = events.filter(e => e.eventType === 'disabled').length
    const converted = events.filter(e => e.eventType === 'converted').length

    return {
      enabled,
      used,
      disabled,
      converted,
      adoptionRate: enabled > 0 ? (used / enabled) * 100 : 0,
      conversionRate: used > 0 ? (converted / used) * 100 : 0
    }
  }

  /**
   * Get A/B test stats
   */
  getABTestStats(featureId: string) {
    const events = this.getEvents(featureId)
    
    const controlEvents = events.filter(e => e.variant === 'control')
    const treatmentEvents = events.filter(e => e.variant === 'treatment')

    const controlConversions = controlEvents.filter(e => e.eventType === 'converted').length
    const treatmentConversions = treatmentEvents.filter(e => e.eventType === 'converted').length

    return {
      control: {
        total: controlEvents.length,
        conversions: controlConversions,
        conversionRate: controlEvents.length > 0 ? (controlConversions / controlEvents.length) * 100 : 0
      },
      treatment: {
        total: treatmentEvents.length,
        conversions: treatmentConversions,
        conversionRate: treatmentEvents.length > 0 ? (treatmentConversions / treatmentEvents.length) * 100 : 0
      }
    }
  }

  /**
   * Clear events
   */
  clear() {
    this.events = []
    this.sessionFeatures.clear()
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

export const featureAnalytics = new FeatureAnalytics()

// ==========================================================================
// REACT HOOKS
// ==========================================================================

import { useEffect } from 'react'

/**
 * Hook to track feature usage
 */
export function useFeatureTracking(featureId: string, isEnabled: boolean, variant?: 'control' | 'treatment') {
  useEffect(() => {
    if (isEnabled) {
      featureAnalytics.trackFeatureEnabled(featureId, undefined, variant)
    } else {
      featureAnalytics.trackFeatureDisabled(featureId)
    }
  }, [featureId, isEnabled, variant])

  return {
    trackUsed: (context?: Record<string, any>) => {
      featureAnalytics.trackFeatureUsed(featureId, undefined, context)
    },
    trackConversion: (conversionValue?: number) => {
      featureAnalytics.trackFeatureConversion(featureId, undefined, variant, conversionValue)
    }
  }
}
