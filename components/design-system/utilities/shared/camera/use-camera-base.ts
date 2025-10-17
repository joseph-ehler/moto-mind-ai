'use client'

/**
 * Base Camera Hook
 * 
 * Shared camera logic for both FileUpload and Vision systems.
 * Handles camera access, stream management, error handling, and cleanup.
 * 
 * @example
 * ```tsx
 * const camera = useCameraBase({
 *   facingMode: 'environment',
 *   onError: (error) => console.error(error),
 *   onOpen: () => console.log('Camera opened')
 * })
 * 
 * <video ref={camera.videoRef} autoPlay playsInline />
 * <button onClick={camera.start}>Open Camera</button>
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type {
  CameraOptions,
  CameraState,
  CameraControls,
  CameraRefs,
  CameraError,
  CameraFacingMode
} from './types'
import { getCameraError } from './utils'

export interface UseCameraBaseReturn extends CameraState, CameraControls, CameraRefs {}

export function useCameraBase(options: CameraOptions = {}): UseCameraBaseReturn {
  const {
    facingMode: initialFacingMode = 'environment',
    constraints: customConstraints,
    onError,
    onOpen,
    onClose
  } = options
  
  // State
  const [state, setState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null,
    facingMode: initialFacingMode
  })
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const allStreamsRef = useRef<MediaStream[]>([])
  
  /**
   * Stop all camera streams
   */
  const stop = useCallback(() => {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Stop all tracked streams
    allStreamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop())
    })
    allStreamsRef.current = []
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setState(prev => ({
      ...prev,
      isActive: false,
      isLoading: false,
      stream: null,
      error: null
    }))
    
    onClose?.()
  }, [onClose])
  
  /**
   * Start camera with specified constraints
   */
  const start = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Stop any existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Build constraints
      const constraints: MediaStreamConstraints = customConstraints || {
        video: {
          facingMode: state.facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Track stream for cleanup
      streamRef.current = stream
      allStreamsRef.current.push(stream)
      
      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play()
              resolve()
            }
          }
        })
      }
      
      setState(prev => ({
        ...prev,
        isActive: true,
        isLoading: false,
        stream,
        error: null
      }))
      
      onOpen?.()
      
    } catch (err) {
      const cameraError = getCameraError(err)
      
      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: cameraError
      }))
      
      onError?.(cameraError)
    }
  }, [state.facingMode, customConstraints, onOpen, onError])
  
  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    const newFacingMode: CameraFacingMode = 
      state.facingMode === 'environment' ? 'user' : 'environment'
    
    // Update facing mode
    setState(prev => ({ ...prev, facingMode: newFacingMode }))
    
    // Close current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    // Open with new facing mode (state will be updated, triggering start)
    // We need to manually trigger start with new facing mode
    setState(prev => ({ ...prev, isLoading: true }))
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      })
      
      streamRef.current = stream
      allStreamsRef.current.push(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setState(prev => ({
        ...prev,
        isActive: true,
        isLoading: false,
        stream,
        facingMode: newFacingMode
      }))
      
    } catch (err) {
      const cameraError = getCameraError(err)
      setState(prev => ({
        ...prev,
        isActive: false,
        isLoading: false,
        error: cameraError
      }))
      onError?.(cameraError)
    }
  }, [state.facingMode, onError])
  
  /**
   * Retry after error
   */
  const retry = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }))
    await start()
  }, [start])
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Direct cleanup without calling stop to avoid circular dependency
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      allStreamsRef.current.forEach(stream => {
        stream.getTracks().forEach(track => track.stop())
      })
      allStreamsRef.current = []
      
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])
  
  return {
    // State
    ...state,
    
    // Controls
    start,
    stop,
    switch: switchCamera,
    retry,
    
    // Refs
    videoRef,
    canvasRef
  }
}
