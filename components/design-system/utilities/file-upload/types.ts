/**
 * FileUpload Component Types
 * Shared types and interfaces for the FileUpload system
 */

import type { FileUploadPlugin } from './plugins/types'

export type FileUploadVariant = 'gallery' | 'sidebar' | 'inline' | 'mobile' | 'auto'
export type CameraOverlayType = 'vin' | 'odometer' | 'license-plate' | 'document' | 'none'
export type ImageQuality = 'low' | 'medium' | 'high' | 'max'

export interface FileUploadProps {
  /** File Upload ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below upload area */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Accepted file types (e.g., "image/*", ".pdf", etc.) */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Current files */
  value?: File[]
  /** Change handler */
  onChange?: (files: File[]) => void
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Show preview for images */
  showPreview?: boolean
  /** Show camera capture button */
  showCamera?: boolean
  /** Camera overlay guide type (VIN, odometer, license plate, document) */
  cameraOverlay?: CameraOverlayType
  /** Enable auto-capture for simple items (VIN, license plate, etc) */
  enableAutoCapture?: boolean
  /** Enable OCR enhancement for 90%+ accuracy (Phase 2 - adds ~2MB bundle) */
  enableOCR?: boolean
  /** Enable batch capture mode for multiple sequential photos */
  enableBatchMode?: boolean
  /** Auto-capture confidence threshold (0.0 - 1.0, default: 0.8) */
  autoCaptureConfidenceThreshold?: number
  /** Callback for detection results (visual feedback) */
  onDetectionResult?: (result: DetectionResult) => void
  /** Image compression quality (low: 0.6, medium: 0.8, high: 0.9, max: 1.0) */
  imageQuality?: ImageQuality
  /** Maximum image dimensions for compression {width, height} */
  maxDimensions?: { width: number; height: number }
  /** Upload progress callback (percent: 0-100, fileIndex) */
  onUploadProgress?: (progress: number, fileIndex: number) => void
  /** Variant: gallery (default), sidebar, inline, mobile, or auto (responsive) */
  variant?: FileUploadVariant
  /** Additional className */
  className?: string
  
  // Plugin System
  /** Plugins to extend functionality */
  plugins?: FileUploadPlugin[]
  /** Plugin event handler */
  onPluginEvent?: (event: string, data: any) => void
}

export interface DetectionResult {
  detected: boolean
  confidence: number
  type: CameraOverlayType
  reason?: string
  timestamp: number
}

export interface CameraState {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  stream: MediaStream | null
  facingMode: 'user' | 'environment'
}

export interface AutoCaptureState {
  isActive: boolean
  detectionActive: boolean
  countdown: number | null
  consecutiveDetections: number
}

export interface ProcessingProgress {
  current: number
  total: number
  action: 'compressing' | 'processing'
}
