/**
 * VINScanner Component
 * 
 * Layer 3: Domain-specific wrapper for VIN scanning
 * Thin wrapper with VIN-specific types and defaults
 */

'use client'

import React from 'react'
import { UnifiedCameraCapture } from '../core/UnifiedCameraCapture'
import type { CaptureResult } from '../types'

// ============================================================================
// VIN-SPECIFIC TYPES
// ============================================================================

export interface VINData {
  vin: string
  location?: string
  confidence?: number
  character_quality?: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface VINScannerProps {
  onVINDetected: (data: VINData) => void
  onCancel?: () => void
  vehicleId?: string
  title?: string
  plugins?: any[] // Vision plugins
  onPluginEvent?: (event: string, data: any) => void
}

// ============================================================================
// VIN SCANNER
// ============================================================================

/**
 * VIN Scanner - Specialized for Vehicle Identification Numbers
 * 
 * Features:
 * - Optimized frame guide for VIN plates
 * - High-res camera for small text
 * - Type-safe VIN data return
 */
export function VINScanner({
  onVINDetected,
  onCancel,
  vehicleId,
  title = 'Scan VIN Number',
  plugins,
  onPluginEvent
}: VINScannerProps) {
  
  const handleCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      // Extract VIN data with type safety and include enriched data from plugins
      const vinData: VINData = {
        vin: result.data.vin || '',
        location: result.data.location,
        confidence: result.confidence,
        character_quality: result.data.character_quality,
        // Include enriched data from plugins
        ...result.data
      }
      
      onVINDetected(vinData as any)
    }
  }
  
  return (
    <UnifiedCameraCapture
      captureType="vin"
      frameGuide="vin-plate"
      instructions="Position VIN plate in center of frame"
      onCapture={handleCapture}
      onCancel={onCancel}
      processingAPI="/api/vision/process"
      vehicleId={vehicleId}
      title={title}
      plugins={plugins}
      onPluginEvent={onPluginEvent}
      autoStartCamera={true}
      mock={{ enabled: true }} // Enable mock mode for testing
      cameraConstraints={{
        facingMode: 'environment',
        width: { ideal: 1920 }, // High res for small text
        height: { ideal: 1080 }
      }}
      maxRetries={3}
    />
  )
}
