/**
 * Image Compression Web Worker
 * 
 * Performs image compression in a separate thread to avoid blocking the UI.
 * Uses OffscreenCanvas for better performance.
 */

export interface CompressionMessage {
  file: File
  quality: number
  maxDimensions?: { width: number; height: number }
}

export interface CompressionResult {
  blob: Blob
  fileName: string
  originalSize: number
  compressedSize: number
}

// Listen for messages from the main thread
self.addEventListener('message', async (e: MessageEvent<CompressionMessage>) => {
  try {
    const { file, quality, maxDimensions } = e.data

    // Skip compression for non-images
    if (!file.type.startsWith('image/')) {
      self.postMessage({ 
        error: 'Not an image file',
        file 
      })
      return
    }

    // Create bitmap from file
    const bitmap = await createImageBitmap(file)
    
    let { width, height } = bitmap

    // Apply maxDimensions if specified
    if (maxDimensions) {
      const aspectRatio = width / height
      if (width > maxDimensions.width) {
        width = maxDimensions.width
        height = width / aspectRatio
      }
      if (height > maxDimensions.height) {
        height = maxDimensions.height
        width = height * aspectRatio
      }
    }

    // Create OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Draw image
    ctx.drawImage(bitmap, 0, 0, width, height)

    // Convert to blob with specified quality
    const blob = await canvas.convertToBlob({
      type: file.type,
      quality
    })

    // Send result back to main thread
    const result: CompressionResult = {
      blob,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: blob.size
    }

    self.postMessage(result)
    
    // Clean up
    bitmap.close()
  } catch (error) {
    console.error('Compression worker error:', error)
    self.postMessage({ 
      error: error instanceof Error ? error.message : 'Compression failed' 
    })
  }
})

// Export empty object for TypeScript
export {}
