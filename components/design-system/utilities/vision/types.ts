/**
 * Vision System Types
 * 
 * Type definitions for the unified vision capture system
 */

// ============================================================================
// CAPTURE TYPES
// ============================================================================

export type CaptureType = 
  | 'document' 
  | 'vin' 
  | 'license_plate' 
  | 'odometer' 
  | 'receipt' 
  | 'dashboard_snapshot'

export type CaptureState = 
  | 'idle' 
  | 'choice' 
  | 'camera' 
  | 'processing' 
  | 'success' 
  | 'error'

// ============================================================================
// FRAME GUIDE TYPES
// ============================================================================

export type FrameGuideType = 
  | 'document-frame'      // Large rectangular for documents
  | 'vin-plate'          // Narrow rectangle for VIN plates  
  | 'license-plate'      // License plate dimensions
  | 'odometer-display'   // Circular/digital display
  | 'receipt-frame'      // Receipt dimensions
  | 'dashboard-cluster'  // Full dashboard view

// ============================================================================
// RESULT TYPES
// ============================================================================

export interface CaptureResult<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  processed_at: string
  metadata?: Record<string, any>
}

// ============================================================================
// CAMERA TYPES
// ============================================================================

export interface CameraConstraints {
  facingMode?: 'user' | 'environment'
  width?: { ideal: number }
  height?: { ideal: number }
}

export interface CameraState {
  isActive: boolean
  isCapturing: boolean
  error: string | null
  stream: MediaStream | null
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

// ============================================================================
// ANALYTICS
// ============================================================================

export type AnalyticsEventType =
  | 'camera_opened'
  | 'camera_started'
  | 'camera_error'
  | 'capture_initiated'
  | 'capture_success'
  | 'capture_failed'
  | 'processing_started'
  | 'processing_success'
  | 'processing_failed'
  | 'user_cancelled'
  | 'retry_attempted'
  | 'file_uploaded'

export interface AnalyticsEvent {
  type: AnalyticsEventType
  timestamp: number
  data?: {
    captureType?: CaptureType
    duration?: number
    error?: string
    confidence?: number
    retryCount?: number
    [key: string]: any
  }
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface UnifiedCameraCaptureProps {
  // Core configuration
  captureType: CaptureType
  frameGuide: FrameGuideType
  instructions: string
  
  // Callbacks
  onCapture: (result: CaptureResult) => void
  onCancel?: () => void
  onAnalytics?: (event: AnalyticsEvent) => void
  onPluginEvent?: (event: string, data: any) => void
  
  // Processing
  processingAPI: string
  vehicleId?: string
  
  // UI customization
  title?: string
  // allowFileUpload removed - use BatchVisionScanner for file uploads
  
  // Advanced options
  cameraConstraints?: CameraConstraints
  maxRetries?: number
  autoStartCamera?: boolean
  mock?: MockVisionOptions
  enablePreprocessing?: boolean
  preprocessingOptions?: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
    autoRotate?: boolean
    stripMetadata?: boolean
  }
  
  // Plugin system
  plugins?: any[] // VisionPlugin[] - any to avoid circular dependency
}

// ============================================================================
// VISION PROCESSING
// ============================================================================

export interface MockVisionOptions<T = any> {
  enabled: boolean
  delay?: number
  data?: T
  confidence?: number
  shouldFail?: boolean
  failureRate?: number // 0-1, probability of failure
}

export interface VisionProcessingOptions {
  type: CaptureType
  vehicleId?: string
  maxRetries?: number
  mock?: MockVisionOptions
}

export interface VisionProcessingResult<T = any> extends CaptureResult<T> {
  raw_response?: any
  processing_time_ms?: number
}
