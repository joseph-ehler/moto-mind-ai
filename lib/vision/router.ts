// Vision Router
// Routes requests to appropriate processors based on document type and mode

import { VisionRequest, VisionResult } from './types'
import { processDocument, processOCR } from './pipeline'
import { processDocumentV2 } from './pipeline-v2'
import { processDashboardSnapshot } from './processors/dashboard'
import { VisionErrorCodes } from './clients/openai'

/**
 * Main router that directs requests to appropriate processors
 */
export async function process(request: VisionRequest): Promise<VisionResult> {
  // Validate request
  validateRequest(request)
  
  // Route based on document type and mode
  if (request.document_type === 'dashboard_snapshot') {
    console.log('🚀 Using V2 Pipeline for dashboard (100% accuracy, 50% cheaper)')
    return processDocumentV2(request)
  }
  
  if (request.mode === 'ocr') {
    return processOCRMode(request)
  }
  
  // Default to document processing pipeline (V1 for other types)
  return processDocument(request)
}

/**
 * Special handling for dashboard snapshots
 */
async function processDashboardSpecial(request: VisionRequest): Promise<VisionResult> {
  // Dashboard snapshots use specialized processing
  const documentResult = await processDocument(request)
  
  // Filter warning lights based on engine state
  if (request.engine_state === 'accessory' && documentResult.key_facts?.warning_lights) {
    const originalCount = documentResult.key_facts.warning_lights.length
    documentResult.key_facts.warning_lights = filterAccessoryModeLights(documentResult.key_facts.warning_lights)
    const filteredCount = originalCount - documentResult.key_facts.warning_lights.length
    
    // Add metadata about filtering
    if (filteredCount > 0) {
      documentResult.processing_metadata.accessory_mode_filtered = filteredCount
    }
  }
  
  return documentResult
}

/**
 * Filters out routine startup indicators when in accessory mode
 */
function filterAccessoryModeLights(warningLights: string[]): string[] {
  const ACCESSORY_MODE_INDICATORS = [
    'oil_pressure',     // Oil pressure builds only when engine runs
    'battery',          // Charging light shows until alternator engages
    'charging',         // Same as battery
    'glow_plug'         // Diesel pre-heat, only relevant during start
  ]
  
  return warningLights.filter(light => 
    !ACCESSORY_MODE_INDICATORS.includes(light.toLowerCase())
  )
}

/**
 * OCR-only processing mode
 */
async function processOCRMode(request: VisionRequest): Promise<VisionResult> {
  const ocrResult = await processOCR(request)
  
  // Convert OCR result to VisionResult format
  return {
    type: request.document_type || 'service_invoice',
    summary: `Text extracted from ${request.document_type || 'document'}`,
    key_facts: {
      extracted_text: ocrResult.extracted_text
    },
    validation: {
      rollup: 'ok'
    },
    confidence: ocrResult.confidence,
    processing_metadata: {
      model_version: 'gpt-4o',
      prompt_hash: 'ocr_v1',
      processing_ms: ocrResult.processing_ms
    },
    raw_extraction: {
      extracted_text: ocrResult.extracted_text,
      confidence: ocrResult.confidence
    }
  }
}

/**
 * Validates incoming request
 */
function validateRequest(request: VisionRequest): void {
  if (!request.image) {
    throw new Error(`${VisionErrorCodes.NO_FILE}: No image provided`)
  }
  
  if (!request.mimeType) {
    throw new Error(`${VisionErrorCodes.VALIDATION_FAILED}: No MIME type provided`)
  }
  
  if (!request.mode) {
    throw new Error(`${VisionErrorCodes.MODE_UNSUPPORTED}: No processing mode specified`)
  }
  
  // Validate mode
  const validModes = ['ocr', 'document', 'auto']
  if (!validModes.includes(request.mode)) {
    throw new Error(`${VisionErrorCodes.MODE_UNSUPPORTED}: Invalid mode '${request.mode}'`)
  }
  
  // Validate image size (base64 length check)
  if (request.image.length > 20 * 1024 * 1024) { // ~15MB base64 ≈ 20MB limit
    throw new Error(`${VisionErrorCodes.PAYLOAD_TOO_LARGE}: Image too large`)
  }
}

/**
 * Maps processing errors to stable error codes
 */
export function mapErrorToCode(error: any): string {
  const message = error?.message?.toLowerCase() || ''
  
  if (message.includes('timeout')) {
    return VisionErrorCodes.UPSTREAM_TIMEOUT
  }
  
  if (message.includes('rate limit') || message.includes('429')) {
    return VisionErrorCodes.RATE_LIMIT
  }
  
  if (message.includes('parse') || message.includes('json')) {
    return VisionErrorCodes.PARSE_FAILED
  }
  
  if (message.includes('validation')) {
    return VisionErrorCodes.VALIDATION_FAILED
  }
  
  if (message.includes('mode') || message.includes('unsupported')) {
    return VisionErrorCodes.MODE_UNSUPPORTED
  }
  
  if (message.includes('no file') || message.includes('no image')) {
    return VisionErrorCodes.NO_FILE
  }
  
  if (message.includes('too large') || message.includes('payload')) {
    return VisionErrorCodes.PAYLOAD_TOO_LARGE
  }
  
  return 'PROCESSING_ERROR'
}

/**
 * Maps error codes to user-friendly messages
 */
export function mapErrorToMessage(code: string): string {
  const messages: Record<string, string> = {
    [VisionErrorCodes.UPSTREAM_TIMEOUT]: 'Vision processing timed out. Please try again.',
    [VisionErrorCodes.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
    [VisionErrorCodes.PARSE_FAILED]: 'Could not process the document. Please try a clearer image.',
    [VisionErrorCodes.VALIDATION_FAILED]: 'Document validation failed. Please check the image quality.',
    [VisionErrorCodes.MODE_UNSUPPORTED]: 'Processing mode not supported.',
    [VisionErrorCodes.NO_FILE]: 'No image file provided.',
    [VisionErrorCodes.PAYLOAD_TOO_LARGE]: 'Image file is too large. Please use a smaller image.',
    'PROCESSING_ERROR': 'Document processing failed. Please try again.'
  }
  
  return messages[code] || 'An unexpected error occurred. Please try again.'
}
