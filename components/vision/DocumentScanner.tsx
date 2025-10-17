'use client'

import React from 'react'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

export interface DocumentData {
  type: string
  document_details: {
    date?: string
    total_amount?: number
    currency?: string
    location?: string
    business_name?: string
  }
  extracted_data: Record<string, any>
  vehicle_info?: {
    year?: number
    make?: string
    model?: string
    vin?: string
    license_plate?: string
    odometer?: number
  }
  confidence: number
}

export interface DocumentScannerProps {
  onDocumentProcessed: (documentData: DocumentData) => void
  onCancel?: () => void
  title?: string
  documentType?: 'document' | 'receipt'
}

export function DocumentScanner({ 
  onDocumentProcessed, 
  onCancel, 
  title = "Scan Document",
  documentType = 'document'
}: DocumentScannerProps) {
  const handleCapture = (result: CaptureResult<DocumentData>) => {
    if (result.success && result.data) {
      onDocumentProcessed(result.data)
    } else {
      console.error('Document scanning failed:', result.error)
    }
  }

  const getInstructions = () => {
    switch (documentType) {
      case 'receipt':
        return 'Position receipt in frame'
      default:
        return 'Position document in frame'
    }
  }

  const getFrameGuide = () => {
    switch (documentType) {
      case 'receipt':
        return 'receipt-frame' as const
      default:
        return 'document-frame' as const
    }
  }

  return (
    <UnifiedCameraCapture
      captureType={documentType}
      frameGuide={getFrameGuide()}
      instructions={getInstructions()}
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
