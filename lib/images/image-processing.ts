/**
 * Image Processing Utilities
 * 
 * Compression, resizing, quality analysis
 */

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  targetSizeKB?: number
  minQuality?: number
  format?: 'image/jpeg' | 'image/webp'
}

interface CompressionResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  quality: number
  width: number
  height: number
}

/**
 * Compress image to target size
 */
export async function compressImage(
  blob: Blob,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    targetSizeKB = 500,
    minQuality = 0.3,
    format = 'image/jpeg'
  } = options

  const originalSize = blob.size

  // Load image
  const img = await loadImage(blob)
  
  // Calculate resize dimensions
  const { width, height } = calculateResizeDimensions(
    img.width,
    img.height,
    maxWidth,
    maxHeight
  )

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  // Draw resized image
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to get canvas context')
  
  ctx.drawImage(img, 0, 0, width, height)

  // Compress iteratively until target size reached
  const targetSize = targetSizeKB * 1024
  let quality = 0.9
  let compressed = await canvasToBlob(canvas, format, quality)

  // If already under target, return
  if (compressed.size <= targetSize) {
    return {
      blob: compressed,
      originalSize,
      compressedSize: compressed.size,
      compressionRatio: originalSize / compressed.size,
      quality,
      width,
      height
    }
  }

  // Iteratively reduce quality until target size reached
  while (compressed.size > targetSize && quality > minQuality) {
    quality -= 0.1
    compressed = await canvasToBlob(canvas, format, quality)
  }

  return {
    blob: compressed,
    originalSize,
    compressedSize: compressed.size,
    compressionRatio: originalSize / compressed.size,
    quality,
    width,
    height
  }
}

/**
 * Load image from blob
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Calculate resize dimensions maintaining aspect ratio
 */
function calculateResizeDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const aspectRatio = width / height

  if (width > height) {
    // Landscape
    const newWidth = Math.min(width, maxWidth)
    const newHeight = Math.round(newWidth / aspectRatio)
    return { width: newWidth, height: newHeight }
  } else {
    // Portrait
    const newHeight = Math.min(height, maxHeight)
    const newWidth = Math.round(newHeight * aspectRatio)
    return { width: newWidth, height: newHeight }
  }
}

/**
 * Convert canvas to blob
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      format,
      quality
    )
  })
}

/**
 * Resize canvas maintaining aspect ratio
 */
export function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const { width, height } = calculateResizeDimensions(
    sourceCanvas.width,
    sourceCanvas.height,
    maxWidth,
    maxHeight
  )

  if (width === sourceCanvas.width && height === sourceCanvas.height) {
    return sourceCanvas
  }

  const resized = document.createElement('canvas')
  resized.width = width
  resized.height = height

  const ctx = resized.getContext('2d')
  if (!ctx) throw new Error('Unable to get canvas context')

  ctx.drawImage(sourceCanvas, 0, 0, width, height)

  return resized
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Calculate image brightness
 */
export function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data
  let totalBrightness = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    totalBrightness += (r + g + b) / 3
  }

  return totalBrightness / (data.length / 4)
}
