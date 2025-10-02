// Image Compression Utility
// Reduces image size for faster vision processing while maintaining quality

import sharp from 'sharp'

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Compresses image for vision processing
 * Reduces file size while maintaining readability for OCR
 */
export async function compressImageForVision(
  imageBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<{ buffer: Buffer; mimeType: string; originalSize: number; compressedSize: number }> {
  const {
    maxWidth = 1920,    // Good balance for dashboard readability
    maxHeight = 1080,   // Maintains aspect ratio
    quality = 85,       // High quality for text recognition
    format = 'jpeg'     // Best compression for photos
  } = options

  const originalSize = imageBuffer.length

  try {
    let pipeline = sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })

    // Apply format-specific compression
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true })
        break
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 8 })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality })
        break
    }

    const compressedBuffer = await pipeline.toBuffer()
    const compressedSize = compressedBuffer.length

    console.log(`📸 Image compressed: ${originalSize} → ${compressedSize} bytes (${Math.round((1 - compressedSize/originalSize) * 100)}% reduction)`)

    return {
      buffer: compressedBuffer,
      mimeType: `image/${format}`,
      originalSize,
      compressedSize
    }
  } catch (error) {
    console.error('❌ Image compression failed:', error)
    // Fallback to original image
    return {
      buffer: imageBuffer,
      mimeType: 'image/jpeg',
      originalSize,
      compressedSize: originalSize
    }
  }
}

/**
 * Checks if image should be compressed based on size
 */
export function shouldCompressImage(sizeBytes: number): boolean {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB threshold
  return sizeBytes > MAX_SIZE
}
