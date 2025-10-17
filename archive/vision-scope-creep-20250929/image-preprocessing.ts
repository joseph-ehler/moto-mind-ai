// Image Preprocessing for Vision API Optimization
// Reduces costs and improves performance through smart image optimization

export interface ImageOptimizationResult {
  optimizedBase64: string
  originalSize: { width: number, height: number, bytes: number }
  optimizedSize: { width: number, height: number, bytes: number }
  compressionRatio: number
  estimatedSavings: number // Cost savings in USD
  processingTime: number
}

export interface OptimizationConfig {
  maxWidth: number
  maxHeight: number
  quality: number // 0.1 to 1.0
  format: 'jpeg' | 'webp'
  enableSmartCropping: boolean
  preserveAspectRatio: boolean
}

// Default configs for different document types
export const OPTIMIZATION_CONFIGS: Record<string, OptimizationConfig> = {
  odometer: {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.8,
    format: 'jpeg',
    enableSmartCropping: true,
    preserveAspectRatio: true
  },
  fuel: {
    maxWidth: 1024,
    maxHeight: 768,
    quality: 0.85,
    format: 'jpeg',
    enableSmartCropping: false,
    preserveAspectRatio: true
  },
  service_invoice: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.9,
    format: 'jpeg',
    enableSmartCropping: false,
    preserveAspectRatio: true
  },
  insurance: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.95, // Higher quality for complex documents
    format: 'jpeg',
    enableSmartCropping: false,
    preserveAspectRatio: true
  },
  default: {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.85,
    format: 'jpeg',
    enableSmartCropping: false,
    preserveAspectRatio: true
  }
}

// Browser-compatible image optimization (using Canvas API)
export async function optimizeImage(
  base64Image: string,
  documentType: string = 'default'
): Promise<ImageOptimizationResult> {
  const startTime = Date.now()
  const config = OPTIMIZATION_CONFIGS[documentType] || OPTIMIZATION_CONFIGS.default
  
  try {
    // Create image element
    const img = new Image()
    const originalBytes = Math.floor((base64Image.length * 3) / 4) // Approximate base64 to bytes
    
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = `data:image/jpeg;base64,${base64Image}`
    })
    
    const originalSize = {
      width: img.width,
      height: img.height,
      bytes: originalBytes
    }
    
    // Calculate optimal dimensions
    const { width: targetWidth, height: targetHeight } = calculateOptimalDimensions(
      img.width,
      img.height,
      config
    )
    
    // Create canvas and resize
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = targetWidth
    canvas.height = targetHeight
    
    // Apply smart cropping if enabled
    if (config.enableSmartCropping && documentType === 'odometer') {
      // For odometer, try to focus on the center where the reading usually is
      const sourceX = Math.max(0, (img.width - targetWidth) / 2)
      const sourceY = Math.max(0, (img.height - targetHeight) / 2)
      
      ctx.drawImage(
        img,
        sourceX, sourceY, Math.min(targetWidth, img.width), Math.min(targetHeight, img.height),
        0, 0, targetWidth, targetHeight
      )
    } else {
      // Standard resize
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
    }
    
    // Convert to optimized format
    const mimeType = config.format === 'webp' ? 'image/webp' : 'image/jpeg'
    const optimizedDataUrl = canvas.toDataURL(mimeType, config.quality)
    const optimizedBase64 = optimizedDataUrl.split(',')[1]
    
    const optimizedBytes = Math.floor((optimizedBase64.length * 3) / 4)
    const compressionRatio = originalBytes / optimizedBytes
    
    // Estimate cost savings (based on OpenAI's image token calculation)
    const originalTokens = calculateImageTokens(originalSize, 'high')
    const optimizedTokens = calculateImageTokens({ width: targetWidth, height: targetHeight }, 'high')
    const tokenSavings = originalTokens - optimizedTokens
    const estimatedSavings = tokenSavings * 0.00765 // gpt-4o high detail cost per image
    
    const processingTime = Date.now() - startTime
    
    return {
      optimizedBase64,
      originalSize,
      optimizedSize: {
        width: targetWidth,
        height: targetHeight,
        bytes: optimizedBytes
      },
      compressionRatio,
      estimatedSavings,
      processingTime
    }
    
  } catch (error) {
    console.error('Image optimization failed:', error)
    
    // Return original image if optimization fails
    return {
      optimizedBase64: base64Image,
      originalSize: { width: 0, height: 0, bytes: 0 },
      optimizedSize: { width: 0, height: 0, bytes: 0 },
      compressionRatio: 1,
      estimatedSavings: 0,
      processingTime: Date.now() - startTime
    }
  }
}

