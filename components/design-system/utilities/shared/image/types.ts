/**
 * Shared Image Processing Types
 */

export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface CompressionOptions {
  /** Target quality (0.0 - 1.0) */
  quality?: number
  
  /** Maximum width */
  maxWidth?: number
  
  /** Maximum height */
  maxHeight?: number
  
  /** Output format */
  format?: ImageFormat
  
  /** Maintain aspect ratio */
  maintainAspectRatio?: boolean
  
  /** Auto-rotate based on EXIF orientation */
  autoRotate?: boolean
  
  /** Strip EXIF metadata */
  stripMetadata?: boolean
  
  /** Return base64 data URL instead of File */
  outputBase64?: boolean
}

export interface PreprocessingOptions extends CompressionOptions {
  /** Target file size in bytes (will reduce quality iteratively) */
  targetSize?: number
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface ProcessingResult {
  /** Compressed file (if outputBase64 is false) */
  file?: File
  
  /** Base64 data URL (if outputBase64 is true) */
  base64?: string
  
  /** Original file size */
  originalSize: number
  
  /** Compressed size */
  compressedSize: number
  
  /** Compression ratio (compressed / original) */
  compressionRatio: number
  
  /** Compression percentage saved */
  compressionPercentage: number
  
  /** Original dimensions */
  originalDimensions: ImageDimensions
  
  /** Processed dimensions */
  processedDimensions: ImageDimensions
  
  /** Output format */
  format: string
  
  /** Whether image was rotated */
  rotated: boolean
  
  /** EXIF orientation value */
  orientation: number
}
