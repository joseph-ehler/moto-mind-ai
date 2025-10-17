// FilePreview Component - Public API
export { FilePreview } from '../utilities/FilePreview'
export { detectFileType } from './utils'
export type {
  FilePreviewProps,
  PreviewFile,
  Annotation,
  FileType,
  AIVisionData,
  AIProcessingStatus
} from './types'

// Re-export components for advanced usage
export { AIStatusBadge } from './components/AIStatusBadge'
export { AIInsightsPanel } from './components/AIInsightsPanel'
export { ProcessingOverlay } from './components/ProcessingOverlay'
