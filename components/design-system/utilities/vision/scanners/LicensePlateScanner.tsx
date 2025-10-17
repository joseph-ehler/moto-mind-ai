/**
 * LicensePlateScanner Component
 * 
 * Layer 3: Domain-specific wrapper for license plate scanning
 * Thin wrapper with license plate-specific types and defaults
 */

'use client'

import React from 'react'
import { UnifiedCameraCapture } from '../core/UnifiedCameraCapture'
import type { CaptureResult } from '../types'

// ============================================================================
// LICENSE PLATE-SPECIFIC TYPES
// ============================================================================

export interface LicensePlateData {
  plate_number: string
  state?: string
  country?: string
  expiration_date?: string
  vehicle_type?: string
  confidence?: number
}

export interface LicensePlateScannerProps {
  onPlateDetected: (data: LicensePlateData) => void
  onCancel?: () => void
  vehicleId?: string
  title?: string
  allowFileUpload?: boolean
}

// ============================================================================
// LICENSE PLATE SCANNER
// ============================================================================

/**
 * License Plate Scanner - Specialized for vehicle registration plates
 * 
 * Features:
 * - Optimized frame guide for plate dimensions
 * - State/country detection
 * - Type-safe plate data return
 */
export function LicensePlateScanner({
  onPlateDetected,
  onCancel,
  vehicleId,
  title = 'Scan License Plate',
  allowFileUpload = true
}: LicensePlateScannerProps) {
  
  const handleCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      // Extract license plate data with type safety
      const plateData: LicensePlateData = {
        plate_number: result.data.plate_number || '',
        state: result.data.state,
        country: result.data.country,
        expiration_date: result.data.expiration_date,
        vehicle_type: result.data.vehicle_type,
        confidence: result.confidence
      }
      
      onPlateDetected(plateData)
    }
  }
  
  return (
    <UnifiedCameraCapture
      captureType="license_plate"
      frameGuide="license-plate"
      instructions="Align license plate within frame"
      onCapture={handleCapture}
      onCancel={onCancel}
      processingAPI="/api/vision/process"
      vehicleId={vehicleId}
      title={title}
      allowFileUpload={allowFileUpload}
      cameraConstraints={{
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }}
      maxRetries={3}
    />
  )
}
