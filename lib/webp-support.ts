/**
 * WebP Support Detection and Conversion
 * 
 * WebP provides 30% better compression than JPEG at same quality
 * Supported in all modern browsers (Chrome, Firefox, Safari 14+, Edge)
 */

/**
 * Detect WebP support in current browser
 * Cached result for performance
 */
let webpSupportCached: boolean | null = null

export function supportsWebP(): boolean {
  // Return cached result if available
  if (webpSupportCached !== null) {
    return webpSupportCached
  }

  // Check if browser supports WebP
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    const dataURL = canvas.toDataURL('image/webp')
    webpSupportCached = dataURL.startsWith('data:image/webp')
    
    return webpSupportCached
  } catch (error) {
    console.warn('WebP support detection failed:', error)
    webpSupportCached = false
    return false
  }
}

/**
 * Get best output format for current browser
 */
export function getBestImageFormat(): 'image/webp' | 'image/jpeg' {
  return supportsWebP() ? 'image/webp' : 'image/jpeg'
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: 'image/webp' | 'image/jpeg'): string {
  return format === 'image/webp' ? '.webp' : '.jpg'
}

/**
 * Convert canvas to blob with best format
 */
export async function canvasToBestBlob(
  canvas: HTMLCanvasElement,
  quality: number = 0.9
): Promise<{ blob: Blob; format: string; extension: string }> {
  const format = getBestImageFormat()
  
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      format,
      quality
    )
  })
  
  return {
    blob,
    format,
    extension: getFileExtension(format)
  }
}

/**
 * Estimate WebP savings compared to JPEG
 * WebP is typically 25-35% smaller than JPEG at same quality
 */
export function estimateWebPSavings(jpegSize: number): number {
  return Math.round(jpegSize * 0.3) // 30% average savings
}

/**
 * Get user-friendly format name
 */
export function getFormatName(format: string): string {
  if (format === 'image/webp') return 'WebP'
  if (format === 'image/jpeg') return 'JPEG'
  return format
}
