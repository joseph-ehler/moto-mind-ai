/**
 * Shared Camera Types
 * 
 * Common types used across camera implementations
 */

export type CameraFacingMode = 'user' | 'environment'

export interface CameraConstraints {
  facingMode?: CameraFacingMode
  width?: { ideal: number; max?: number; min?: number }
  height?: { ideal: number; max?: number; min?: number }
}

export interface CameraOptions {
  /** Initial facing mode */
  facingMode?: CameraFacingMode
  
  /** Custom camera constraints */
  constraints?: MediaStreamConstraints
  
  /** Error callback */
  onError?: (error: CameraError) => void
  
  /** Success callback when camera opens */
  onOpen?: () => void
  
  /** Callback when camera closes */
  onClose?: () => void
}

export interface CameraError {
  name: string
  message: string
  type: 'permission' | 'not-found' | 'in-use' | 'not-supported' | 'unknown'
}

export interface CameraState {
  /** Is camera currently active */
  isActive: boolean
  
  /** Is camera loading/initializing */
  isLoading: boolean
  
  /** Current error if any */
  error: CameraError | null
  
  /** Current media stream */
  stream: MediaStream | null
  
  /** Current facing mode */
  facingMode: CameraFacingMode
}

export interface CameraControls {
  /** Start/open the camera */
  start: () => Promise<void>
  
  /** Stop/close the camera */
  stop: () => void
  
  /** Switch between front/back camera */
  switch: () => Promise<void>
  
  /** Retry after error */
  retry: () => Promise<void>
}

export interface CameraRefs {
  /** Video element ref */
  videoRef: React.RefObject<HTMLVideoElement>
  
  /** Canvas element ref (for capture) */
  canvasRef: React.RefObject<HTMLCanvasElement>
}
