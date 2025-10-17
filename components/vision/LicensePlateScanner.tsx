'use client'

import React from 'react'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

export interface LicensePlateData {
  type: 'license_plate'
  plate_number: string
  state?: string
  plate_type?: string
  expiration_date?: string
  vehicle_info?: {
    color?: string
    make?: string
    model?: string
    body_type?: string
  }
  confidence: number
  plate_condition?: string
}

export interface LicensePlateScannerProps {
  onPlateDetected: (plateData: LicensePlateData) => void
  onCancel?: () => void
  title?: string
}

export function LicensePlateScanner({ 
  onPlateDetected, 
  onCancel, 
  title = "Scan License Plate" 
}: LicensePlateScannerProps) {
  const handleCapture = (result: CaptureResult<LicensePlateData>) => {
    if (result.success && result.data) {
      onPlateDetected(result.data)
    } else {
      console.error('License plate scanning failed:', result.error)
    }
  }

  return (
    <UnifiedCameraCapture
      captureType="license_plate"
      frameGuide="license-plate"
      instructions="Center license plate in frame"
      onCapture={handleCapture}
      onCancel={onCancel}
      processingAPI="/api/vision/process"
      title={title}
      allowFileUpload={true}
      cameraConstraints={{
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }}
      maxRetries={2}
    />
  )
}
