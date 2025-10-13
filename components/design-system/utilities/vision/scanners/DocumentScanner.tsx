/**
 * DocumentScanner Component
 * 
 * Layer 3: Domain-specific wrapper for document scanning
 * Thin wrapper with document-specific types and defaults
 */

'use client'

import React from 'react'
import { UnifiedCameraCapture } from '../core/UnifiedCameraCapture'
import type { CaptureResult } from '../types'

// ============================================================================
// DOCUMENT-SPECIFIC TYPES
// ============================================================================

export type DocumentType = 
  | 'receipt' 
  | 'invoice' 
  | 'registration' 
  | 'insurance' 
  | 'service_record'
  | 'generic'

export interface DocumentData {
  document_type: DocumentType
  text_content?: string
  structured_data?: {
    date?: string
    total_amount?: number
    vendor?: string
    vehicle_info?: string
    [key: string]: any
  }
  confidence?: number
}

export interface DocumentScannerProps {
  onDocumentProcessed: (data: DocumentData) => void
  onCancel?: () => void
  vehicleId?: string
  documentType?: DocumentType
  title?: string
  allowFileUpload?: boolean
}

// ============================================================================
// DOCUMENT SCANNER
// ============================================================================

/**
 * Document Scanner - Specialized for document capture and OCR
 * 
 * Features:
 * - Large frame guide for full documents
 * - Handles various document types
 * - Extracts structured data
 * - Type-safe document data return
 */
export function DocumentScanner({
  onDocumentProcessed,
  onCancel,
  vehicleId,
  documentType = 'generic',
  title = 'Scan Document',
  allowFileUpload = true
}: DocumentScannerProps) {
  
  const handleCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      // Extract document data with type safety
      const documentData: DocumentData = {
        document_type: result.data.document_type || documentType,
        text_content: result.data.text_content,
        structured_data: result.data.structured_data || {},
        confidence: result.confidence
      }
      
      onDocumentProcessed(documentData)
    }
  }
  
  // Adjust frame guide based on document type
  const frameGuide = documentType === 'receipt' ? 'receipt-frame' : 'document-frame'
  
  // Customize instructions based on document type
  const getInstructions = () => {
    switch (documentType) {
      case 'receipt':
        return 'Position receipt within frame'
      case 'invoice':
        return 'Position invoice within frame'
      case 'registration':
        return 'Position vehicle registration within frame'
      case 'insurance':
        return 'Position insurance card within frame'
      case 'service_record':
        return 'Position service record within frame'
      default:
        return 'Position document within frame'
    }
  }
  
  return (
    <UnifiedCameraCapture
      captureType={documentType === 'receipt' ? 'receipt' : 'document'}
      frameGuide={frameGuide}
      instructions={getInstructions()}
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
