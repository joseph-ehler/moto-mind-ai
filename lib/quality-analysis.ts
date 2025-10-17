/**
 * Image Quality Analysis
 * 
 * Advanced quality checks:
 * - Blur detection (Laplacian variance)
 * - Text detection (for receipts/documents)
 * - Glare detection (overexposed regions)
 * - Document edge detection
 */

export interface QualityIssue {
  type: 'blur' | 'text' | 'glare' | 'edges' | 'brightness' | 'composition'
  severity: 'error' | 'warning' | 'info'
  message: string
  icon: string
}

export interface QualityAnalysisResult {
  score: number              // 0-100
  issues: QualityIssue[]
  isGoodEnough: boolean
  details: {
    blurScore?: number
    textDetected?: boolean
    glarePercent?: number
    edgesCoverage?: number
    brightness?: number
  }
}

/**
 * Comprehensive quality analysis
 */
export async function analyzePhotoQuality(
  canvas: HTMLCanvasElement,
  context: {
    eventType?: string
    stepId?: string
    requiresText?: boolean
  } = {}
): Promise<QualityAnalysisResult> {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return {
      score: 50,
      issues: [],
      isGoodEnough: true,
      details: {}
    }
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const issues: QualityIssue[] = []
  const details: any = {}

  // 1. Blur detection
  const blurScore = detectBlur(imageData)
  details.blurScore = blurScore
  
  if (blurScore < 100) {
    issues.push({
      type: 'blur',
      severity: 'error',
      message: 'Photo is blurry - hold camera steady',
      icon: '⚠️'
    })
  } else if (blurScore < 200) {
    issues.push({
      type: 'blur',
      severity: 'warning',
      message: 'Photo may be slightly blurry',
      icon: '⚠️'
    })
  }

  // 2. Text detection (for receipts/documents)
  const requiresText = context.requiresText || 
    context.eventType === 'fuel' || 
    context.stepId?.includes('receipt') ||
    context.stepId?.includes('document')
  
  if (requiresText) {
    const textDetected = detectText(imageData)
    details.textDetected = textDetected
    
    if (!textDetected) {
      issues.push({
        type: 'text',
        severity: 'error',
        message: 'No text detected - make sure document is visible',
        icon: '❌'
      })
    }
  }

  // 3. Glare detection
  const glarePercent = detectGlare(imageData)
  details.glarePercent = glarePercent
  
  if (glarePercent > 20) {
    issues.push({
      type: 'glare',
      severity: 'warning',
      message: 'Glare detected - tilt phone to reduce reflection',
      icon: '💡'
    })
  }

  // 4. Document edge detection
  const edgesCoverage = detectDocumentEdges(imageData)
  details.edgesCoverage = edgesCoverage
  
  if (edgesCoverage < 0.4) {
    issues.push({
      type: 'edges',
      severity: 'warning',
      message: 'Move closer - capture entire document',
      icon: '📐'
    })
  }

  // 5. Brightness (existing check)
  const brightness = calculateBrightness(imageData)
  details.brightness = brightness
  
  if (brightness < 50) {
    issues.push({
      type: 'brightness',
      severity: 'warning',
      message: 'Too dark - turn on flash or add more light',
      icon: '💡'
    })
  } else if (brightness > 230) {
    issues.push({
      type: 'brightness',
      severity: 'warning',
      message: 'Too bright - move to shade or turn off flash',
      icon: '☀️'
    })
  }

  // Calculate overall quality score
  const score = calculateQualityScore(issues, details)
  const isGoodEnough = issues.filter(i => i.severity === 'error').length === 0

  return {
    score,
    issues,
    isGoodEnough,
    details
  }
}

/**
 * Blur detection using Laplacian variance
 * Higher score = sharper image
 */
