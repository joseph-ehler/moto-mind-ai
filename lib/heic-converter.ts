/**
 * HEIC/HEIF to JPEG Converter
 * 
 * Converts iOS HEIC images to JPEG for processing
 * - Detects HEIC/HEIF files
 * - Converts to JPEG with high quality
 * - Preserves dimensions
 * - Handles errors gracefully
 */

import heicConvert from 'heic-convert'

/**
 * Check if file is HEIC/HEIF format
 */
export function isHEICFile(file: File): boolean {
  // Check MIME type
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return true
  }
  
  // Check file extension (fallback for browsers that don't set MIME type)
  const fileName = file.name.toLowerCase()
  return fileName.endsWith('.heic') || fileName.endsWith('.heif')
}

/**
 * Convert HEIC/HEIF file to JPEG
 */
export async function convertHEICToJPEG(file: File): Promise<File> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Convert ArrayBuffer to Uint8Array (required by heic-convert)
    const inputBuffer = new Uint8Array(arrayBuffer)
    
    // Convert HEIC to JPEG
    const outputBuffer = await heicConvert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 0.92 // High quality to preserve detail
    })
    
    // Create new File from converted buffer
    const jpegFile = new File(
      [outputBuffer],
      file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
      { 
        type: 'image/jpeg',
        lastModified: file.lastModified
      }
    )
    
    return jpegFile
  } catch (error) {
    console.error('HEIC conversion error:', error)
    
    // Provide helpful error message
    if (error instanceof Error) {
      throw new Error(`HEIC conversion failed: ${error.message}. Please use the camera to take a new photo or select a JPEG/PNG image.`)
    }
    
    throw new Error('Failed to convert HEIC image. Please use the camera to take a new photo or select a JPEG/PNG image.')
  }
}

/**
 * Process file - convert HEIC if needed, otherwise return as-is
 */
export async function processImageFile(file: File): Promise<File> {
  if (isHEICFile(file)) {
    console.log('Converting HEIC to JPEG:', file.name)
    return await convertHEICToJPEG(file)
  }
  
  return file
}

/**
 * Get file size reduction from HEIC to JPEG
 * (For analytics - HEIC is typically 50% smaller than JPEG)
 */
export function estimateHEICCompression(jpegSize: number): number {
  // HEIC is typically 40-60% smaller than equivalent JPEG
  // This estimates what the original HEIC size would have been
  return Math.round(jpegSize * 0.5)
}