function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  config: OptimizationConfig
): { width: number, height: number } {
  
  if (!config.preserveAspectRatio) {
    return {
      width: Math.min(originalWidth, config.maxWidth),
      height: Math.min(originalHeight, config.maxHeight)
    }
  }
  
  const aspectRatio = originalWidth / originalHeight
  
  let targetWidth = Math.min(originalWidth, config.maxWidth)
  let targetHeight = Math.min(originalHeight, config.maxHeight)
  
  // Maintain aspect ratio
  if (targetWidth / targetHeight > aspectRatio) {
    targetWidth = targetHeight * aspectRatio
  } else {
    targetHeight = targetWidth / aspectRatio
  }
  
  return {
    width: Math.round(targetWidth),
    height: Math.round(targetHeight)
  }
}

// Calculate image tokens (same logic as in dynamic-cost-estimation.ts)
function calculateImageTokens(imageSize: { width: number, height: number }, detail: 'low' | 'high'): number {
  if (detail === 'low') {
    return 85
  }
  
  const { width, height } = imageSize
  const maxDim = Math.max(width, height)
  const scale = maxDim > 2048 ? 2048 / maxDim : 1
  const scaledWidth = Math.floor(width * scale)
  const scaledHeight = Math.floor(height * scale)
  
  const tilesX = Math.ceil(scaledWidth / 512)
  const tilesY = Math.ceil(scaledHeight / 512)
  const totalTiles = tilesX * tilesY
  
  return 85 + (totalTiles * 170)
}

