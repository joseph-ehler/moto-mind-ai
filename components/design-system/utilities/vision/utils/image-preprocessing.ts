/**
 * Image Preprocessing Utilities
 * 
 * Optimizes images before upload/processing:
 * - Compression
 * - Resizing
 * - Format conversion
 * - EXIF handling
 * - Quality optimization
 */

export interface PreprocessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1
  format?: 'jpeg' | 'png' | 'webp'
  autoRotate?: boolean
  stripMetadata?: boolean
  maxFileSize?: number // bytes
}

export interface PreprocessingResult {
  originalSize: number
  processedSize: number
  originalDimensions: { width: number; height: number }
  processedDimensions: { width: number; height: number }
  compression: number // percentage reduced
  base64: string
  format: string
  rotated: boolean
}

/**
 * Default preprocessing options optimized for AI vision
 */
export const DEFAULT_PREPROCESSING: PreprocessingOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  format: 'jpeg',
  autoRotate: true,
  stripMetadata: true,
  maxFileSize: 5 * 1024 * 1024 // 5MB
}

/**
 * Load image from file
 */
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Get EXIF orientation from file
 */
async function getExifOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer)
      
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1) // Not JPEG
        return
      }
      
      const length = view.byteLength
      let offset = 2
      
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1)
          return
        }
        
        const marker = view.getUint16(offset, false)
        offset += 2
        
        if (marker === 0xFFE1) {
          const exifOffset = offset + 8
          const tiffOffset = exifOffset
          
          const littleEndian = view.getUint16(tiffOffset, false) === 0x4949
          const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian)
          const tagCount = view.getUint16(tiffOffset + ifdOffset, littleEndian)
          
          for (let i = 0; i < tagCount; i++) {
            const tagOffset = tiffOffset + ifdOffset + 2 + i * 12
            if (view.getUint16(tagOffset, littleEndian) === 0x0112) {
              const orientation = view.getUint16(tagOffset + 8, littleEndian)
              resolve(orientation)
              return
            }
          }
        }
        
        offset += view.getUint16(offset, false)
      }
      
      resolve(1)
    }
    
    reader.onerror = () => resolve(1)
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}

/**
 * Calculate dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight
  
  // Check if resizing is needed
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width
    const heightRatio = maxHeight / height
    const ratio = Math.min(widthRatio, heightRatio)
    
    width = Math.round(width * ratio)
    height = Math.round(height * ratio)
  }
  
  return { width, height }
}

/**
 * Apply EXIF rotation to canvas
 */
function applyOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): void {
  switch (orientation) {
    case 2:
      // Horizontal flip
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
      break
    case 3:
      // 180° rotate
      ctx.translate(width, height)
      ctx.rotate(Math.PI)
      break
    case 4:
      // Vertical flip
      ctx.translate(0, height)
      ctx.scale(1, -1)
      break
    case 5:
      // Vertical flip + 90° rotate
      ctx.rotate(0.5 * Math.PI)
      ctx.scale(1, -1)
      break
    case 6:
      // 90° rotate
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(0, -height)
      break
    case 7:
      // Horizontal flip + 90° rotate
      ctx.rotate(0.5 * Math.PI)
      ctx.translate(width, -height)
      ctx.scale(-1, 1)
      break
    case 8:
      // 270° rotate
      ctx.rotate(-0.5 * Math.PI)
      ctx.translate(-width, 0)
      break
    default:
      // No transformation
      break
  }
}

/**
 * Preprocess image file
 */
export async function preprocessImage(
  file: File,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING
): Promise<PreprocessingResult> {
  const startTime = performance.now()
  
  console.log('🔄 Preprocessing image:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`)
  
  // Merge with defaults
  const opts = { ...DEFAULT_PREPROCESSING, ...options }
  
  // Load image
  const img = await loadImage(file)
  
  const originalDimensions = {
    width: img.naturalWidth,
    height: img.naturalHeight
  }
  
  console.log('📐 Original dimensions:', originalDimensions)
  
  // Get EXIF orientation
  let orientation = 1
  let rotated = false
  
  if (opts.autoRotate) {
    orientation = await getExifOrientation(file)
    rotated = orientation !== 1
    console.log('🔄 EXIF orientation:', orientation, rotated ? '(rotation needed)' : '(no rotation)')
  }
  
  // Calculate target dimensions
  const processedDimensions = calculateDimensions(
    originalDimensions.width,
    originalDimensions.height,
    opts.maxWidth!,
    opts.maxHeight!
  )
  
  console.log('📐 Target dimensions:', processedDimensions)
  
  // Create canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // Handle rotation (some orientations swap width/height)
  if (orientation >= 5 && orientation <= 8) {
    canvas.width = processedDimensions.height
    canvas.height = processedDimensions.width
  } else {
    canvas.width = processedDimensions.width
    canvas.height = processedDimensions.height
  }
  
  // Apply rotation/orientation
  applyOrientation(ctx, orientation, canvas.width, canvas.height)
  
  // Draw image
  ctx.drawImage(
    img,
    0,
    0,
    processedDimensions.width,
    processedDimensions.height
  )
  
  // Convert to base64 with quality/format settings
  const mimeType = `image/${opts.format}`
  const base64 = canvas.toDataURL(mimeType, opts.quality)
  
  // Calculate sizes
  const processedSize = Math.round((base64.length * 3) / 4) // Approximate size from base64
  const compression = ((file.size - processedSize) / file.size) * 100
  
  const processingTime = performance.now() - startTime
  
  console.log('✅ Preprocessing complete:')
  console.log(`  • Original: ${(file.size / 1024).toFixed(2)} KB`)
  console.log(`  • Processed: ${(processedSize / 1024).toFixed(2)} KB`)
  console.log(`  • Compression: ${compression.toFixed(1)}%`)
  console.log(`  • Time: ${processingTime.toFixed(0)}ms`)
  
  return {
    originalSize: file.size,
    processedSize,
    originalDimensions,
    processedDimensions,
    compression,
    base64,
    format: opts.format!,
    rotated
  }
}

/**
 * Quick validation before preprocessing
 */
export function validateImageFile(file: File, maxSize?: number): { valid: boolean; error?: string } {
  // Check type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }
  
  // Check size
  if (maxSize && file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (${(maxSize / 1024 / 1024).toFixed(1)}MB)` 
    }
  }
  
  return { valid: true }
}

/**
 * Compress image iteratively to meet target size
 */
export async function compressToSize(
  file: File,
  targetSize: number,
  options: PreprocessingOptions = DEFAULT_PREPROCESSING
): Promise<PreprocessingResult> {
  let quality = options.quality || 0.85
  let result = await preprocessImage(file, { ...options, quality })
  
  // Iteratively reduce quality until size target is met
  while (result.processedSize > targetSize && quality > 0.1) {
    quality -= 0.1
    console.log(`🔄 Reducing quality to ${(quality * 100).toFixed(0)}% to meet size target...`)
    result = await preprocessImage(file, { ...options, quality })
  }
  
  return result
}
