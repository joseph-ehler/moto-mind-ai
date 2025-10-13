/**
 * Auto-Capture Detection Utilities
 * 
 * Phase 1: Heuristic-based visual detection for camera auto-capture
 * Uses image analysis techniques (brightness, contrast, edges, shapes)
 * without heavy OCR to provide fast, lightweight detection.
 */

import type { CameraOverlayType } from './FileUpload'

export interface DetectionResult {
  detected: boolean
  confidence: number
  type: CameraOverlayType
  reason?: string
  timestamp: number
}

interface DetectionRegion {
  x: number // 0-1 (percentage of width)
  y: number // 0-1 (percentage of height)
  width: number // 0-1
  height: number // 0-1
}

/**
 * Analyze brightness in a specific region of the canvas
 */
function analyzeBrightness(
  ctx: CanvasRenderingContext2D,
  region: DetectionRegion,
  canvasWidth: number,
  canvasHeight: number
): number {
  const x = region.x * canvasWidth
  const y = region.y * canvasHeight
  const width = region.width * canvasWidth
  const height = region.height * canvasHeight

  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  let totalBrightness = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Calculate perceived brightness
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    totalBrightness += brightness
  }

  return totalBrightness / (data.length / 4)
}

/**
 * Analyze contrast in a region (difference between brightest and darkest)
 */
function analyzeContrast(
  ctx: CanvasRenderingContext2D,
  region: DetectionRegion,
  canvasWidth: number,
  canvasHeight: number
): number {
  const x = region.x * canvasWidth
  const y = region.y * canvasHeight
  const width = region.width * canvasWidth
  const height = region.height * canvasHeight

  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  let minBrightness = 1
  let maxBrightness = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    minBrightness = Math.min(minBrightness, brightness)
    maxBrightness = Math.max(maxBrightness, brightness)
  }

  return maxBrightness - minBrightness
}

/**
 * Detect edges using simple gradient detection
 */
function detectEdges(
  ctx: CanvasRenderingContext2D,
  region: DetectionRegion,
  canvasWidth: number,
  canvasHeight: number
): number {
  const x = Math.floor(region.x * canvasWidth)
  const y = Math.floor(region.y * canvasHeight)
  const width = Math.floor(region.width * canvasWidth)
  const height = Math.floor(region.height * canvasHeight)

  const imageData = ctx.getImageData(x, y, width, height)
  const data = imageData.data

  let edgeCount = 0
  const threshold = 30 // Edge detection threshold

  // Horizontal edge detection
  for (let row = 0; row < height - 1; row++) {
    for (let col = 0; col < width; col++) {
      const idx1 = (row * width + col) * 4
      const idx2 = ((row + 1) * width + col) * 4

      const diff =
        Math.abs(data[idx1] - data[idx2]) +
        Math.abs(data[idx1 + 1] - data[idx2 + 1]) +
        Math.abs(data[idx1 + 2] - data[idx2 + 2])

      if (diff > threshold) edgeCount++
    }
  }

  // Normalize edge count
  return Math.min(edgeCount / (width * height * 0.1), 1)
}

/**
 * Check if region has rectangular shape (high edges on borders)
 */
function hasRectangularShape(
  ctx: CanvasRenderingContext2D,
  region: DetectionRegion,
  canvasWidth: number,
  canvasHeight: number
): number {
  // Sample edges of the region
  const borderRegions = [
    { ...region, height: 0.05 }, // Top
    { ...region, y: region.y + region.height - 0.05, height: 0.05 }, // Bottom
    { ...region, width: 0.05 }, // Left
    { ...region, x: region.x + region.width - 0.05, width: 0.05 }, // Right
  ]

  let totalEdges = 0
  for (const borderRegion of borderRegions) {
    totalEdges += detectEdges(ctx, borderRegion, canvasWidth, canvasHeight)
  }

  return totalEdges / borderRegions.length
}

/**
 * VIN Detection Heuristics
 * VINs are typically on a metal plate with:
 * - High contrast (dark text on light/reflective background)
 * - Rectangular shape
 * - Centered in frame
 * - Good brightness (reflective plate)
 */
export function detectVIN(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement
): DetectionResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { detected: false, confidence: 0, type: 'vin', timestamp: Date.now() }
  }

  // Set canvas size to match video
  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight

  // Draw current frame
  ctx.drawImage(videoElement, 0, 0)

  // VIN plate region (center horizontal band)
  const vinRegion: DetectionRegion = {
    x: 0.2,
    y: 0.4,
    width: 0.6,
    height: 0.2,
  }

  // Run heuristics
  const brightness = analyzeBrightness(ctx, vinRegion, canvas.width, canvas.height)
  const contrast = analyzeContrast(ctx, vinRegion, canvas.width, canvas.height)
  const hasPlate = hasRectangularShape(ctx, vinRegion, canvas.width, canvas.height)

  // VIN plates are usually bright (reflective) with high contrast
  const brightnessScore = brightness > 0.6 ? 1 : brightness / 0.6
  const contrastScore = contrast > 0.5 ? 1 : contrast / 0.5
  const shapeScore = hasPlate

  // Combined confidence (weighted average)
  const confidence = brightnessScore * 0.3 + contrastScore * 0.4 + shapeScore * 0.3

  return {
    detected: confidence > 0.75,
    confidence,
    type: 'vin',
    reason: `Brightness: ${brightness.toFixed(2)}, Contrast: ${contrast.toFixed(2)}, Shape: ${hasPlate.toFixed(2)}`,
    timestamp: Date.now(),
  }
}

