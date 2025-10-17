// ============================================================================
// TYPES
// ============================================================================

export type FileType = 'pdf' | 'image' | 'document' | 'unknown'

export type AIProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'none'

export interface AIVisionData {
  /** Processing status */
  status: AIProcessingStatus
  /** Extracted text (OCR) */
  extractedText?: string
  /** Identified objects/items */
  detectedObjects?: string[]
  /** AI-generated description */
  description?: string
  /** Identified damage/issues */
  damageDetected?: string[]
  /** Vehicle parts identified */
  parts?: string[]
  /** Confidence score (0-1) */
  confidence?: number
  /** Processing timestamp */
  processedAt?: Date
  /** Error message if failed */
  error?: string
}

export interface PreviewFile {
  /** Unique file ID */
  id: string
  /** File name */
  name: string
  /** File type */
  type: FileType
  /** File URL or data URL */
  url: string
  /** File size in bytes */
  size?: number
  /** MIME type */
  mimeType?: string
  /** Upload date */
  uploadedAt?: Date
  /** File metadata */
  metadata?: Record<string, any>
  /** AI Vision processing data */
  aiVision?: AIVisionData
}

export interface Annotation {
  /** Annotation ID */
  id: string
  /** File ID this annotation belongs to */
  fileId: string
  /** Page number (for PDFs) or position for images */
  page?: number
  /** Position */
  x: number
  y: number
  /** Size */
  width?: number
  height?: number
  /** Annotation text */
  text: string
  /** Author */
  author?: string
  /** Created date */
  createdAt: Date
  /** Updated date */
  updatedAt?: Date
  /** Annotation color */
  color?: string
}

export interface FilePreviewProps {
  /** Files to preview */
  files: PreviewFile[]
  /** Initial file index */
  initialIndex?: number
  /** Display in modal mode */
  modal?: boolean
  /** Modal close handler */
  onClose?: () => void
  /** Download handler */
  onDownload?: (file: PreviewFile) => void
  /** Print handler */
  onPrint?: (file: PreviewFile) => void
  /** Share handler */
  onShare?: (file: PreviewFile) => void
  /** Allow annotations */
  allowAnnotations?: boolean
  /** Annotations array */
  annotations?: Annotation[]
  /** Annotation add handler */
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void
  /** Annotation delete handler */
  onAnnotationDelete?: (annotationId: string) => void
  /** Custom toolbar actions */
  toolbarActions?: React.ReactNode
  /** Maximum zoom level */
  maxZoom?: number
  /** Minimum zoom level */
  minZoom?: number
  /** Zoom step */
  zoomStep?: number
  /** Show thumbnails */
  showThumbnails?: boolean
  /** Additional className */
  className?: string
}
