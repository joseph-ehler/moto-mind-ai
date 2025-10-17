/**
 * Confidence Scoring Plugin
 * 
 * Enforces minimum confidence thresholds and provides visual feedback
 * 
 * Features:
 * - Minimum confidence validation
 * - Automatic retry on low confidence
 * - Visual confidence badge
 * - Confidence trend tracking
 * - Configurable thresholds per capture type
 * 
 * @example
 * ```tsx
 * <VINScanner
 *   plugins={[
 *     confidenceScoring({
 *       minConfidence: 0.90,
 *       maxRetries: 3,
 *       showBadge: true,
 *       strictMode: false
 *     })
 *   ]}
 * />
 * ```
 */

import React from 'react'
import type { VisionPlugin, VisionPluginFactory, VisionPluginContext } from '../types'
import type { CaptureResult } from '../../types'

// Confidence scoring configuration
export interface ConfidenceScoringOptions {
  /** Minimum confidence threshold (0.0 - 1.0) */
  minConfidence?: number
  
  /** Maximum retry attempts on low confidence */
  maxRetries?: number
  
  /** Show confidence badge UI */
  showBadge?: boolean
  
  /** Strict mode - fail immediately on low confidence */
  strictMode?: boolean
  
  /** Confidence thresholds per capture type */
  thresholds?: {
    vin?: number
    odometer?: number
    licensePlate?: number
    document?: number
  }
  
  /** Retry strategy */
  retryStrategy?: 'immediate' | 'with-delay' | 'manual'
  
  /** Delay between retries (ms) */
  retryDelay?: number
  
  /** Callback for confidence events */
  onConfidenceCheck?: (result: ConfidenceCheckResult) => void
  
  /** Callback for low confidence */
  onLowConfidence?: (confidence: number, threshold: number) => void
}

export interface ConfidenceCheckResult {
  passed: boolean
  confidence: number
  threshold: number
  attempt: number
  shouldRetry: boolean
  message: string
}

/**
 * Get confidence level color
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'bg-green-500'
  if (confidence >= 0.75) return 'bg-yellow-500'
  if (confidence >= 0.5) return 'bg-orange-500'
  return 'bg-red-500'
}

/**
 * Get confidence level label
 */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.95) return 'Excellent'
  if (confidence >= 0.9) return 'Very Good'
  if (confidence >= 0.8) return 'Good'
  if (confidence >= 0.7) return 'Fair'
  if (confidence >= 0.5) return 'Low'
  return 'Very Low'
}

/**
 * Check if confidence meets threshold
 */
function checkConfidence(
  result: CaptureResult,
  options: ConfidenceScoringOptions,
  attempt: number,
  captureType?: string
): ConfidenceCheckResult {
  const confidence = result.confidence ?? 0
  
  // Get threshold for this capture type
  const threshold = captureType
    ? (options.thresholds?.[captureType as keyof typeof options.thresholds] ??
       options.minConfidence ??
       0.85)
    : (options.minConfidence ?? 0.85)
  
  const passed = confidence >= threshold
  const shouldRetry = !passed && 
    !options.strictMode && 
    attempt < (options.maxRetries ?? 3)
  
  let message = ''
  if (passed) {
    message = `Confidence ${(confidence * 100).toFixed(1)}% meets threshold ${(threshold * 100).toFixed(1)}%`
  } else if (shouldRetry) {
    message = `Low confidence ${(confidence * 100).toFixed(1)}% (need ${(threshold * 100).toFixed(1)}%). Retry ${attempt}/${options.maxRetries ?? 3}`
  } else {
    message = `Confidence ${(confidence * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%`
  }
  
  return {
    passed,
    confidence,
    threshold,
    attempt,
    shouldRetry,
    message
  }
}

/**
 * Confidence Badge Component
 */