// Node.js compatible version (for server-side optimization)
export async function optimizeImageServer(
  base64Image: string,
  documentType: string = 'default'
): Promise<ImageOptimizationResult> {
  const startTime = Date.now()
  
  try {
    // Dynamic import for server-side only
    const sharp = await import('sharp').catch(() => null)
    
    if (!sharp) {
      console.warn('Sharp library not available. Install with: npm install sharp')
      return {
        optimizedBase64: base64Image,
        originalSize: { width: 0, height: 0, bytes: 0 },
        optimizedSize: { width: 0, height: 0, bytes: 0 },
        compressionRatio: 1,
        estimatedSavings: 0,
        processingTime: Date.now() - startTime
      }
    }
    
    const config = OPTIMIZATION_CONFIGS[documentType] || OPTIMIZATION_CONFIGS.default
    const imageBuffer = Buffer.from(base64Image, 'base64')
    
    // Get original image info
    const originalImage = sharp.default(imageBuffer)
    const { width: originalWidth, height: originalHeight } = await originalImage.metadata()
    const originalBytes = imageBuffer.length
    
    if (!originalWidth || !originalHeight) {
      throw new Error('Could not read image dimensions')
    }
    
    // Calculate optimal dimensions
    const { width: targetWidth, height: targetHeight } = calculateOptimalDimensions(
      originalWidth,
      originalHeight,
      config
    )
    
    // Apply optimizations
    let optimizedImage = originalImage.resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    
    // Apply format and quality settings
    if (config.format === 'webp') {
      optimizedImage = optimizedImage.webp({ quality: Math.round(config.quality * 100) })
    } else {
      optimizedImage = optimizedImage.jpeg({ 
        quality: Math.round(config.quality * 100),
        progressive: true,
        mozjpeg: true // Better compression
      })
    }
    
    // Smart cropping for odometer images
    if (config.enableSmartCropping && documentType === 'odometer') {
      // Focus on center area where odometer reading typically appears
      const cropWidth = Math.min(targetWidth, Math.floor(originalWidth * 0.8))
      const cropHeight = Math.min(targetHeight, Math.floor(originalHeight * 0.6))
      const left = Math.floor((targetWidth - cropWidth) / 2)
      const top = Math.floor((targetHeight - cropHeight) / 2)
      
      optimizedImage = optimizedImage.extract({
        left,
        top,
        width: cropWidth,
        height: cropHeight
      })
    }
    
    // Get optimized buffer
    const optimizedBuffer = await optimizedImage.toBuffer()
    const optimizedBase64 = optimizedBuffer.toString('base64')
    const optimizedBytes = optimizedBuffer.length
    
    const compressionRatio = originalBytes / optimizedBytes
    
    // Calculate cost savings
    const originalTokens = calculateImageTokens({ width: originalWidth, height: originalHeight }, 'high')
    const optimizedTokens = calculateImageTokens({ width: targetWidth, height: targetHeight }, 'high')
    const tokenSavings = originalTokens - optimizedTokens
    const estimatedSavings = tokenSavings * 0.00765 // gpt-4o high detail cost per image
    
    const processingTime = Date.now() - startTime
    
    console.log(`📸 Server optimization: ${originalBytes} → ${optimizedBytes} bytes (${compressionRatio.toFixed(2)}x compression)`)
    
    return {
      optimizedBase64,
      originalSize: {
        width: originalWidth,
        height: originalHeight,
        bytes: originalBytes
      },
      optimizedSize: {
        width: targetWidth,
        height: targetHeight,
        bytes: optimizedBytes
      },
      compressionRatio,
      estimatedSavings,
      processingTime
    }
    
  } catch (error) {
    console.error('Server-side image optimization failed:', error)
    
    return {
      optimizedBase64: base64Image,
      originalSize: { width: 0, height: 0, bytes: 0 },
      optimizedSize: { width: 0, height: 0, bytes: 0 },
      compressionRatio: 1,
      estimatedSavings: 0,
      processingTime: Date.now() - startTime
    }
  }
}

// Batch optimization for multiple images
export async function optimizeImageBatch(
  images: Array<{ base64: string, documentType: string }>,
  maxConcurrent: number = 3
): Promise<ImageOptimizationResult[]> {
  const results: ImageOptimizationResult[] = []
  
  // Process in batches to avoid overwhelming the browser
  for (let i = 0; i < images.length; i += maxConcurrent) {
    const batch = images.slice(i, i + maxConcurrent)
    const batchPromises = batch.map(img => optimizeImage(img.base64, img.documentType))
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

// Optimization analytics
export function analyzeOptimizationImpact(results: ImageOptimizationResult[]): {
  totalOriginalBytes: number
  totalOptimizedBytes: number
  totalSavings: number
  avgCompressionRatio: number
  avgProcessingTime: number
  recommendedSettings: Record<string, Partial<OptimizationConfig>>
} {
  const totalOriginalBytes = results.reduce((sum, r) => sum + r.originalSize.bytes, 0)
  const totalOptimizedBytes = results.reduce((sum, r) => sum + r.optimizedSize.bytes, 0)
  const totalSavings = results.reduce((sum, r) => sum + r.estimatedSavings, 0)
  const avgCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
  const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
  
  // Generate recommendations based on results
  const recommendedSettings: Record<string, Partial<OptimizationConfig>> = {}
  
  // If compression ratios are very high, we can be more aggressive
  if (avgCompressionRatio > 3) {
    recommendedSettings.aggressive = {
      quality: 0.7,
      maxWidth: 800,
      maxHeight: 800
    }
  }
  
  // If processing time is high, recommend lower quality
  if (avgProcessingTime > 1000) {
    recommendedSettings.performance = {
      quality: 0.75,
      format: 'jpeg'
    }
  }
  
  return {
    totalOriginalBytes,
    totalOptimizedBytes,
    totalSavings,
    avgCompressionRatio,
    avgProcessingTime,
    recommendedSettings
  }
}
