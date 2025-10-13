/**
 * Camera Utilities
 * 
 * Helper functions for camera operations
 */

import type { CameraError } from './types'

/**
 * Convert browser camera error to structured CameraError
 */
export function getCameraError(err: unknown): CameraError {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        name: err.name,
        message: 'Camera access denied. Please allow camera access in your browser settings.',
        type: 'permission'
      }
    }
    
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        name: err.name,
        message: 'No camera found. Please connect a camera and try again.',
        type: 'not-found'
      }
    }
    
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      return {
        name: err.name,
        message: 'Camera is already in use by another application.',
        type: 'in-use'
      }
    }
    
    if (err.name === 'NotSupportedError') {
      return {
        name: err.name,
        message: 'Camera not supported on this device or browser.',
        type: 'not-supported'
      }
    }
    
    return {
      name: err.name,
      message: err.message || 'Failed to access camera.',
      type: 'unknown'
    }
  }
  
  return {
    name: 'UnknownError',
    message: 'An unknown error occurred while accessing the camera.',
    type: 'unknown'
  }
}

/**
 * Get user-friendly error message with actionable guidance
 */
export function getCameraErrorGuidance(error: CameraError): string {
  switch (error.type) {
    case 'permission':
      return 'Please allow camera access in your browser settings and refresh the page.'
    
    case 'not-found':
      return 'Please connect a camera and try again.'
    
    case 'in-use':
      return 'Close other apps using the camera and try again.'
    
    case 'not-supported':
      return 'Please use a modern browser with camera support.'
    
    default:
      return 'Please check your camera and try again.'
  }
}

/**
 * Check if browser supports camera access
 */
export function isCameraSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  )
}

/**
 * Get available camera devices
 */
export async function getCameraDevices(): Promise<MediaDeviceInfo[]> {
  if (!isCameraSupported()) {
    return []
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter(device => device.kind === 'videoinput')
  } catch {
    return []
  }
}

/**
 * Check if device has multiple cameras
 */
export async function hasMultipleCameras(): Promise<boolean> {
  const cameras = await getCameraDevices()
  return cameras.length > 1
}