function ConfidenceBadge({ 
  confidence, 
  threshold 
}: { 
  confidence: number
  threshold: number 
}) {
  const percentage = Math.round(confidence * 100)
  const meetsThreshold = confidence >= threshold
  const color = getConfidenceColor(confidence)
  const label = getConfidenceLabel(confidence)
  
  return (
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
      <div className="flex items-center gap-2">
        {/* Confidence dot */}
        <div className={`w-2 h-2 rounded-full ${color}`} />
        
        {/* Confidence text */}
        <div className="flex flex-col">
          <div className="text-xs font-medium">
            Confidence: {percentage}%
          </div>
          <div className={`text-[10px] ${meetsThreshold ? 'text-green-400' : 'text-yellow-400'}`}>
            {label} {!meetsThreshold && `(need ${Math.round(threshold * 100)}%)`}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Confidence Trend Tracker
 */
class ConfidenceTrendTracker {
  private history: number[] = []
  private maxHistory = 10
  
  add(confidence: number): void {
    this.history.push(confidence)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }
  
  getAverage(): number {
    if (this.history.length === 0) return 0
    return this.history.reduce((sum, c) => sum + c, 0) / this.history.length
  }
  
  getTrend(): 'improving' | 'declining' | 'stable' {
    if (this.history.length < 3) return 'stable'
    
    const recent = this.history.slice(-3)
    const first = recent[0]
    const last = recent[recent.length - 1]
    const diff = last - first
    
    if (diff > 0.05) return 'improving'
    if (diff < -0.05) return 'declining'
    return 'stable'
  }
  
  clear(): void {
    this.history = []
  }
}

/**
 * Confidence Scoring Plugin Factory
 * 
 * Creates a plugin that enforces minimum confidence thresholds
 */
export const confidenceScoring: VisionPluginFactory<ConfidenceScoringOptions> = (
  options = {}
) => {
  const trendTracker = new ConfidenceTrendTracker()
  let attemptCount = 0
  
  const plugin: VisionPlugin = {
    id: '@motomind/confidence-scoring',
    version: '1.0.0',
    type: 'validator',
    name: 'Confidence Scoring',
    
    hooks: {
      /**
       * Validate confidence after capture
       */
      'after-capture': async (result: CaptureResult, context: VisionPluginContext) => {
        console.log('📊 Confidence Scoring: Checking confidence level...')
        
        attemptCount++
        const confidence = result.confidence ?? 0
        
        // Track confidence trend
        trendTracker.add(confidence)
        
        const check = checkConfidence(result, options, attemptCount, context.captureType)
        
        console.log('📊 Confidence Check:', {
          confidence: `${(check.confidence * 100).toFixed(1)}%`,
          threshold: `${(check.threshold * 100).toFixed(1)}%`,
          passed: check.passed,
          attempt: check.attempt,
          trend: trendTracker.getTrend()
        })
        
        // Callback
        options.onConfidenceCheck?.(check)
        
        if (!check.passed) {
          console.warn('⚠️  Low confidence detected:', check.message)
          options.onLowConfidence?.(check.confidence, check.threshold)
        }
        
        return result
      },
      
      /**
       * Validate result confidence
       */
      'validate-result': async (result: CaptureResult) => {
        const check = checkConfidence(result, options, attemptCount)
        
        if (!check.passed) {
          console.error('❌ Confidence validation failed:', check.message)
          
          if (check.shouldRetry) {
            console.log('🔄 Confidence below threshold, retry recommended')
            return false
          }
          
          if (options.strictMode) {
            throw new Error(`Confidence ${(check.confidence * 100).toFixed(1)}% below required ${(check.threshold * 100).toFixed(1)}%`)
          }
        }
        
        return check.passed
      },
      
      /**
       * Handle retry logic
       */
      'on-retry': async (retryCount: number, context: VisionPluginContext) => {
        console.log(`🔄 Confidence Scoring: Retry attempt ${retryCount}/${options.maxRetries ?? 3}`)
        
        const trend = trendTracker.getTrend()
        console.log(`📈 Confidence trend: ${trend}`)
        
        if (trend === 'declining' && attemptCount >= 2) {
          console.warn('⚠️  Confidence declining - suggest improving conditions (lighting, steadiness, etc.)')
        }
        
        // Add delay if configured
        if (options.retryDelay && options.retryDelay > 0) {
          console.log(`⏳ Waiting ${options.retryDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, options.retryDelay))
        }
      },
      
      /**
       * Handle error with confidence-based decision
       */
      'on-error': async (error: Error, context: VisionPluginContext) => {
        const shouldRetry = 
          attemptCount < (options.maxRetries ?? 3) &&
          !options.strictMode &&
          options.retryStrategy !== 'manual'
        
        console.log('❌ Confidence Scoring: Error occurred', {
          attempt: attemptCount,
          maxRetries: options.maxRetries ?? 3,
          shouldRetry,
          averageConfidence: `${(trendTracker.getAverage() * 100).toFixed(1)}%`,
          trend: trendTracker.getTrend()
        })
        
        if (shouldRetry) {
          return {
            retry: true,
            delay: options.retryDelay ?? 1000,
            message: `Low confidence. Retrying (${attemptCount}/${options.maxRetries ?? 3})...`
          }
        }
        
        return { retry: false }
      },
      
      /**
       * Reset on success
       */
      'on-success': async (result: CaptureResult, context: VisionPluginContext) => {
        console.log('✅ Confidence Scoring: Success!', {
          finalConfidence: `${((result.confidence ?? 0) * 100).toFixed(1)}%`,
          attempts: attemptCount,
          averageConfidence: `${(trendTracker.getAverage() * 100).toFixed(1)}%`,
          trend: trendTracker.getTrend()
        })
        
        // Reset for next capture
        attemptCount = 0
        trendTracker.clear()
      },
      
      /**
       * Reset on cancel
       */
      'on-cancel': async (context: VisionPluginContext) => {
        console.log('🚫 Confidence Scoring: Cancelled, resetting')
        attemptCount = 0
        trendTracker.clear()
      },
      
      /**
       * Render confidence badge overlay
       */
      'render-overlay': (context: VisionPluginContext) => {
        if (!options.showBadge) {
          return null
        }
        
        // Only show if we have confidence data (from scanner state)
        const confidence = undefined // TODO: Get from scanner state when available
        if (confidence === undefined) {
          return null
        }
        
        const threshold = 
          options.thresholds?.[context.captureType as keyof typeof options.thresholds] ??
          options.minConfidence ??
          0.85
        
        return (
          <ConfidenceBadge 
            confidence={confidence} 
            threshold={threshold}
          />
        )
      },
      
      /**
       * Enrich result with confidence metadata
       */
      'enrich-result': async (result: CaptureResult) => {
        const check = checkConfidence(result, options, attemptCount)
        
        result.metadata = {
          ...result.metadata,
          confidenceScoring: {
            score: check.confidence,
            threshold: check.threshold,
            passed: check.passed,
            attempts: attemptCount,
            averageConfidence: trendTracker.getAverage(),
            trend: trendTracker.getTrend(),
            label: getConfidenceLabel(check.confidence)
          }
        }
        
        return result
      }
    }
  }
  
  return plugin
}

// Export utilities for standalone use
export {
  getConfidenceColor,
  getConfidenceLabel,
  checkConfidence,
  ConfidenceBadge,
  ConfidenceTrendTracker
}
