/**
 * useCameraStream Hook
 * FileUpload-specific camera hook that extends the shared camera base.
 * Adds haptic feedback and FileUpload-specific error handling.
 * 
 * Refactored to use shared camera foundation
 */

import { useCameraBase, getCameraErrorGuidance } from '../../shared/camera'
import type { CameraState } from '../types'

export interface UseCameraStreamOptions {
  onError?: (error: string) => void
  onOpen?: () => void
  onClose?: () => void
}

export function useCameraStream(options: UseCameraStreamOptions = {}) {
  // Use shared camera base
  const camera = useCameraBase({
    facingMode: 'environment',
    onError: (error) => {
      console.error('Camera error:', error)
      
      // Get user-friendly message
      const errorMessage = error.message
      options.onError?.(errorMessage)
      
      // Haptic feedback for error (FileUpload-specific)
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]) // Error pattern
      }
    },
    onOpen: () => {
      options.onOpen?.()
    },
    onClose: () => {
      options.onClose?.()
    }
  })
  
  // Return FileUpload-compatible interface
  return {
    isOpen: camera.isActive,
    isLoading: camera.isLoading,
    error: camera.error?.message || null,
    stream: camera.stream,
    facingMode: camera.facingMode,
    videoRef: camera.videoRef,
    open: camera.start,
    close: camera.stop,
    switchCamera: camera.switch,
    retry: camera.retry
  }
}
