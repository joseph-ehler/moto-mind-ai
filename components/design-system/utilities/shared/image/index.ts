/**
 * Shared Image Utilities
 * 
 * Common image processing functions for FileUpload and Vision
 * Includes EXIF orientation handling and advanced compression
 */

// Compression functions
export {
  compressImage,
  compressToTargetSize,
  validateImageFile,
  loadImageFromFile,
  calculateDimensions,
  canvasToBlob,
  fileToDataURL,
  dataURLToFile,
  getImageDimensions,
  isImageFile,
  formatFileSize
} from './compression'

// EXIF utilities
export {
  getExifOrientation,
  applyExifOrientation,
  orientationSwapsDimensions,
  getRotationAngle,
  orientationIncludesMirror,
  ExifOrientation
} from './exif'

// Types
export type {
  ImageFormat,
  CompressionOptions,
  PreprocessingOptions,
  ImageDimensions,
  ProcessingResult
} from './types'
