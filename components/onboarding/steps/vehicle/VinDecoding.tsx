/**
 * VIN Decoding Step
 * 
 * Calls /api/vin/decode with:
 * - 12s slow hint
 * - 20s timeout (AbortController)
 * - Processing lock (disables back/skip/continue)
 * - Retry/back actions on error
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, ArrowLeft, Loader2 } from 'lucide-react'
import { useVehicleOnboarding, type VehicleData, type VehicleRollup } from '@/flows/vehicle/store'
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics'

type DecodeState = 
  | { status: 'decoding'; message: string }
  | { status: 'success' }
  | { status: 'error'; code: string; message: string; canRetry: boolean }

const SLOW_HINT_MS = 12000 // 12 seconds
const TIMEOUT_MS = 20000 // 20 seconds

const tickerMessages = [
  'Contacting VIN database',
  'Validating checksum',
  'Preparing confirmation'
]

type VinDecodingProps = {
  stepId?: string
  stepIndex?: number
  chapterId?: string
}

export function VinDecoding({
  stepId = 'vin_decoding',
  stepIndex = 1,
  chapterId = 'default'
}: VinDecodingProps = {}) {
  const { vin, setVehicle } = useVehicleOnboarding()
  const analytics = useWizardAnalytics('vehicle')
  
  const [state, setState] = useState<DecodeState>({ status: 'decoding', message: tickerMessages[0] })
  const [showSlowHint, setShowSlowHint] = useState(false)
  const [tickerIndex, setTickerIndex] = useState(0)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const slowHintTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tickerTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track step view (once on mount)
  useEffect(() => {
    analytics.trackStepView(stepId, stepIndex, chapterId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Decode VIN on mount
  useEffect(() => {
    if (!vin) {
      setState({
        status: 'error',
        code: 'VIN_MISSING',
        message: 'No VIN provided',
        canRetry: false
      })
      return
    }
    
    decodeVin(vin)
    
    // Cleanup on unmount
    return () => {
      abortControllerRef.current?.abort()
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current)
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin])
  
  const decodeVin = async (vinCode: string) => {
    // Reset state
    setState({ status: 'decoding', message: tickerMessages[0] })
    setShowSlowHint(false)
    setTickerIndex(0)
    
    // Create abort controller
    abortControllerRef.current = new AbortController()
    
    // Track start
    analytics.trackStepView(`${stepId}_start`, stepIndex, chapterId)
    
    // Start ticker (cycle through messages every 4s)
    tickerTimerRef.current = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerMessages.length)
    }, 4000)
    
    // Show slow hint after 12s
    slowHintTimerRef.current = setTimeout(() => {
      setShowSlowHint(true)
      analytics.trackStepView(`${stepId}_slow`, stepIndex, chapterId)
      
      // Announce for screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.className = 'sr-only'
      announcement.textContent = 'VIN decoding is taking longer than usual. Please wait.'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }, SLOW_HINT_MS)
    
    // Abort after 20s
    timeoutTimerRef.current = setTimeout(() => {
      abortControllerRef.current?.abort()
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current)
      
      analytics.trackStepView(`${stepId}_timeout`, stepIndex, chapterId)
      
      setState({
        status: 'error',
        code: 'UPSTREAM_TIMEOUT',
        message: 'VIN decoding timed out. The service may be slow or unavailable.',
        canRetry: true
      })
    }, TIMEOUT_MS)
    
    try {
      const response = await fetch('/api/vin/decode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vinCode }),
        signal: abortControllerRef.current.signal
      })
      
      // Clear timers on response
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current)
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current)
      
      if (!response.ok) {
        const error = await response.json()
        
        analytics.trackStepView(`${stepId}_error`, stepIndex, chapterId)
        
        setState({
          status: 'error',
          code: error.code || 'UNKNOWN',
          message: getErrorMessage(error.code || 'UNKNOWN'),
          canRetry: error.code !== 'VIN_INVALID'
        })
        return
      }
      
      const data: { vehicle: VehicleData; rollup?: VehicleRollup } = await response.json()
      
      // Save to store
      setVehicle(data.vehicle, data.rollup)
      
      // Track success
      analytics.trackStepComplete(`${stepId}_success`, stepIndex, chapterId)
      
      setState({ status: 'success' })
      
    } catch (error: any) {
      // Clear timers
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current)
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current)
      
      // Ignore abort errors (we handle timeout separately)
      if (error.name === 'AbortError') return
      
      analytics.trackStepView(`${stepId}_error`, stepIndex, chapterId)
      
      setState({
        status: 'error',
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.',
        canRetry: true
      })
    }
  }
  
  const handleRetry = () => {
    if (!vin) return
    decodeVin(vin)
  }
  
  const handleBack = () => {
    // This will be wired to wizard.back() in parent
    window.history.back()
  }
  
  if (state.status === 'success') {
    // Auto-advance (parent wizard will handle this)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">VIN decoded successfully!</p>
        </div>
      </div>
    )
  }
  
  if (state.status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to decode VIN
          </h2>
          
          <p className="text-sm text-gray-600 mb-6">
            {state.message}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to VIN
            </Button>
            
            {state.canRetry && (
              <Button
                onClick={handleRetry}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retry
              </Button>
            )}
          </div>
          
          {state.code && (
            <p className="text-xs text-gray-500 mt-4">
              Error code: {state.code}
            </p>
          )}
        </div>
      </div>
    )
  }
  
  // Decoding state
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Decoding your VIN
          </h2>
          
          <p className="text-sm text-gray-600" aria-live="polite">
            {tickerMessages[tickerIndex]}...
          </p>
          
          {showSlowHint && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4" role="status">
              <strong>Taking longer than usual.</strong> The VIN database may be slow. Please wait...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'VIN_INVALID':
      return 'The VIN format is invalid. Please check and try again.'
    case 'UPSTREAM_UNAVAILABLE':
      return 'The VIN database is temporarily unavailable. Please try again in a few minutes.'
    case 'UPSTREAM_TIMEOUT':
      return 'VIN decoding timed out. The service may be slow or unavailable.'
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}
