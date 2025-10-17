'use client'

/**
 * useAutoCapture Hook
 * Manages auto-capture detection, countdown, and triggering
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import type { CameraOverlayType, DetectionResult } from '../types'
import { runAutoDetection } from '../detection/auto-capture-detection'

export interface UseAutoCaptureOptions {
  enabled: boolean
  enableOCR: boolean
  overlayType: CameraOverlayType
  confidenceThreshold: number
  isOpen: boolean
  videoRef: React.RefObject<HTMLVideoElement>
  onDetectionResult?: (result: DetectionResult) => void
  onTriggerCapture?: () => void
}

export function useAutoCapture(options: UseAutoCaptureOptions) {
  const [isAutoCapturing, setIsAutoCapturing] = useState(false)
  const [detectionActive, setDetectionActive] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  
  const detectionCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const consecutiveDetectionsRef = useRef<number>(0)
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null)

  const shouldEnableAutoCapture = options.enabled && 
    ['vin', 'license-plate', 'odometer', 'document'].includes(options.overlayType)

  // Create detection canvas on mount
  useEffect(() => {
    if (!detectionCanvasRef.current) {
      detectionCanvasRef.current = document.createElement('canvas')
    }
  }, [])

  // Real-time visual detection using heuristics
  useEffect(() => {
    if (!options.isOpen || !shouldEnableAutoCapture || !options.videoRef.current || !detectionCanvasRef.current) {
      return
    }

    let isActive = true
    consecutiveDetectionsRef.current = 0

    const runDetection = async () => {
      if (!isActive || !options.videoRef.current || !detectionCanvasRef.current || isAutoCapturing) {
        return
      }

      // Wait for video to be ready
      if (options.videoRef.current.readyState < 2) {
        setTimeout(runDetection, 100)
        return
      }

      try {
        // Run heuristic detection
        let result = runAutoDetection(
          options.videoRef.current,
          detectionCanvasRef.current,
          options.overlayType
        )

        // Enhance with OCR if enabled and heuristics show promise
        if (options.enableOCR && result.detected && result.confidence >= 0.6) {
          try {
            const { runOCREnhancement } = await import('../detection/auto-capture-ocr')
            result = await runOCREnhancement(
              options.videoRef.current,
              detectionCanvasRef.current,
              result,
              options.overlayType
            )
          } catch (error) {
            console.error('OCR enhancement failed, using heuristic result:', error)
            // Fall back to heuristic result
          }
        }

        // Notify parent of detection result
        options.onDetectionResult?.(result)

        setDetectionActive(result.detected)

        // Check if detection passes threshold
        if (result.detected && result.confidence >= options.confidenceThreshold) {
          consecutiveDetectionsRef.current++

          // Need 3 consecutive positive detections for stability
          if (consecutiveDetectionsRef.current >= 3) {
            // Start countdown
            setIsAutoCapturing(true)
            setCountdown(3)

            // Countdown timer
            let currentCountdown = 3
            const countdownInterval = setInterval(() => {
              currentCountdown--
              setCountdown(currentCountdown)

              if (currentCountdown <= 0) {
                clearInterval(countdownInterval)
                setCountdown(null)
              }
            }, 1000)

            // Auto-capture after countdown
            autoCaptureTimerRef.current = setTimeout(() => {
              if (isActive && options.isOpen) {
                options.onTriggerCapture?.()
              }
              setIsAutoCapturing(false)
              consecutiveDetectionsRef.current = 0
            }, 3000)

            isActive = false // Stop detection loop
            return
          }
        } else {
          // Reset counter if detection fails
          consecutiveDetectionsRef.current = 0
        }

        // Run detection every 500ms (2 FPS)
        if (isActive) {
          setTimeout(runDetection, 500)
        }
      } catch (error) {
        console.error('Detection error:', error)
        if (isActive) {
          setTimeout(runDetection, 500)
        }
      }
    }

    // Start detection after 1 second (camera stabilization)
    const startTimer = setTimeout(() => {
      runDetection()
    }, 1000)

    return () => {
      isActive = false
      clearTimeout(startTimer)
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current)
      }
      consecutiveDetectionsRef.current = 0
      setDetectionActive(false)
      setIsAutoCapturing(false)
      setCountdown(null)
    }
  }, [
    options.isOpen,
    shouldEnableAutoCapture,
    options.overlayType,
    options.confidenceThreshold,
    isAutoCapturing,
    options.enableOCR,
    options.onDetectionResult,
    options.onTriggerCapture,
    options.videoRef
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (options.enableOCR) {
        import('../detection/auto-capture-ocr').then(({ cleanupOCR }) => {
          cleanupOCR()
        }).catch(() => {
          // OCR module not loaded, nothing to cleanup
        })
      }
    }
  }, [options.enableOCR])

  return {
    isAutoCapturing,
    detectionActive,
    countdown,
    detectionCanvasRef
  }
}
