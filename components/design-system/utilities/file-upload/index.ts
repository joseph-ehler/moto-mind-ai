/**
 * FileUpload Component - Barrel Export
 * Central export point for all FileUpload functionality
 */

// Main component (will be created next)
export { FileUpload } from './FileUpload'

// Types
export type {
  FileUploadProps,
  FileUploadVariant,
  CameraOverlayType,
  ImageQuality,
  DetectionResult,
  CameraState,
  AutoCaptureState,
  ProcessingProgress
} from './types'

// Hooks
export { useCameraStream } from './hooks/useCameraStream'
export { useAutoCapture } from './hooks/useAutoCapture'
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
export { useCompressionWorker } from './hooks/useCompressionWorker'

// Utils
export { formatFileSize, isImage, getFileIconType } from './utils/file-utils'
export { getCameraButtonLabel, getCameraErrorMessage } from './utils/camera-utils'

// Detection (for external use if needed)
export { runAutoDetection } from './detection/auto-capture-detection'
export type { DetectionResult as AutoCaptureDetectionResult } from './detection/auto-capture-detection'
