/**
 * Vision Feature - UI Components
 * 
 * Barrel export for all vision-related UI components.
 * This addresses the internal import issues detected by AI analysis.
 * 
 * Usage:
 *   import { UnifiedCameraCapture, DocumentScanner } from '@/features/vision/ui'
 */

// Camera Components
export { default as UnifiedCameraCapture } from './UnifiedCameraCapture'

// Document Scanning
export { default as DocumentScanner } from './DocumentScanner'
export { default as DocumentScannerModal } from './DocumentScannerModal'

// Specialized Scanners
export { default as LicensePlateScanner } from './LicensePlateScanner'
export { default as VINScanner } from './VINScanner'
export { default as OdometerReader } from './OdometerReader'

// Dashboard Integration
export { default as DashboardCaptureModal } from './DashboardCaptureModal'
export { default as RoutineDashboardCapture } from './RoutineDashboardCapture'

// Utilities & Wrappers
export { default as VisionProcessingWrapper } from './VisionProcessingWrapper'
export { default as VisionErrorBoundary } from './VisionErrorBoundary'
export { default as InlineEditableField } from './InlineEditableField'

// Examples
export { default as VisionExamples } from './VisionExamples'

// Re-export types if they exist
export type * from './UnifiedCameraCapture'
export type * from './DocumentScanner'
export type * from './VisionProcessingWrapper'
