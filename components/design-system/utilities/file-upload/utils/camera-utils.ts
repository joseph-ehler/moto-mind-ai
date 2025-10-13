/**
 * Camera Utility Functions
 * Helper functions for camera operations
 */

import type { CameraOverlayType } from '../types'

/**
 * Get camera button label based on state and overlay type
 */
export function getCameraButtonLabel(
  isLoading: boolean,
  overlayType: CameraOverlayType
): string {
  if (isLoading) return 'Opening Camera...'

  const labels: Record<CameraOverlayType, string> = {
    vin: 'Scan VIN',
    odometer: 'Scan Odometer',
    'license-plate': 'Scan License Plate',
    document: 'Scan Document',
    none: 'Open Camera'
  }

  return labels[overlayType] || 'Open Camera'
}

/**
 * Get camera error message from error object
 */
export function getCameraErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === 'NotAllowedError') {
      return 'Camera access denied. Please allow camera access in your browser settings and refresh the page.'
    } else if (err.name === 'NotFoundError') {
      return 'No camera found. Please connect a camera and try again.'
    } else if (err.name === 'NotReadableError') {
      return 'Camera is already in use by another application. Close other apps and try again.'
    } else if (err.name === 'NotSupportedError') {
      return 'Camera not supported on this device or browser. Please use a modern browser.'
    } else {
      return err.message || 'Failed to open camera. Please try again.'
    }
  }
  return 'Failed to open camera. Please check your camera and try again.'
}
