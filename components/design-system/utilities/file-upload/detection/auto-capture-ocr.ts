/**
 * Auto-Capture OCR Enhancement Layer (Phase 2)
 * 
 * Adds optional Tesseract.js OCR on top of Phase 1 heuristics
 * to improve detection accuracy from 80% → 90%+
 * 
 * This module is lazy-loaded only when enableOCR={true}
 */

import type { CameraOverlayType } from './FileUpload'
import type { DetectionResult } from './auto-capture-detection'

// Lazy-loaded Tesseract instance
let tesseractWorker: any = null
let isInitializing = false

/**
 * Initialize Tesseract worker (lazy-loaded)
 */
async function initTesseract() {
  if (tesseractWorker) return tesseractWorker

  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return tesseractWorker
  }

  try {
    isInitializing = true
    
    // Dynamic import to avoid including in main bundle
    const Tesseract = await import('tesseract.js')
    
    tesseractWorker = await Tesseract.createWorker({
      logger: () => {}, // Disable logging for production
    })
    
    await tesseractWorker.loadLanguage('eng')
    await tesseractWorker.initialize('eng')
    
    console.log('✅ Tesseract OCR initialized')
    return tesseractWorker
  } catch (error) {
    console.error('Failed to initialize Tesseract:', error)
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * Extract text from a specific region of the canvas
 */
async function extractText(
  canvas: HTMLCanvasElement,
  region?: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const worker = await initTesseract()

  try {
    // If region specified, crop the canvas
    let imageData: HTMLCanvasElement | ImageData = canvas
    if (region) {
      const croppedCanvas = document.createElement('canvas')
      croppedCanvas.width = region.width
      croppedCanvas.height = region.height
      const ctx = croppedCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          canvas,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          region.width,
          region.height
        )
        imageData = croppedCanvas
      }
    }

    const {
      data: { text },
    } = await worker.recognize(imageData)

    return text.trim()
  } catch (error) {
    console.error('OCR extraction error:', error)
    return ''
  }
}

/**
 * Enhanced VIN detection with OCR
 */
export async function enhanceVINDetection(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heuristicResult: DetectionResult
): Promise<DetectionResult> {
  // Only run OCR if heuristics show promise (>60% confidence)
  if (!heuristicResult.detected || heuristicResult.confidence < 0.6) {
    return heuristicResult
  }

  try {
    // Set canvas size
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return heuristicResult

    // Draw current frame
    ctx.drawImage(videoElement, 0, 0)

    // VIN region (center horizontal band)
    const region = {
      x: Math.floor(canvas.width * 0.2),
      y: Math.floor(canvas.height * 0.4),
      width: Math.floor(canvas.width * 0.6),
      height: Math.floor(canvas.height * 0.2),
    }

    const text = await extractText(canvas, region)

    // VIN pattern: Exactly 17 alphanumeric characters (no I, O, Q)
    const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g
    const vinMatches = text.match(vinPattern)

    if (vinMatches && vinMatches.length > 0) {
      const vin = vinMatches[0]
      
      // Validate VIN (no invalid characters)
      const hasInvalidChars = /[IOQ]/.test(vin)
      
      if (!hasInvalidChars) {
        return {
          detected: true,
          confidence: 0.95, // High confidence with OCR match
          type: 'vin',
          reason: `OCR detected VIN: ${vin}`,
          timestamp: Date.now(),
        }
      }
    }

    // OCR didn't find valid VIN, return heuristic result
    return heuristicResult
  } catch (error) {
    console.error('VIN OCR enhancement error:', error)
    return heuristicResult
  }
}

/**
 * Enhanced License Plate detection with OCR
 */
export async function enhanceLicensePlateDetection(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heuristicResult: DetectionResult
): Promise<DetectionResult> {
  // Only run OCR if heuristics show promise
  if (!heuristicResult.detected || heuristicResult.confidence < 0.65) {
    return heuristicResult
  }

  try {
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return heuristicResult

    ctx.drawImage(videoElement, 0, 0)

    // License plate region (smaller center area)
    const region = {
      x: Math.floor(canvas.width * 0.25),
      y: Math.floor(canvas.height * 0.35),
      width: Math.floor(canvas.width * 0.5),
      height: Math.floor(canvas.height * 0.3),
    }

    const text = await extractText(canvas, region)

    // License plate pattern: 2-8 alphanumeric characters (varies by state)
    // Common patterns: ABC1234, 123ABC, AB12345, etc.
    const platePattern = /[A-Z0-9]{2,8}/g
    const plateMatches = text.match(platePattern)

    if (plateMatches && plateMatches.length > 0) {
      // Find the longest match (likely the plate number)
      const plate = plateMatches.reduce((a, b) => (a.length > b.length ? a : b))
      
      if (plate.length >= 4) {
        // Valid plate numbers are usually 4+ chars
        return {
          detected: true,
          confidence: 0.92,
          type: 'license-plate',
          reason: `OCR detected plate: ${plate}`,
          timestamp: Date.now(),
        }
      }
    }

    return heuristicResult
  } catch (error) {
    console.error('License plate OCR enhancement error:', error)
    return heuristicResult
  }
}