function detectBlur(imageData: ImageData): number {
  const { width, height, data } = imageData
  
  // Convert to grayscale and calculate Laplacian
  const gray = new Float32Array(width * height)
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b
  }
  
  // Apply Laplacian operator (edge detection)
  let variance = 0
  let count = 0
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      
      // Laplacian kernel
      const laplacian = 
        -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1] +
        -gray[idx - 1] + 8 * gray[idx] - gray[idx + 1] +
        -gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1]
      
      variance += laplacian * laplacian
      count++
    }
  }
  
  // Higher variance = sharper edges = less blur
  return Math.sqrt(variance / count)
}

/**
 * Text detection using edge patterns
 * Looks for horizontal/vertical lines characteristic of text
 */
function detectText(imageData: ImageData): boolean {
  const { width, height, data } = imageData
  
  // Convert to grayscale
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }
  
  // Apply threshold
  const threshold = 128
  const binary = new Uint8Array(width * height)
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] > threshold ? 255 : 0
  }
  
  // Look for horizontal and vertical runs (characteristic of text)
  let horizontalRuns = 0
  let verticalRuns = 0
  
  // Check horizontal runs
  for (let y = 0; y < height; y += 5) {
    let runLength = 0
    for (let x = 0; x < width; x++) {
      if (binary[y * width + x] === 0) {
        runLength++
      } else {
        if (runLength > 5 && runLength < width / 4) {
          horizontalRuns++
        }
        runLength = 0
      }
    }
  }
  
  // Check vertical runs
  for (let x = 0; x < width; x += 5) {
    let runLength = 0
    for (let y = 0; y < height; y++) {
      if (binary[y * width + x] === 0) {
        runLength++
      } else {
        if (runLength > 5 && runLength < height / 4) {
          verticalRuns++
        }
        runLength = 0
      }
    }
  }
  
  // If we have both horizontal and vertical patterns, likely text
  return horizontalRuns > 10 && verticalRuns > 10
}

/**
 * Glare detection - percentage of overexposed pixels
 */
function detectGlare(imageData: ImageData): number {
  const { data } = imageData
  let overexposedPixels = 0
  let totalPixels = 0
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // Consider pixel overexposed if all channels > 250
    if (r > 250 && g > 250 && b > 250) {
      overexposedPixels++
    }
    totalPixels++
  }
  
  return (overexposedPixels / totalPixels) * 100
}

/**
 * Document edge detection
 * Returns coverage percentage (0-1)
 */
function detectDocumentEdges(imageData: ImageData): number {
  const { width, height, data } = imageData
  
  // Simple edge detection - look for contrast changes
  let edgePixels = 0
  const threshold = 50
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const current = data[idx] + data[idx + 1] + data[idx + 2]
      
      const right = data[idx + 4] + data[idx + 5] + data[idx + 6]
      const bottom = data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]
      
      if (Math.abs(current - right) > threshold || Math.abs(current - bottom) > threshold) {
        edgePixels++
      }
    }
  }
  
  // Return edge density as a rough coverage metric
  const edgeDensity = edgePixels / (width * height)
  
  // Normalize: 0.05-0.3 edge density is typical for documents
  // Return coverage between 0-1
  if (edgeDensity < 0.05) return 0.3 // Too few edges - possibly blank or too far
  if (edgeDensity > 0.3) return 0.9  // Lots of edges - good detail
  return edgeDensity / 0.3 * 0.9    // Scale proportionally
}

/**
 * Calculate brightness
 */
function calculateBrightness(imageData: ImageData): number {
  const { data } = imageData
  let totalBrightness = 0
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    totalBrightness += (r + g + b) / 3
  }
  
  return totalBrightness / (data.length / 4)
}

/**
 * Calculate overall quality score (0-100)
 */
function calculateQualityScore(issues: QualityIssue[], details: any): number {
  let score = 100
  
  // Deduct points for issues
  for (const issue of issues) {
    if (issue.severity === 'error') {
      score -= 30
    } else if (issue.severity === 'warning') {
      score -= 15
    } else {
      score -= 5
    }
  }
  
  // Bonus for good blur score
  if (details.blurScore > 300) {
    score += 10
  }
  
  // Bonus for text detected (when required)
  if (details.textDetected === true) {
    score += 10
  }
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}
