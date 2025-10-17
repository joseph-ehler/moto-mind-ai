'use client'

/**
 * UnifiedCameraCapture Component
 * 
 * Layer 2: Powerful, configurable camera capture base
 * - Full-screen when camera is active
 * - Mobile responsive and contextually aware
 * - Composes all sub-components
 * - Uses functional core (hooks)
 * - Zero raw HTML divs
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useCamera } from '../hooks/useCamera'
import { useVisionProcessing } from '../hooks/useVisionProcessing'
import { useHaptic } from '../hooks/useHaptic'
import { useImagePreprocessing } from '../hooks/useImagePreprocessing'
import { useVisionPluginManager } from '../plugins/hooks/usePluginManager'
import type { VisionPluginContext } from '../plugins/types'
import { CameraView } from './CameraView'
import { ProcessingModal } from './ProcessingModal'
import { ErrorModal } from './ErrorModal'
import type { UnifiedCameraCaptureProps, CaptureState, CaptureResult } from '../types'

/**
 * Detect if device is mobile
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = 
        window.innerWidth <= 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}

/**
 * Unified camera capture component - STARTS CAMERA IMMEDIATELY, NO MODAL!
 */
export function UnifiedCameraCapture({
  captureType,
  frameGuide,
  instructions,
  onCapture,
  onCancel,
  onAnalytics,
  onPluginEvent,
  processingAPI,
  vehicleId,
  title,
  cameraConstraints,
  maxRetries = 3,
  autoStartCamera = false,
  mock,
  enablePreprocessing = true,
  preprocessingOptions,
  plugins = []
}: UnifiedCameraCaptureProps) {
  // State machine - START WITH CAMERA!
  const [currentState, setCurrentState] = useState<CaptureState>('camera')
  // Mobile detection
  const isMobile = useIsMobile()
  // Track retry count for plugins
  const retryCountRef = useRef(0)
  // Track last error for plugins
  const lastErrorRef = useRef<Error | undefined>(undefined)
  
  // Haptic feedback
  const haptic = useHaptic()
  
  // Image preprocessing
  const preprocessing = useImagePreprocessing({
    enabled: enablePreprocessing,
    options: preprocessingOptions,
    onComplete: (result) => {
      console.log('✅ Image preprocessed:', {
        compression: `${result.compressionPercentage.toFixed(1)}%`,
        size: `${(result.compressedSize / 1024).toFixed(2)} KB`
      })
    },
    onError: (error) => {
      console.error('❌ Preprocessing error:', error)
      onAnalytics?.({ type: 'processing_failed', timestamp: Date.now(), data: { captureType, error } })
    }
  })
  
  // Camera hook (functional core)
  const camera = useCamera({
    constraints: {
      facingMode: cameraConstraints?.facingMode || (isMobile ? 'environment' : 'user'),
      width: cameraConstraints?.width || { ideal: 1920 },
      height: cameraConstraints?.height || { ideal: 1080 }
    },
    onError: (error) => {
      console.error('Camera error:', error)
      setCurrentState('error')
    }
  })
  
  // Vision processing hook (functional core)
  const processing = useVisionProcessing({
    type: captureType,
    mock,
    maxRetries
  })
  
  // =========================================================================
  // PLUGIN SYSTEM
  // =========================================================================
  
  // Create plugin context (stable reference)
  const pluginContext = useMemo<VisionPluginContext>(() => {
    const context: VisionPluginContext = {
      captureType,
      state: currentState,
      constraints: {
        facingMode: cameraConstraints?.facingMode || (isMobile ? 'environment' : 'user'),
        width: cameraConstraints?.width || { ideal: 1920 },
        height: cameraConstraints?.height || { ideal: 1080 }
      },
      retryCount: retryCountRef.current,
      lastError: lastErrorRef.current,
      stream: camera.state.stream,
      trackEvent: onAnalytics || (() => {}),
      retry: () => handleRetry(),
      cancel: () => handleCancel(),
      getOptions: <T = any>() => ({} as T),
      emit: onPluginEvent || (() => {}),
      on: () => () => {},
      props: {
        captureType,
        frameGuide,
        instructions,
        onCapture,
        onCancel,
        onAnalytics,
        onPluginEvent,
        processingAPI,
        vehicleId,
        title,
        cameraConstraints,
        maxRetries,
        autoStartCamera,
        mock,
        enablePreprocessing,
        preprocessingOptions,
        plugins
      }
    }
    return context
  }, [
    captureType,
    // currentState removed - changes during processing
    cameraConstraints,
    isMobile,
    // camera.state.stream removed - stops during capture, shouldn't recreate context
    onAnalytics,
    onPluginEvent,
    frameGuide,
    instructions,
    onCapture,
    onCancel,
    processingAPI,
    vehicleId,
    title,
    maxRetries,
    autoStartCamera,
    mock,
    enablePreprocessing,
    preprocessingOptions,
    plugins
  ])
  
  // Initialize plugin manager
  const pluginManager = useVisionPluginManager({
    plugins,
    context: pluginContext,
    enabled: plugins.length > 0
  })
  
  /**
   * Handle starting camera
   */
  const handleStartCamera = useCallback(async () => {
    console.log('📷 Starting camera...')
    haptic.selection() // Light haptic for button press
    onAnalytics?.({ type: 'camera_started', timestamp: Date.now(), data: { captureType } })
    
    setCurrentState('camera')
    await camera.startCamera()
  }, [camera, haptic, onAnalytics, captureType])
  
  /**
   * Capture frame and process
   */
  const handleCapture = useCallback(async () => {
    if (processing.isProcessing) return
    
    // Execute before-capture hooks
    const canProceed = await pluginManager.executeBeforeCapture(pluginContext)
    if (!canProceed) {
      console.log('❌ Capture blocked by plugin')
      return
    }
    
    const captureStartTime = Date.now()
    onAnalytics?.({ type: 'capture_initiated', timestamp: captureStartTime, data: { captureType } })
    
    console.log('📸 Capturing frame...')
    haptic.impact('medium') // Medium feedback for capture
    
    const imageData = camera.captureFrame()
    if (!imageData) {
      console.error('Failed to capture frame')
      onAnalytics?.({ type: 'capture_failed', timestamp: Date.now(), data: { captureType, error: 'Frame capture failed' } })
      haptic.notification('error') // Error feedback
      return
    }
    
    onAnalytics?.({ type: 'capture_success', timestamp: Date.now(), data: { captureType, duration: Date.now() - captureStartTime } })
    
    setCurrentState('processing')
    
    // Stop camera immediately after capture
    camera.stopCamera()
    
    // Process the captured image
    const processingStartTime = Date.now()
    onAnalytics?.({ type: 'processing_started', timestamp: processingStartTime, data: { captureType } })
    
    let result = await processing.processImage(imageData, processingAPI)
    
    if (result) {
      try {
        // Execute plugin pipeline
        result = await pluginManager.executeAfterCapture(result, pluginContext)
        result = await pluginManager.executeTransformResult(result)
        await pluginManager.executeValidateResult(result)
        result = await pluginManager.executeEnrichResult(result)
        
        onAnalytics?.({ 
          type: 'processing_success', 
          timestamp: Date.now(), 
          data: { 
            captureType, 
            duration: result.processing_time_ms,
            confidence: result.confidence 
          } 
        })
        haptic.notification('success') // Success feedback
        setCurrentState('success')
        
        // Execute on-success hooks
        await pluginManager.executeOnSuccess(result, pluginContext)
        
        onCapture(result)
      } catch (error) {
        // Plugin validation failed - treat as error
        lastErrorRef.current = error instanceof Error ? error : new Error('Validation failed')
        console.error('❌ Plugin validation failed:', error)
        
        // Execute on-error hooks
        const retryDecision = await pluginManager.executeOnError(lastErrorRef.current, pluginContext)
        
        if (retryDecision?.retry) {
          console.log('🔄 Plugin requested retry:', retryDecision.message)
          retryCountRef.current++
          await pluginManager.executeOnRetry(retryCountRef.current, pluginContext)
          handleRetry()
        } else {
          onAnalytics?.({ 
            type: 'processing_failed', 
            timestamp: Date.now(), 
            data: { 
              captureType, 
              error: lastErrorRef.current.message 
            } 
          })
          haptic.notification('error')
          setCurrentState('error')
        }
      }
    } else {
      lastErrorRef.current = new Error(processing.error || 'Unknown error')
      
      // Execute on-error hooks
      const retryDecision = await pluginManager.executeOnError(lastErrorRef.current, pluginContext)
      
      if (retryDecision?.retry) {
        console.log('🔄 Plugin requested retry:', retryDecision.message)
        retryCountRef.current++
        await pluginManager.executeOnRetry(retryCountRef.current, pluginContext)
        handleRetry()
      } else {
        onAnalytics?.({ 
          type: 'processing_failed', 
          timestamp: Date.now(), 
          data: { 
            captureType, 
            error: processing.error || 'Unknown error' 
          } 
        })
        haptic.notification('error') // Error feedback
        setCurrentState('error')
      }
    }
  }, [camera, processing, processingAPI, onCapture, haptic, onAnalytics, captureType, pluginManager, pluginContext])
  
  /**
   * Go back from camera to choice
   */
  const handleBack = useCallback(() => {
    camera.stopCamera()
    setCurrentState('choice')
  }, [camera])
  
  /**
   * Handle cancel from any state
   */
  const handleCancel = useCallback(async () => {
    onAnalytics?.({ type: 'user_cancelled', timestamp: Date.now(), data: { captureType } })
    
    // Execute on-cancel hooks
    await pluginManager.executeOnCancel(pluginContext)
    
    camera.stopCamera()
    onCancel?.()
  }, [camera, onCancel, onAnalytics, captureType, pluginManager, pluginContext])
  
  /**
   * Retry after error
   */
  const handleRetry = useCallback(async () => {
    retryCountRef.current++
    onAnalytics?.({ type: 'retry_attempted', timestamp: Date.now(), data: { captureType } })
    
    // Execute on-retry hooks
    await pluginManager.executeOnRetry(retryCountRef.current, pluginContext)
    
    processing.reset()
    setCurrentState(autoStartCamera ? 'camera' : 'choice')
  }, [processing, autoStartCamera, onAnalytics, captureType, pluginManager, pluginContext])
  
  /**
   * Auto-start camera if enabled (only once on mount)
   */
  useEffect(() => {
    if (autoStartCamera && currentState === 'camera' && !camera.state.isActive) {
      handleStartCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStartCamera, currentState, camera.state.isActive])
  
  // Note: Cleanup is handled by useCamera hook's internal useEffect
  // No need to duplicate cleanup here as it creates dependency issues
  
  // =========================================================================
  // RENDER: State machine renders appropriate view
  // =========================================================================
  
  // Processing state
  if (currentState === 'processing' || processing.isProcessing) {
    return (
      <ProcessingModal 
        isOpen={true} 
        captureType={captureType} 
      />
    )
  }
  
  // Error state
  if (currentState === 'error' || camera.state.error || processing.error) {
    const errorMessage = 
      camera.state.error || 
      processing.error || 
      'An unexpected error occurred'
    
    return (
      <ErrorModal
        isOpen={true}
        error={errorMessage}
        captureType={captureType}
        onRetry={handleRetry}
        onCancel={handleCancel}
      />
    )
  }
  
  // Camera active (full-screen)
  if (currentState === 'camera') {
    // Get plugin UI elements
    const pluginOverlays = pluginManager.executeRenderOverlay(pluginContext)
    const pluginToolbar = pluginManager.executeRenderToolbar(null, pluginContext)
    
    return (
      <CameraView
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        isProcessing={processing.isProcessing}
        instructions={instructions}
        frameGuide={frameGuide}
        isMobile={isMobile}
        onCapture={handleCapture}
        onBack={handleBack}
        pluginOverlays={pluginOverlays}
        pluginToolbar={pluginToolbar}
      />
    )
  }
  
  // Camera starts automatically - no choice!
  return null
}
