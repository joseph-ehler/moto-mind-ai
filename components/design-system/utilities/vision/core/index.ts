/**
 * Vision Core Components
 * 
 * Reusable building blocks for vision capture UI
 * All use design system primitives - NO raw HTML
 */

// Main component (Layer 2)
export { UnifiedCameraCapture } from './UnifiedCameraCapture'

// Sub-components (can be used independently)
export { FrameGuide } from './FrameGuide'
export type { FrameGuideProps } from './FrameGuide'

export { ProcessingModal } from './ProcessingModal'
export type { ProcessingModalProps } from './ProcessingModal'

export { CameraView } from './CameraView'
export type { CameraViewProps } from './CameraView'

export { ChoiceModal } from './ChoiceModal'
export type { ChoiceModalProps } from './ChoiceModal'

export { ErrorModal } from './ErrorModal'
export type { ErrorModalProps } from './ErrorModal'
