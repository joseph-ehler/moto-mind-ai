/**
 * useCamera Hook
 * 
 * Vision-specific camera hook that extends the shared camera base.
 * Adds frame capture functionality for vision processing.
 * 
 * Architecture: Functional core, imperative shell
 * Refactored to use shared camera foundation
 */

import { useCallback } from 'react'
import { useCameraBase } from '../../shared/camera'
import type { CameraConstraints, CameraState } from '../types'

export interface UseCameraOptions {
  constraints?: CameraConstraints
  onError?: (error: string) => void
}

export interface UseCameraReturn {
  // State
  state: CameraState
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  
  // Actions
  startCamera: () => Promise<void>
  stopCamera: () => void
  captureFrame: () => string | null
  
  // Utilities
  isReady: boolean
}

/**
 * Camera lifecycle management hook
 * Extends shared camera base with Vision-specific frame capture
 */
export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { constraints, onError } = options
  
  // Use shared camera base
  const camera = useCameraBase({
    facingMode: constraints?.facingMode || 'environment',
    constraints: constraints ? {
      video: {
        facingMode: constraints.facingMode || 'environment',
        width: constraints.width || { ideal: 1920 },
        height: constraints.height || { ideal: 1080 }
      },
      audio: false
    } : undefined,
    onError: (error) => {
      console.error('❌ Camera error:', error)
      onError?.(error.message)
    },
    onOpen: () => {
      console.log('✅ Camera started successfully')
    },
    onClose: () => {
      console.log('📹 Camera stopped')
    }
  })
  
  /**
   * Capture current frame as base64 image
   * Vision-specific functionality
   */
  const captureFrame = useCallback((): string | null => {
    console.log('📸 Capturing frame...')
    
    if (!camera.videoRef.current || !camera.canvasRef.current) {
      console.error('❌ Missing video or canvas ref')
      return null
    }
    
    const video = camera.videoRef.current
    const canvas = camera.canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) {
      console.error('❌ Failed to get canvas context')
      return null
    }
    
    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw current video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      
      console.log('✅ Frame captured:', {
        width: canvas.width,
        height: canvas.height,
        dataLength: imageData.length
      })
      
      return imageData
      
    } catch (err) {
      console.error('❌ Capture failed:', err)
      return null
    }
  }, [camera.videoRef, camera.canvasRef])
  
  // Map shared camera state to Vision's CameraState format
  const visionState: CameraState = {
    isActive: camera.isActive,
    isCapturing: false, // Vision manages this separately
    error: camera.error?.message || null,
    stream: camera.stream
  }
  
  return {
    state: visionState,
    videoRef: camera.videoRef,
    canvasRef: camera.canvasRef,
    startCamera: camera.start,
    stopCamera: camera.stop,
    captureFrame,
    isReady: camera.isActive && !camera.isLoading && !camera.error
  }
}
