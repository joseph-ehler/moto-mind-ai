/**
 * useHaptic Hook
 * 
 * Provides haptic feedback for mobile devices
 * Native app feel with vibration patterns
 */

import { useCallback } from 'react'

export interface UseHapticReturn {
  // Predefined patterns
  impact: (style?: 'light' | 'medium' | 'heavy') => void
  notification: (type?: 'success' | 'warning' | 'error') => void
  selection: () => void
  
  // Custom vibration
  vibrate: (pattern: number | number[]) => void
  
  // Utilities
  isSupported: boolean
}

/**
 * Haptic feedback patterns (in milliseconds)
 */
const PATTERNS = {
  // Impact patterns
  impact: {
    light: [10],
    medium: [20],
    heavy: [30]
  },
  
  // Notification patterns
  notification: {
    success: [10, 50, 10],        // Double tap
    warning: [20, 100, 20],        // Double tap (longer)
    error: [50, 100, 50, 100, 50]  // Triple tap (urgent)
  },
  
  // UI interactions
  selection: [5],  // Light tap for selections
  
  // Capture patterns
  capture: [15],   // Medium tap for photo capture
  processing: [10, 50, 10, 50, 10], // Pulsing during processing
}

/**
 * Check if vibration API is supported
 */
function isVibrationSupported(): boolean {
  return 'vibrate' in navigator
}

/**
 * Haptic feedback hook
 * Provides native-like tactile feedback
 */
export function useHaptic(): UseHapticReturn {
  const isSupported = isVibrationSupported()
  
  /**
   * Trigger vibration pattern
   */
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!isSupported) {
      console.warn('⚠️  Haptic feedback not supported on this device')
      return
    }
    
    try {
      navigator.vibrate(pattern)
    } catch (err) {
      console.error('❌ Haptic feedback error:', err)
    }
  }, [isSupported])
  
  /**
   * Impact haptic - for physical interactions
   */
  const impact = useCallback((style: 'light' | 'medium' | 'heavy' = 'medium') => {
    vibrate(PATTERNS.impact[style])
  }, [vibrate])
  
  /**
   * Notification haptic - for status updates
   */
  const notification = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
    vibrate(PATTERNS.notification[type])
  }, [vibrate])
  
  /**
   * Selection haptic - for UI selections
   */
  const selection = useCallback(() => {
    vibrate(PATTERNS.selection)
  }, [vibrate])
  
  return {
    impact,
    notification,
    selection,
    vibrate,
    isSupported
  }
}

/**
 * Export patterns for custom use
 */
export { PATTERNS as HAPTIC_PATTERNS }
