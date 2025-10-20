/**
 * VIN Decoding Step
 * 
 * Uses LoadingScene primitive for clean, accessible loading with:
 * - Rotating ticker messages
 * - 12s slow hint
 * - 20s timeout with retry
 * - Error handling
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useVehicleOnboarding, type VehicleData, type VehicleRollup } from '@/flows/vehicle/store'
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics'
import { LoadingScene } from '@/components/onboarding/LoadingScene'
import { prefetchAITickers } from '@/lib/ai/ticker-service'

const baseTickers = [
  'Contacting VIN database...',
  'Validating checksum...',
  'Preparing confirmation...'
]

type VinDecodingProps = {
  stepId?: string
  stepIndex?: number
  chapterId?: string
}

type ErrorState = {
  code: string
  title: string
  message: string
} | null

export function VinDecoding({
  stepId = 'vin_decoding',
  stepIndex = 1,
  chapterId = 'default'
}: VinDecodingProps = {}) {
  const { vin, vehicle, setVehicle } = useVehicleOnboarding()
  const analytics = useWizardAnalytics('vehicle')
  
  const [error, setError] = useState<ErrorState>(null)
  const [aiTickers, setAiTickers] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Prefetch AI tickers on mount
  useEffect(() => {
    if (!vehicle) return
    
    prefetchAITickers(
      {
        flow: 'vehicle',
        chapter: 'vin-decode',
        vehicle: {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
        },
        locale: 'en-US',
        tone: 'calm',
      },
      baseTickers
    ).then(setAiTickers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Track step view (once on mount)
  useEffect(() => {
    analytics.trackStepView(stepId, stepIndex, chapterId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Decode VIN on mount
  useEffect(() => {
    if (!vin) {
      setError({
        code: 'VIN_MISSING',
        title: 'No VIN Provided',
        message: 'Please go back and enter your VIN.'
      })
      return
    }
    
    decodeVin(vin)
    
    // Cleanup on unmount
    return () => {
      abortControllerRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin])
  
  const decodeVin = async (vinCode: string) => {
    // Reset error state
    setError(null)
    
    // Create abort controller for timeout
    abortControllerRef.current = new AbortController()
    
    // Track start
    analytics.trackStepView(`${stepId}_start`, stepIndex, chapterId)
    
    try {
      const response = await fetch('/api/vin/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vinCode }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        
        analytics.trackStepView(`${stepId}_error`, stepIndex, chapterId)
        
        setError({
          code: errorData.code || 'UNKNOWN',
          title: 'VIN Decode Failed',
          message: getErrorMessage(errorData.code || 'UNKNOWN')
        })
        return
      }
      
      const data: { vehicle: VehicleData; rollup?: VehicleRollup } = await response.json()
      
      // Save to store
      setVehicle(data.vehicle, data.rollup)
      
      // Track success
      analytics.trackStepComplete(`${stepId}_success`, stepIndex, chapterId)
      
    } catch (err: any) {
      // Ignore abort errors (handled by timeout)
      if (err.name === 'AbortError') return
      
      analytics.trackStepView(`${stepId}_error`, stepIndex, chapterId)
      
      setError({
        code: 'NETWORK_ERROR',
        title: 'Network Error',
        message: 'Please check your connection and try again.'
      })
    }
  }
  
  const handleTimeout = () => {
    abortControllerRef.current?.abort()
    
    analytics.trackStepView(`${stepId}_timeout`, stepIndex, chapterId)
    
    setError({
      code: 'UPSTREAM_TIMEOUT',
      title: 'Request Timed Out',
      message: 'The VIN service didn\'t respond in time. Please try again.'
    })
  }
  
  const handleRetry = () => {
    if (!vin) return
    decodeVin(vin)
  }
  
  const handleBack = () => {
    window.history.back()
  }
  
  return (
    <LoadingScene
      ticker={baseTickers}
      aiTickers={aiTickers}
      slowHintMs={12000}
      timeoutMs={20000}
      onTimeout={handleTimeout}
      onRetry={handleRetry}
      onBack={handleBack}
      error={error}
    />
  )
}

/**
 * Get user-friendly error message based on error code
 */
function getErrorMessage(code: string): string {
  switch (code) {
    case 'VIN_INVALID':
      return 'The VIN you entered is invalid. Please check and try again.'
    case 'UPSTREAM_TIMEOUT':
      return 'The VIN service didn\'t respond in time. Please try again.'
    case 'UPSTREAM_UNAVAILABLE':
      return 'The VIN database is temporarily unavailable. Please try again later.'
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
