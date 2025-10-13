/**
 * Shared Camera Module
 * 
 * Base camera functionality shared between FileUpload and Vision systems
 */

export { useCameraBase } from './use-camera-base'
export type { UseCameraBaseReturn } from './use-camera-base'

export type {
  CameraFacingMode,
  CameraConstraints,
  CameraOptions,
  CameraError,
  CameraState,
  CameraControls,
  CameraRefs
} from './types'

export {
  getCameraError,
  getCameraErrorGuidance,
  isCameraSupported,
  getCameraDevices,
  hasMultipleCameras
} from './utils'
