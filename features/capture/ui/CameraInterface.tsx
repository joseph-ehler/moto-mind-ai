/**
 * Camera Interface Component
 * 
 * Native browser camera with:
 * - Real-time preview
 * - Quality feedback
 * - Mobile-optimized
 * - Permission handling
 * - Capture with analysis
 */

'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Flex, Text, Button } from '@/components/design-system'
import { Camera, X, RotateCcw, Check, AlertTriangle, Zap, ZapOff, Grid3x3 } from 'lucide-react'
import { captureAnalytics } from '@/lib/analytics'
import { compressImage, formatFileSize } from '@/lib/image-processing'
import { analyzePhotoQuality, QualityIssue } from '@/lib/quality-analysis'
import { quickQualityCheck, LiveFeedback } from '@/lib/live-quality-feedback'
import { createCaptureMetadata, CaptureMetadata } from '@/lib/capture-metadata'
import { getBestImageFormat, getFileExtension, getFormatName } from '@/lib/webp-support'
import { FramingGuide } from './FramingGuide'

interface CameraInterfaceProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, preview: string, metadata: CaptureMetadata) => void
  stepLabel?: string
  stepHint?: string
  vehicleId: string
  eventType: string
  stepId?: string
}

export function CameraInterface({
  isOpen,
  onClose,
  onCapture,
  stepLabel,
  stepHint,
  vehicleId,
  eventType,
  stepId
}: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [error, setError] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([])
  const [qualityScore, setQualityScore] = useState<number>(0)
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: string
    compressedSize: string
    ratio: string
  } | null>(null)
  const [compressionData, setCompressionData] = useState<{
    originalSize: number
    compressedSize: number
    compressionRatio: number
    width: number
    height: number
  } | null>(null)
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('auto')
  const [flashSupported, setFlashSupported] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [liveFeedback, setLiveFeedback] = useState<LiveFeedback | null>(null)
  const [retakeCount, setRetakeCount] = useState(0)
  const [captureStartTime, setCaptureStartTime] = useState<number>(0)

  // Initialize camera
  useEffect(() => {
    if (!isOpen) return

    // Track when camera opened for capture duration
    setCaptureStartTime(Date.now())

    const initCamera = async () => {
      try {
        setPermissionState('pending')
        setError(null)

        // Request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer rear camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })

        streamRef.current = stream
        setPermissionState('granted')

        // Check flash support
        const videoTrack = stream.getVideoTracks()[0]
        const capabilities = videoTrack.getCapabilities?.() as any
        if (capabilities && 'torch' in capabilities) {
          setFlashSupported(true)
        }

        // Attach stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Camera initialization error:', err)
        setPermissionState('denied')
        
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError') {
            setError('Camera permission denied. Please enable camera access in your browser settings.')
          } else if (err.name === 'NotFoundError') {
            setError('No camera found on this device.')
          } else {
            setError('Unable to access camera. Please try again.')
          }
        }
      }
    }

    initCamera()

    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isOpen])

  // Live quality feedback (analyze video feed every 500ms)
  useEffect(() => {
    if (!videoRef.current || !isOpen || capturedImage || isCapturing) {
      setLiveFeedback(null)
      return
    }

    const video = videoRef.current
    
    // Wait for video to be ready
    if (video.readyState < 2) {
      const handleCanPlay = () => {
        // Video is ready, start analyzing
      }
      video.addEventListener('canplay', handleCanPlay)
      return () => video.removeEventListener('canplay', handleCanPlay)
    }

    // Analyze every 500ms
    const interval = setInterval(() => {
      if (video.readyState >= 2) {
        try {
          const feedback = quickQualityCheck(video)
          setLiveFeedback(feedback)
        } catch (err) {
          console.error('Live feedback error:', err)
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isOpen, capturedImage, isCapturing])

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Unable to get canvas context')
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Comprehensive quality analysis
      const qualityResult = await analyzePhotoQuality(canvas, {
        eventType,
        stepId,
        requiresText: eventType === 'fuel' || stepId?.includes('receipt')
      })
      
      setQualityIssues(qualityResult.issues)
      setQualityScore(qualityResult.score)

      // Convert to blob using best format (WebP or JPEG)
      const outputFormat = getBestImageFormat()
      const originalBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, outputFormat, 0.95)
      })

      // Compress image using best format
      const compressed = await compressImage(originalBlob, {
        maxWidth: 1600,
        maxHeight: 1200,
        targetSizeKB: 500,
        minQuality: 0.5,
        format: outputFormat
      })

      // Store compression info for display
      setCompressionInfo({
        originalSize: formatFileSize(compressed.originalSize),
        compressedSize: formatFileSize(compressed.compressedSize),
        ratio: `${compressed.compressionRatio.toFixed(1)}x`
      })
      
      // Store compression data for metadata
      setCompressionData({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
        width: compressed.width,
        height: compressed.height
      })

      // Create file from compressed blob with correct extension
      const fileExtension = getFileExtension(outputFormat)
      const file = new File(
        [compressed.blob], 
        `capture-${Date.now()}${fileExtension}`, 
        { type: outputFormat }
      )
      
      // Create preview from compressed blob
      const preview = URL.createObjectURL(compressed.blob)

      setCapturedImage(preview)

      // Track analytics
      if (stepId) {
        captureAnalytics.photoCaptured(vehicleId, eventType, stepId, 'camera')
      }
    } catch (err) {
      console.error('Capture error:', err)
      setError('Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setQualityIssues([])
    setQualityScore(0)
    setCompressionInfo(null)
    setRetakeCount(prev => prev + 1)
    setCaptureStartTime(Date.now()) // Reset timer
    
    if (stepId) {
      captureAnalytics.photoRetaken(vehicleId, eventType, stepId)
    }
  }

  const toggleFlash = async () => {
    if (!streamRef.current || !flashSupported) return

    const videoTrack = streamRef.current.getVideoTracks()[0]
    
    // Cycle through modes: auto → on → off → auto
    const nextMode = flashMode === 'auto' ? 'on' : flashMode === 'on' ? 'off' : 'auto'
    
    try {
      if (nextMode === 'on') {
        await videoTrack.applyConstraints({
          advanced: [{ torch: true } as any]
        })
      } else if (nextMode === 'off' || nextMode === 'auto') {
        await videoTrack.applyConstraints({
          advanced: [{ torch: false } as any]
        })
      }
      
      setFlashMode(nextMode)
    } catch (err) {
      console.error('Flash control error:', err)
    }
  }

  const handleConfirm = async () => {
    if (!capturedImage || !canvasRef.current || !compressionData) return

    // Calculate capture duration
    const captureDuration = Date.now() - captureStartTime

    // Create comprehensive metadata
    const metadata = await createCaptureMetadata({
      eventType,
      stepId,
      qualityScore,
      qualityIssues,
      compressionRatio: compressionData.compressionRatio,
      originalSize: compressionData.originalSize,
      compressedSize: compressionData.compressedSize,
      resolution: {
        width: compressionData.width,
        height: compressionData.height
      },
      flashMode,
      retakeCount,
      captureMethod: 'camera',
      captureDuration,
      includeLocation: true // Request GPS location
    })

    const outputFormat = getBestImageFormat()
    const fileExtension = getFileExtension(outputFormat)
    
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const file = new File(
        [blob], 
        `capture-${Date.now()}${fileExtension}`, 
        { type: outputFormat }
      )
      onCapture(file, capturedImage, metadata)
      onClose()
    }, outputFormat, 0.9)
  }

  const handleClose = () => {
    setCapturedImage(null)
    setQualityIssues([])
    setQualityScore(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <Flex align="center" justify="between">
          <div>
            {stepLabel && (
              <Text className="text-white font-semibold text-lg">
                {stepLabel}
              </Text>
            )}
            {stepHint && (
              <Text className="text-white/70 text-sm mt-1">
                {stepHint}
              </Text>
            )}
          </div>
          
          <Flex align="center" gap="sm">
            {/* Guides Toggle */}
            {!capturedImage && (
              <button
                onClick={() => setShowGuides(!showGuides)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={showGuides ? 'Hide guides' : 'Show guides'}
              >
                <Grid3x3 className={`w-5 h-5 ${showGuides ? 'text-white' : 'text-white/40'}`} />
              </button>
            )}
            
            {/* Flash Control */}
            {flashSupported && !capturedImage && (
              <button
                onClick={toggleFlash}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={`Flash: ${flashMode}`}
              >
                {flashMode === 'off' ? (
                  <ZapOff className="w-5 h-5 text-white/70" />
                ) : flashMode === 'on' ? (
                  <Zap className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Zap className="w-5 h-5 text-white" />
                )}
              </button>
            )}
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </Flex>
        </Flex>
        
        {/* Flash Mode Indicator */}
        {flashSupported && !capturedImage && (
          <div className="mt-2 text-center">
            <Text className="text-white/60 text-xs">
              {flashMode === 'off' && '🔦 Flash Off'}
              {flashMode === 'on' && '💡 Flash On'}
              {flashMode === 'auto' && '⚡ Flash Auto'}
            </Text>
          </div>
        )}
      </div>

      {/* Camera View or Captured Image */}
      <div className="absolute inset-0 flex items-center justify-center">
        {permissionState === 'denied' || error ? (
          /* Permission Denied / Error State */
          <div className="text-center p-6 max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <Text className="text-white text-lg font-semibold mb-2">
              Camera Access Required
            </Text>
            <Text className="text-white/70 text-sm mb-6">
              {error || 'Please grant camera permission to capture photos.'}
            </Text>
            <Button onClick={handleClose} variant="outline" className="bg-white/10 text-white border-white/30">
              Close
            </Button>
          </div>
        ) : capturedImage ? (
          /* Preview Captured Image */
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          /* Live Camera Feed */
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Framing Guide Overlay */}
            <FramingGuide
              eventType={eventType}
              stepId={stepId}
              visible={showGuides && !capturedImage}
            />

            {/* Live Quality Feedback Overlay */}
            {liveFeedback && liveFeedback.messages.length > 0 && (
              <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 space-y-2 max-w-sm px-4">
                {liveFeedback.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`px-4 py-2 rounded-full backdrop-blur-md text-center animate-fadeIn ${
                      liveFeedback.perfect
                        ? 'bg-green-500/90'
                        : 'bg-yellow-500/90'
                    }`}
                  >
                    <Text className="text-white text-sm font-medium">
                      {message}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Quality Feedback Overlay */}
      {capturedImage && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 space-y-2 max-w-md px-4">
          {/* Quality Score */}
          {qualityScore > 0 && (
            <div className={`px-4 py-2 rounded-full backdrop-blur-md ${
              qualityScore >= 80
                ? 'bg-green-500/90' 
                : qualityScore >= 50
                ? 'bg-yellow-500/90'
                : 'bg-red-500/90'
            }`}>
              <Text className="text-white text-sm font-semibold text-center">
                {qualityScore >= 80 && '✅ Excellent Quality'}
                {qualityScore >= 50 && qualityScore < 80 && '⚠️ Good Quality'}
                {qualityScore < 50 && '❌ Poor Quality'}
                {' '}
                ({qualityScore}/100)
              </Text>
            </div>
          )}
          
          {/* Quality Issues */}
          {qualityIssues.length > 0 && (
            <div className="space-y-1">
              {qualityIssues.slice(0, 3).map((issue, index) => (
                <div 
                  key={index}
                  className={`px-3 py-1.5 rounded-full backdrop-blur-md text-center ${
                    issue.severity === 'error'
                      ? 'bg-red-500/80'
                      : issue.severity === 'warning'
                      ? 'bg-yellow-500/80'
                      : 'bg-blue-500/80'
                  }`}
                >
                  <Text className="text-white text-xs font-medium">
                    {issue.icon} {issue.message}
                  </Text>
                </div>
              ))}
            </div>
          )}
          
          {/* Compression Info */}
          {compressionInfo && (
            <div className="px-3 py-1.5 rounded-full backdrop-blur-md bg-black/70">
              <Text className="text-white/80 text-xs text-center">
                📦 {compressionInfo.originalSize} → {compressionInfo.compressedSize} ({compressionInfo.ratio}) · {getFormatName(getBestImageFormat())}
              </Text>
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls */}
      {permissionState === 'granted' && !error && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
          {capturedImage ? (
            /* Preview Controls */
            <Flex justify="center" gap="md" className="max-w-md mx-auto">
              <button
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
              >
                <Check className="w-5 h-5" />
                Use Photo
              </button>
            </Flex>
          ) : (
            /* Capture Button */
            <Flex justify="center">
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className={`w-20 h-20 rounded-full bg-white hover:bg-gray-200 active:scale-95 transition-all duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl ${
                  liveFeedback?.perfect ? 'ring-4 ring-green-400 animate-pulse' : ''
                }`}
              >
                <div className="w-16 h-16 rounded-full border-4 border-black" />
              </button>
            </Flex>
          )}
        </div>
      )}
    </div>
  )
}
