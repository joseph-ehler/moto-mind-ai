/**
 * Vision System - Complete Export
 * 
 * Unified camera capture and AI vision processing system
 * 
 * Architecture:
 * - Layer 1: Hooks (functional core - pure logic)
 * - Layer 2: UnifiedCameraCapture (configurable base)
 * - Layer 3: Scanners (domain-specific wrappers)
 */

// ============================================================================
// LAYER 1: HOOKS (Functional Core)
// ============================================================================

export { useCamera, useVisionProcessing, useBatchCapture, useImagePreprocessing, useIsMobile } from './hooks'
export type { 
  UseCameraOptions, 
  UseCameraReturn,
  UseVisionProcessingReturn,
  UseBatchCaptureReturn,
  BatchCaptureOptions,
  CapturedPage
} from './hooks'

// ============================================================================
// LAYER 2: CORE COMPONENTS (Configurable Base)
// ============================================================================

export { UnifiedCameraCapture } from './core'
export { FrameGuide, CameraView, ProcessingModal, ChoiceModal, ErrorModal } from './core'
export type {
  FrameGuideProps,
  CameraViewProps,
  ProcessingModalProps,
  ChoiceModalProps,
  ErrorModalProps
} from './core'

// ============================================================================
// LAYER 3: SCANNERS (Domain-Specific)
// ============================================================================

export { 
  VINScanner,
  OdometerReader,
  LicensePlateScanner,
  DocumentScanner,
  BatchDocumentScanner,
  BatchVisionScanner,
  DriversLicenseScanner,
  InsuranceCardScanner
} from './scanners'

export type{
  VINData,
  VINScannerProps,
  OdometerData,
  OdometerReaderProps,
  LicensePlateData,
  LicensePlateScannerProps,
  DocumentData,
  DocumentScannerProps,
  DocumentType,
  BatchDocumentScannerProps,
  BatchVisionScannerProps,
  DriversLicenseScannerProps,
  InsuranceCardScannerProps
} from './scanners'

// ============================================================================
// SERVICES (Processing)
// ============================================================================

export { VisionProcessingService, useVisionProcessingService } from './services/visionProcessingService'
export type { VisionProcessingServiceOptions } from './services/visionProcessingService'

// NEW: Document Processing Architecture
export { DocumentProcessingService, getDocumentProcessingService } from './services/DocumentProcessingService'
export { ProcessorRegistry, getProcessorRegistry } from './services/ProcessorRegistry'
export { registerAllProcessors } from './processors'
export { vinProcessor, licensePlateProcessor } from './processors'
export type { VINData as ProcessorVINData, EnrichedVINData, LicensePlateData as ProcessorLicensePlateData } from './processors'
export type { 
  DocumentType as ProcessorDocumentType,
  DocumentProcessor,
  DocumentProcessingResult,
  BatchProcessingResult,
  ValidationResult,
  ProcessingContext
} from './types/document'

// ============================================================================
// COMPONENTS (Shared UI)
// ============================================================================

export { PageGallery } from './components'
export type { PageGalleryProps } from './components'

export { SimpleCameraUpload } from './SimpleCameraUpload'
export type { SimpleCameraUploadProps } from './SimpleCameraUpload'

// ============================================================================
// HELPERS (Form Integration)
// ============================================================================

export { VINField, FormScannerField } from './helpers'
export type { VINFieldProps, FormScannerFieldProps } from './helpers'

// ============================================================================
// UTILITIES (Error Messages)
// ============================================================================

export { getErrorGuidance, formatErrorMessage } from './utils/error-messages'
export type { ErrorGuidance } from './utils/error-messages'

// ============================================================================
// TYPES
// ============================================================================

export type {
  CaptureType,
  CaptureState,
  FrameGuideType,
  CaptureResult,
  CameraConstraints,
  CameraState,
  UnifiedCameraCaptureProps,
  VisionProcessingOptions,
  VisionProcessingResult,
  AnalyticsEvent,
  AnalyticsEventType,
  MockVisionOptions
} from './types'
