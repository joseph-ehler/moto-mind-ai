/**
 * OdometerReader Component
 * 
 * Layer 3: Domain-specific wrapper for odometer reading
 * Thin wrapper with odometer-specific types and defaults
 */

'use client'

import React from 'react'
import { UnifiedCameraCapture } from '../core/UnifiedCameraCapture'
import type { CaptureResult } from '../types'

// ============================================================================
// ODOMETER-SPECIFIC TYPES
// ============================================================================

export interface OdometerData {
  current_mileage: number
  trip_meter?: number
  fuel_level?: number
  display_type?: 'digital' | 'analog'
  unit?: 'miles' | 'kilometers'
  confidence?: number
}

export interface OdometerReaderProps {
  onMileageRead: (data: OdometerData) => void
  onCancel?: () => void
  vehicleId?: string
  title?: string
  allowFileUpload?: boolean
}

// ============================================================================
// ODOMETER READER
// ============================================================================

/**
 * Odometer Reader - Specialized for dashboard mileage reading
 * 
 * Features:
 * - Circular frame guide for dashboard displays
 * - Handles both digital and analog displays
 * - Type-safe mileage data return
 */
export function OdometerReader({
  onMileageRead,
  onCancel,
  vehicleId,
  title = 'Read Current Mileage',
  allowFileUpload = true
}: OdometerReaderProps) {
  
  const handleCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      // Extract odometer data with type safety
      const odometerData: OdometerData = {
        current_mileage: result.data.current_mileage || 0,
        trip_meter: result.data.trip_meter,
        fuel_level: result.data.fuel_level,
        display_type: result.data.display_type,
        unit: result.data.unit || 'miles',
        confidence: result.confidence
      }
      
      onMileageRead(odometerData)
    }
  }
  
  return (
    <UnifiedCameraCapture
      captureType="odometer"
      frameGuide="odometer-display"
      instructions="Center odometer display in circle"
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