/**
 * License Plate Detection Heuristics
 * License plates have:
 * - Distinct rectangular shape (~2:1 aspect ratio)
 * - High contrast
 * - Strong horizontal edges
 * - Centered positioning
 */
export function detectLicensePlate(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement
): DetectionResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { detected: false, confidence: 0, type: 'license-plate', timestamp: Date.now() }
  }

  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  ctx.drawImage(videoElement, 0, 0)

  // License plate region (center, smaller than VIN)
  const plateRegion: DetectionRegion = {
    x: 0.25,
    y: 0.35,
    width: 0.5,
    height: 0.3,
  }

  const brightness = analyzeBrightness(ctx, plateRegion, canvas.width, canvas.height)
  const contrast = analyzeContrast(ctx, plateRegion, canvas.width, canvas.height)
  const hasPlate = hasRectangularShape(ctx, plateRegion, canvas.width, canvas.height)
  const edges = detectEdges(ctx, plateRegion, canvas.width, canvas.height)

  // License plates typically have very high contrast and strong edges
  const contrastScore = contrast > 0.6 ? 1 : contrast / 0.6
  const shapeScore = hasPlate
  const edgeScore = edges

  const confidence = contrastScore * 0.35 + shapeScore * 0.35 + edgeScore * 0.3

  return {
    detected: confidence > 0.8,
    confidence,
    type: 'license-plate',
    reason: `Contrast: ${contrast.toFixed(2)}, Shape: ${hasPlate.toFixed(2)}, Edges: ${edges.toFixed(2)}`,
    timestamp: Date.now(),
  }
}

/**
 * Document Detection Heuristics
 * Documents (receipts, forms, etc.) have:
 * - Rectangular shape
 * - Generally light background
 * - Text creates moderate contrast
 * - Fills most of the frame
 */
export function detectDocument(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement
): DetectionResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { detected: false, confidence: 0, type: 'document', timestamp: Date.now() }
  }

  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  ctx.drawImage(videoElement, 0, 0)

  // Document fills most of frame
  const docRegion: DetectionRegion = {
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  }

  const brightness = analyzeBrightness(ctx, docRegion, canvas.width, canvas.height)
  const contrast = analyzeContrast(ctx, docRegion, canvas.width, canvas.height)
  const hasDoc = hasRectangularShape(ctx, docRegion, canvas.width, canvas.height)

  // Documents are usually bright (white paper) with moderate contrast (text)
  const brightnessScore = brightness > 0.7 ? 1 : brightness / 0.7
  const contrastScore = contrast > 0.3 && contrast < 0.8 ? 1 : 0.5
  const shapeScore = hasDoc

  const confidence = brightnessScore * 0.3 + contrastScore * 0.3 + shapeScore * 0.4

  return {
    detected: confidence > 0.7,
    confidence,
    type: 'document',
    reason: `Brightness: ${brightness.toFixed(2)}, Contrast: ${contrast.toFixed(2)}, Shape: ${hasDoc.toFixed(2)}`,
    timestamp: Date.now(),
  }
}

/**
 * Odometer Detection Heuristics
 * Odometers have:
 * - Small centered region with numbers
 * - Usually high contrast (dark bg, bright numbers or vice versa)
 * - Consistent positioning
 */
export function detectOdometer(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement
): DetectionResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return { detected: false, confidence: 0, type: 'odometer', timestamp: Date.now() }
  }

  canvas.width = videoElement.videoWidth
  canvas.height = videoElement.videoHeight
  ctx.drawImage(videoElement, 0, 0)

  // Odometer region (small center area)
  const odoRegion: DetectionRegion = {
    x: 0.3,
    y: 0.4,
    width: 0.4,
    height: 0.2,
  }

  const contrast = analyzeContrast(ctx, odoRegion, canvas.width, canvas.height)
  const edges = detectEdges(ctx, odoRegion, canvas.width, canvas.height)

  // Odometers need very high contrast for legible numbers
  const contrastScore = contrast > 0.6 ? 1 : contrast / 0.6
  const edgeScore = edges > 0.3 ? 1 : edges / 0.3

  const confidence = contrastScore * 0.6 + edgeScore * 0.4

  return {
    detected: confidence > 0.75,
    confidence,
    type: 'odometer',
    reason: `Contrast: ${contrast.toFixed(2)}, Edges: ${edges.toFixed(2)}`,
    timestamp: Date.now(),
  }
}

/**
 * Main detection dispatcher
 */
export function runAutoDetection(
  videoElement: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  overlayType: CameraOverlayType
): DetectionResult {
  switch (overlayType) {
    case 'vin':
      return detectVIN(videoElement, canvas)
    case 'license-plate':
      return detectLicensePlate(videoElement, canvas)
    case 'document':
      return detectDocument(videoElement, canvas)
    case 'odometer':
      return detectOdometer(videoElement, canvas)
    default:
      return {
        detected: false,
        confidence: 0,
        type: overlayType,
        timestamp: Date.now(),
      }
  }
}
