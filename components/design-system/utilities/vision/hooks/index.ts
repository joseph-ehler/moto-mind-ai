/**
 * Vision Hooks
 * Functional core - Pure logic extracted from UI
 */

export { useCamera } from './useCamera'
export { useVisionProcessing } from './useVisionProcessing'
export { useHaptic, HAPTIC_PATTERNS } from './useHaptic'
export { useImagePreprocessing } from './useImagePreprocessing'
export { useBatchCapture } from './useBatchCapture'
export { useIsMobile } from './useIsMobile'
export type { UseCameraOptions, UseCameraReturn } from './useCamera'
export type { UseVisionProcessingReturn } from './useVisionProcessing'
export type { UseHapticReturn } from './useHaptic'
export type { UseImagePreprocessingOptions, UseImagePreprocessingReturn } from './useImagePreprocessing'
export type { UseBatchCaptureReturn, BatchCaptureOptions, CapturedPage } from './useBatchCapture'
