/**
 * React hook for CarPlay/Android Auto detection
 * 
 * Provides real-time car connection status with confidence scoring.
 * Automatically starts monitoring on mount and cleans up on unmount.
 * 
 * @module hooks/useCarPlayDetection
 */

import { useState, useEffect, useRef } from 'react'
import { EnhancedCarPlayDetector, type CarConnectionSignals } from '@/lib/tracking/carplay-detector'

/**
 * Hook for detecting CarPlay/Android Auto connection
 * 
 * @returns Current connection signals or null if not yet detected
 * 
 * @example
 * ```tsx
 * function TrackingPage() {
 *   const carPlaySignals = useCarPlayDetection()
 *   
 *   if (carPlaySignals?.confidence.level === 'high') {
 *     return <CarPlayBanner signals={carPlaySignals} />
 *   }
 *   
 *   return <NormalUI />
 * }
 * ```
 */
export function useCarPlayDetection(): CarConnectionSignals | null {
  const [signals, setSignals] = useState<CarConnectionSignals | null>(null)
  const detectorRef = useRef<EnhancedCarPlayDetector | null>(null)
  
  useEffect(() => {
    // Create detector instance
    const detector = new EnhancedCarPlayDetector()
    detectorRef.current = detector
    
    // Initial detection
    detector.detect().then(setSignals).catch((error) => {
      console.error('[useCarPlayDetection] Initial detection failed:', error)
    })
    
    // Listen for changes
    const handleConnectionChange = (_connected: boolean, newSignals: CarConnectionSignals) => {
      setSignals(newSignals)
    }
    
    detector.onConnectionChange(handleConnectionChange)
    
    // Start monitoring
    detector.startMonitoring()
    
    // Cleanup
    return () => {
      detector.stopMonitoring()
      detector.offConnectionChange(handleConnectionChange)
      detectorRef.current = null
    }
  }, [])
  
  return signals
}

/**
 * Hook for detecting if car is currently connected
 * 
 * @param minimumConfidence Minimum confidence level required (default: 'medium')
 * @returns True if car is connected with sufficient confidence
 * 
 * @example
 * ```tsx
 * function AutoStartButton() {
 *   const isConnected = useIsCarConnected('high')
 *   
 *   if (isConnected) {
 *     return <Button onClick={startTracking}>Auto-Start Enabled</Button>
 *   }
 *   
 *   return null
 * }
 * ```
 */
export function useIsCarConnected(
  minimumConfidence: 'low' | 'medium' | 'high' | 'very-high' = 'medium'
): boolean {
  const signals = useCarPlayDetection()
  
  if (!signals) return false
  
  const confidenceLevels = ['low', 'medium', 'high', 'very-high']
  const minIndex = confidenceLevels.indexOf(minimumConfidence)
  const currentIndex = confidenceLevels.indexOf(signals.confidence.level)
  
  return currentIndex >= minIndex
}
