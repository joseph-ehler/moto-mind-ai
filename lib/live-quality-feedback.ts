/**
 * Live Quality Feedback
 * 
 * Lightweight real-time analysis for video preview
 * Optimized for 500ms intervals
 */

export interface LiveFeedback {
  blur: boolean
  glare: boolean
  tooClose: boolean
  tooFar: boolean
  tooDark: boolean
  tooBright: boolean
  perfect: boolean
  messages: string[]
}

/**
 * Quick quality check for live preview
 * Optimized version - samples instead of full analysis
 */
export function quickQualityCheck(
  videoElement: HTMLVideoElement
): LiveFeedback {
  // Create small canvas for sampling
  const canvas = document.createElement('canvas')
  const sampleWidth = 320  // Small sample for speed
  const sampleHeight = 240
  
  canvas.width = sampleWidth
  canvas.height = sampleHeight
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return createEmptyFeedback()
  }

  // Draw current video frame
  ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight)
  
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
  
  // Quick checks
  const brightness = quickBrightnessCheck(imageData)
  const blur = quickBlurCheck(imageData)
  const glare = quickGlareCheck(imageData)
  const coverage = quickCoverageCheck(imageData)
  
  // Build feedback
  const feedback: LiveFeedback = {
    blur: blur.isBlurry,
    glare: glare.hasGlare,
    tooClose: coverage.tooMuchDetail,
    tooFar: coverage.tooLittleDetail,
    tooDark: brightness.tooDark,
    tooBright: brightness.tooBright,
    perfect: false,
    messages: []
  }

  // Generate messages
  if (blur.isBlurry) {
    feedback.messages.push('⚠️ Hold steady')
  }
  
  if (glare.hasGlare) {
    feedback.messages.push('💡 Tilt to reduce glare')
  }
  
  if (coverage.tooLittleDetail) {
    feedback.messages.push('📐 Move closer')
  }
  
  if (coverage.tooMuchDetail) {
    feedback.messages.push('📏 Move back')
  }
  
  if (brightness.tooDark) {
    feedback.messages.push('💡 Too dark - add light')
  }
  
  if (brightness.tooBright) {
    feedback.messages.push('☀️ Too bright - reduce light')
  }
  
  // Check if perfect
  feedback.perfect = feedback.messages.length === 0
  if (feedback.perfect) {
    feedback.messages.push('✅ Perfect! Tap to capture')
  }
  
  return feedback
}

/**
 * Quick brightness check (sample center pixels)
 */
function quickBrightnessCheck(imageData: ImageData): {
  tooDark: boolean
  tooBright: boolean
  average: number
} {
  const { width, height, data } = imageData
  
  // Sample center region only (faster)
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  const sampleSize = Math.min(50, width / 4, height / 4)
  
  let total = 0
  let count = 0
  
  for (let y = centerY - sampleSize; y < centerY + sampleSize; y += 2) {
    for (let x = centerX - sampleSize; x < centerX + sampleSize; x += 2) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4
        total += (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        count++
      }
    }
  }
  
  const average = total / count
  
  return {
    tooDark: average < 60,
    tooBright: average > 220,
    average
  }
}

/**
 * Quick blur check (sample gradient variance)
 */
function quickBlurCheck(imageData: ImageData): {
  isBlurry: boolean
  score: number
} {
  const { width, height, data } = imageData
  
  // Sample fewer pixels for speed
  let variance = 0
  let count = 0
  
  for (let y = 1; y < height - 1; y += 4) { // Every 4th row
    for (let x = 1; x < width - 1; x += 4) { // Every 4th column
      const idx = (y * width + x) * 4
      
      // Simple gradient
      const current = data[idx]
      const right = data[idx + 4]
      const bottom = data[idx + width * 4]
      
      const gradX = Math.abs(current - right)
      const gradY = Math.abs(current - bottom)
      
      variance += gradX + gradY
      count++
    }
  }
  
  const score = variance / count
  
  return {
    isBlurry: score < 15, // Lower threshold for quick check
    score
  }
}

/**
 * Quick glare check (overexposed pixels)
 */
function quickGlareCheck(imageData: ImageData): {
  hasGlare: boolean
  percent: number
} {
  const { data } = imageData
  let overexposed = 0
  let total = 0
  
  // Sample every 8th pixel for speed
  for (let i = 0; i < data.length; i += 32) { // 32 = 8 pixels * 4 channels
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    if (r > 245 && g > 245 && b > 245) {
      overexposed++
    }
    total++
  }
  
  const percent = (overexposed / total) * 100
  
  return {
    hasGlare: percent > 15,
    percent
  }
}

/**
 * Quick coverage check (edge density)
 */
function quickCoverageCheck(imageData: ImageData): {
  tooMuchDetail: boolean
  tooLittleDetail: boolean
  density: number
} {
  const { width, height, data } = imageData
  
  let edges = 0
  let total = 0
  
  // Sample every 4th pixel
  for (let y = 1; y < height - 1; y += 4) {
    for (let x = 1; x < width - 1; x += 4) {
      const idx = (y * width + x) * 4
      const current = data[idx] + data[idx + 1] + data[idx + 2]
      const right = data[idx + 4] + data[idx + 5] + data[idx + 6]
      
      if (Math.abs(current - right) > 60) {
        edges++
      }
      total++
    }
  }
  
  const density = (edges / total) * 100
  
  return {
    tooMuchDetail: density > 35, // Very cluttered
    tooLittleDetail: density < 3, // Almost blank
    density
  }
}

/**
 * Create empty feedback
 */
function createEmptyFeedback(): LiveFeedback {
  return {
    blur: false,
    glare: false,
    tooClose: false,
    tooFar: false,
    tooDark: false,
    tooBright: false,
    perfect: false,
    messages: []
  }
}
