/**
 * Wizard Analytics Hook
 * 
 * Tracks wizard events for analytics.
 * Namespaced by flow to avoid collisions.
 */

'use client'

import { useCallback, useEffect } from 'react'

export type WizardEvent = 
  | 'onboarding_started'
  | 'resume_prompt_shown'
  | 'resume_prompt_accepted'
  | 'resume_prompt_rejected'
  | 'step_viewed'
  | 'step_completed'
  | 'continue_disabled_click'
  | 'branch_appended'
  | 'branch_pruned'
  | 'exit_clicked'
  | 'start_over_confirmed'
  | 'error_boundary_triggered'

export type WizardEventProperties = {
  flowName: string
  stepId?: string
  stepIndex?: number
  chapterId?: string
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  mode?: 'modal' | 'fullscreen'
  [key: string]: any
}

type AnalyticsConfig = {
  enabled?: boolean
  debug?: boolean
  provider?: 'console' | 'gtag' | 'mixpanel' | 'segment'
}

// Default to console in development
const defaultConfig: AnalyticsConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
  provider: 'console'
}

/**
 * Track a wizard event
 */
function trackEvent(
  event: WizardEvent,
  properties: WizardEventProperties,
  config: AnalyticsConfig = defaultConfig
) {
  if (!config.enabled) return

  // Add device type if not provided
  if (!properties.deviceType) {
    properties.deviceType = getDeviceType()
  }

  // Add timestamp
  const payload = {
    event,
    properties,
    timestamp: new Date().toISOString()
  }

  // Debug mode: log to console
  if (config.debug) {
    console.log('[Analytics]', payload)
  }

  // Send to analytics provider
  switch (config.provider) {
    case 'console':
      console.log('[Analytics]', payload)
      break
    
    case 'gtag':
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, properties)
      }
      break
    
    case 'mixpanel':
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.track(event, properties)
      }
      break
    
    case 'segment':
      if (typeof window !== 'undefined' && (window as any).analytics) {
        (window as any).analytics.track(event, properties)
      }
      break
    
    default:
      // Custom provider or no-op
      break
  }
}

/**
 * Detect device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Hook for wizard analytics
 */
export function useWizardAnalytics(
  flowName: string,
  config?: AnalyticsConfig
) {
  const mergedConfig = { ...defaultConfig, ...config }

  // Track wizard start (once)
  useEffect(() => {
    trackEvent('onboarding_started', { flowName }, mergedConfig)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // Track step view
  const trackStepView = useCallback((stepId: string, stepIndex: number, chapterId?: string) => {
    trackEvent('step_viewed', {
      flowName,
      stepId,
      stepIndex,
      chapterId
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track step complete
  const trackStepComplete = useCallback((stepId: string, stepIndex: number, chapterId?: string) => {
    trackEvent('step_completed', {
      flowName,
      stepId,
      stepIndex,
      chapterId
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track disabled click (friction point)
  const trackDisabledClick = useCallback((stepId: string, reason: string) => {
    trackEvent('continue_disabled_click', {
      flowName,
      stepId,
      reason
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track branch events
  const trackBranchAppended = useCallback((parent: string, child: string) => {
    trackEvent('branch_appended', {
      flowName,
      parent,
      child
    }, mergedConfig)
  }, [flowName, mergedConfig])

  const trackBranchPruned = useCallback((parent: string, child: string) => {
    trackEvent('branch_pruned', {
      flowName,
      parent,
      child
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track exit
  const trackExit = useCallback((stepId: string, reason: 'save_exit' | 'back' | 'close') => {
    trackEvent('exit_clicked', {
      flowName,
      stepId,
      reason
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track start over
  const trackStartOver = useCallback((stepId: string) => {
    trackEvent('start_over_confirmed', {
      flowName,
      stepId
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track resume prompt
  const trackResumePrompt = useCallback((action: 'shown' | 'accepted' | 'rejected') => {
    trackEvent(`resume_prompt_${action}` as WizardEvent, {
      flowName
    }, mergedConfig)
  }, [flowName, mergedConfig])

  // Track error boundary
  const trackError = useCallback((stepId: string, error: string) => {
    trackEvent('error_boundary_triggered', {
      flowName,
      stepId,
      error
    }, mergedConfig)
  }, [flowName, mergedConfig])

  return {
    trackStepView,
    trackStepComplete,
    trackDisabledClick,
    trackBranchAppended,
    trackBranchPruned,
    trackExit,
    trackStartOver,
    trackResumePrompt,
    trackError
  }
}
