/**
 * Loading Scene
 * 
 * First-class loading primitive for chapter-blocking tasks (≥ 7s).
 * Features:
 * - Deterministic ticker (rotating messages)
 * - Slow hint @ 12s
 * - Timeout @ 20s
 * - Error handling with retry
 * - Accessible (aria-live, reduced motion)
 * 
 * Usage:
 * ```tsx
 * <LoadingScene
 *   ticker={['Step 1...', 'Step 2...', 'Step 3...']}
 *   slowHintMs={12000}
 *   timeoutMs={20000}
 *   onTimeout={() => handleTimeout()}
 * />
 * ```
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type LoadingSceneState = 'loading' | 'slow' | 'timeout' | 'error' | 'success'

export interface LoadingSceneProps {
  // Ticker messages (cycle through these)
  ticker: string[]
  
  // Timers
  slowHintMs?: number
  timeoutMs?: number
  
  // Callbacks
  onTimeout?: () => void
  onRetry?: () => void
  onBack?: () => void
  
  // Error state
  error?: {
    code?: string
    title?: string
    message: string
  } | null
  
  // Control
  state?: LoadingSceneState
}

export function LoadingScene({
  ticker,
  slowHintMs = 12000,
  timeoutMs = 20000,
  onTimeout,
  onRetry,
  onBack,
  error,
  state: controlledState
}: LoadingSceneProps) {
  const [internalState, setInternalState] = useState<LoadingSceneState>('loading')
  const [showSlowHint, setShowSlowHint] = useState(false)
  const [tickerIndex, setTickerIndex] = useState(0)
  
  const slowHintTimerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const tickerTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use controlled state if provided, otherwise internal
  const state = controlledState || internalState
  
  // Start timers on mount
  useEffect(() => {
    if (state !== 'loading') return
    
    // Ticker: cycle through messages every 1.8s
    tickerTimerRef.current = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % ticker.length)
    }, 1800)
    
    // Slow hint: show after slowHintMs
    slowHintTimerRef.current = setTimeout(() => {
      setShowSlowHint(true)
      setInternalState('slow')
      
      // Announce for screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.className = 'sr-only'
      announcement.textContent = 'This is taking longer than usual. Please wait.'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }, slowHintMs)
    
    // Timeout: trigger callback after timeoutMs
    timeoutTimerRef.current = setTimeout(() => {
      setInternalState('timeout')
      onTimeout?.()
    }, timeoutMs)
    
    // Cleanup
    return () => {
      if (slowHintTimerRef.current) clearTimeout(slowHintTimerRef.current)
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current)
      if (tickerTimerRef.current) clearInterval(tickerTimerRef.current)
    }
  }, [state, ticker.length, slowHintMs, timeoutMs, onTimeout])
  
  // Error state
  if (error || state === 'error' || state === 'timeout') {
    const errorTitle = error?.title || (state === 'timeout' ? 'Request Timed Out' : 'Something Went Wrong')
    const errorMessage = error?.message || 'The service didn\'t respond in time. Please try again.'
    const errorCode = error?.code
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] px-4 space-y-6">
        <AlertCircle className="w-16 h-16 text-red-500" />
        
        <div className="text-center space-y-2 max-w-md">
          <h3 className="text-lg font-semibold text-gray-900">
            {errorTitle}
          </h3>
          <p className="text-sm text-gray-600">
            {errorMessage}
          </p>
          {errorCode && (
            <p className="text-xs text-gray-400 font-mono">
              Code: {errorCode}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 touch-manipulation active:scale-95 transition-transform"
            >
              Go Back
            </Button>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1 touch-manipulation active:scale-95 transition-transform"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }
  
  // Loading state
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 space-y-6">
      {/* Spinner */}
      <div className="relative">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
      
      {/* Ticker message */}
      <div className="text-center space-y-2">
        <p 
          className="text-base text-gray-700 font-medium"
          role="status"
          aria-live="polite"
        >
          {ticker[tickerIndex]}
        </p>
      </div>
      
      {/* Slow hint */}
      {showSlowHint && (
        <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg max-w-md">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <span className="text-base">💡</span>
            <span>This is taking longer than usual. Services might be slow.</span>
          </p>
        </div>
      )}
    </div>
  )
}