/**
 * Enhanced Odometer detection with OCR
 */
export async function enhanceOdometerDetection(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heuristicResult: DetectionResult
): Promise<DetectionResult> {
  if (!heuristicResult.detected || heuristicResult.confidence < 0.6) {
    return heuristicResult
  }

  try {
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return heuristicResult

    ctx.drawImage(videoElement, 0, 0)

    // Odometer region (small center area)
    const region = {
      x: Math.floor(canvas.width * 0.3),
      y: Math.floor(canvas.height * 0.4),
      width: Math.floor(canvas.width * 0.4),
      height: Math.floor(canvas.height * 0.2),
    }

    const text = await extractText(canvas, region)

    // Odometer pattern: 5-7 digits (typical mileage range)
    const odometerPattern = /\b\d{5,7}\b/g
    const mileageMatches = text.match(odometerPattern)

    if (mileageMatches && mileageMatches.length > 0) {
      const mileage = mileageMatches[0]
      
      // Sanity check: mileage should be reasonable (not too low/high)
      const mileageNum = parseInt(mileage, 10)
      if (mileageNum >= 1000 && mileageNum <= 999999) {
        return {
          detected: true,
          confidence: 0.90,
          type: 'odometer',
          reason: `OCR detected mileage: ${mileage}`,
          timestamp: Date.now(),
        }
      }
    }

    return heuristicResult
  } catch (error) {
    console.error('Odometer OCR enhancement error:', error)
    return heuristicResult
  }
}

/**
 * Enhanced Document detection with OCR
 */
export async function enhanceDocumentDetection(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heuristicResult: DetectionResult
): Promise<DetectionResult> {
  if (!heuristicResult.detected || heuristicResult.confidence < 0.6) {
    return heuristicResult
  }

  try {
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return heuristicResult

    ctx.drawImage(videoElement, 0, 0)

    // Full document region
    const region = {
      x: Math.floor(canvas.width * 0.1),
      y: Math.floor(canvas.height * 0.1),
      width: Math.floor(canvas.width * 0.8),
      height: Math.floor(canvas.height * 0.8),
    }

    const text = await extractText(canvas, region)

    // Check if we extracted a reasonable amount of text
    const wordCount = text.split(/\s+/).filter(w => w.length > 2).length
    
    if (wordCount >= 5) {
      // Document likely contains readable text
      return {
        detected: true,
        confidence: Math.min(0.9, heuristicResult.confidence + 0.2),
        type: 'document',
        reason: `OCR detected ${wordCount} words`,
        timestamp: Date.now(),
      }
    }

    return heuristicResult
  } catch (error) {
    console.error('Document OCR enhancement error:', error)
    return heuristicResult
  }
}

/**
 * Main OCR enhancement dispatcher
 */
export async function runOCREnhancement(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  heuristicResult: DetectionResult,
  overlayType: CameraOverlayType
): Promise<DetectionResult> {
  switch (overlayType) {
    case 'vin':
      return enhanceVINDetection(videoElement, canvas, heuristicResult)
    case 'license-plate':
      return enhanceLicensePlateDetection(videoElement, canvas, heuristicResult)
    case 'odometer':
      return enhanceOdometerDetection(videoElement, canvas, heuristicResult)
    case 'document':
      return enhanceDocumentDetection(videoElement, canvas, heuristicResult)
    default:
      return heuristicResult
  }
}

/**
 * Cleanup Tesseract worker
 */
export async function cleanupOCR() {
  if (tesseractWorker) {
    try {
      await tesseractWorker.terminate()
      tesseractWorker = null
      console.log('✅ Tesseract OCR terminated')
    } catch (error) {
      console.error('Error terminating Tesseract:', error)
    }
  }
}
