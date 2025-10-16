/**
 * Capture Feature - Public API
 * 
 * Handles image capture, OCR processing, and document management.
 * Supports fuel receipts, dashboard snapshots, and general document capture.
 * 
 * Architecture:
 * - domain/ - Core types and business logic (FuelReceiptData, flow config)
 * - data/ - API calls for uploads and processing (placeholder)
 * - hooks/ - React hooks for capture workflows
 * - ui/ - 35 capture-related components (camera, modals, review flows)
 * 
 * Key Capabilities:
 * - Camera capture with guidance
 * - OCR text extraction (Tesseract + OpenAI Vision)
 * - Receipt data extraction
 * - Dashboard photo analysis
 * - Document confirmation flows
 * - Batch capture support
 */

// Domain exports (types, flow configuration)
export * from './domain/types'
export * from './domain/flow-config'

// Hooks (capture workflows, state management)
export * from './hooks'

// UI Components (camera, modals, review flows)
export * from './ui'

// Data layer (future)
// export { uploadImage, processWithOCR, getCaptureHistory } from './data'
