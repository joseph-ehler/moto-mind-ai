'use client'

import React from 'react'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

export interface VINData {
  type: 'vin'
  vin: string
  confidence: number
  location_found: string
  characters_visible: number
  quality_assessment: string
}

export interface VINScannerProps {
  onVINDetected: (vinData: VINData) => void
  onCancel?: () => void
  title?: string
}

export function VINScanner({ onVINDetected, onCancel, title = "Scan VIN" }: VINScannerProps) {
  const handleCapture = (result: CaptureResult<VINData>) => {
    if (result.success && result.data) {
      onVINDetected(result.data)
    } else {
      // Handle error - could show error message or retry
      console.error('VIN scanning failed:', result.error)
    }
  }

  return (
    <UnifiedCameraCapture
      captureType="vin"
      frameGuide="vin-plate"
      instructions="Position VIN plate in frame"
      onCapture={handleCapture}
      onCancel={onCancel}
      processingAPI="/api/vision/process"
      title={title}
      allowFileUpload={true}
      cameraConstraints={{
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }}
      maxRetries={3}
    />
  )
}
