'use client'

import React from 'react'
import { Camera, ArrowLeft, AlertTriangle, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Types for different capture scenarios
export type CaptureType = 'document' | 'vin' | 'license_plate' | 'odometer' | 'receipt' | 'dashboard_snapshot'
export type CaptureState = 'idle' | 'choice' | 'camera' | 'processing' | 'success' | 'error'

export type FrameGuideType = 
  | 'document-frame'      // Large rectangular for documents
  | 'vin-plate'          // Narrow rectangle for VIN plates  
  | 'license-plate'      // License plate dimensions
  | 'odometer-display'   // Circular/digital display
  | 'receipt-frame'      // Receipt dimensions
  | 'dashboard-cluster'   // Full dashboard view

export interface CaptureResult<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
  processed_at: string
}

export interface UnifiedCameraCaptureProps {
  // Core configuration
  captureType: CaptureType
  frameGuide: FrameGuideType
  instructions: string
  
  // Callbacks
  onCapture: (result: CaptureResult) => void
  onCancel?: () => void
  
  // Processing
  processingAPI: string
  vehicleId?: string
  
  // UI customization
  title?: string
  allowFileUpload?: boolean
  
  // Advanced options
  cameraConstraints?: MediaStreamConstraints['video']
  maxRetries?: number
  autoStartCamera?: boolean
}

export function UnifiedCameraCapture({
  captureType,
  frameGuide,
  instructions,
  onCapture,
  onCancel,
  processingAPI,
  vehicleId,
  title,
  allowFileUpload = true,
  cameraConstraints,
  maxRetries = 3,
  autoStartCamera = false
}: UnifiedCameraCaptureProps) {
  // State management
  const [currentState, setCurrentState] = React.useState<CaptureState>('idle')
  const [capturedData, setCapturedData] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  // Refs for camera and canvas
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const isStartingCamera = React.useRef<boolean>(false)
  const userRequestedCamera = React.useRef<boolean>(false)
  const allStreams = React.useRef<MediaStream[]>([])
  
  // Detect if mobile (back camera = no mirror) or desktop (front camera = mirror)
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      console.log('📱 Device detection:', { 
        mobile, 
        width: window.innerWidth, 
        userAgent: navigator.userAgent 
      })
      setIsMobile(mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Camera lifecycle management
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      globalCameraCleanup()
    }
  }, [])

  // Auto-start camera if requested (only once)
  React.useEffect(() => {
    if (autoStartCamera && currentState === 'choice') {
      console.log('🚀 Auto-starting camera due to autoStartCamera prop')
      setCurrentState('camera')
    }
  }, [autoStartCamera]) // Remove currentState from dependencies to prevent loop

  // Global camera cleanup function
  const globalCameraCleanup = () => {
    console.log('🧹 Global camera cleanup initiated')
    
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`🛑 Stopping track: ${track.kind}`)
        track.stop()
      })
      streamRef.current = null
    }
    
    // Stop all tracked streams
    allStreams.current.forEach(stream => {
      stream.getTracks().forEach(track => {
        console.log(`🛑 Stopping tracked stream: ${track.kind}`)
        track.stop()
      })
    })
    allStreams.current = []
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    console.log('✅ Global camera cleanup complete')
  }

  // Start camera function
  const startCamera = async () => {
    if (isStartingCamera.current) {
      console.log('⏳ Camera start already in progress, skipping...')
      return
    }

    isStartingCamera.current = true
    console.log(`📹 Starting camera for ${captureType}...`)
    
    try {
      setError(null)
      
      // Stop any existing streams first
      globalCameraCleanup()
      
      const constraints: MediaStreamConstraints = {
        video: cameraConstraints || {
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      
      console.log('📹 Requesting camera access with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Track this stream for cleanup
      streamRef.current = stream
      allStreams.current.push(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('✅ Camera stream connected to video element')
      }
      
    } catch (err) {
      console.error('❌ Camera access failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied'
      setError(`Camera access failed: ${errorMessage}`)
    } finally {
      isStartingCamera.current = false
    }
  }

  // Stop camera function
  const stopCamera = () => {
    console.log(`🛑 Stopping camera for ${captureType}...`)
    globalCameraCleanup()
    console.log('✅ Camera stop complete')
  }

  // Capture photo function
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return
    
    console.log(`📸 Capturing photo for ${captureType}...`)
    setIsProcessing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) throw new Error('Canvas context not available')
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Capture video frame as-is (no mirroring)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to capture image')
        
        console.log(`📁 Image captured: ${blob.size} bytes`)
        
        // Stop camera before processing
        stopCamera()
        setCurrentState('processing')
        
        // Process the image
        await processImage(blob)
      }, 'image/jpeg', 0.9)
      
    } catch (err) {
      console.error('❌ Photo capture failed:', err)
      setError(err instanceof Error ? err.message : 'Photo capture failed')
      setIsProcessing(false)
    }
  }

  // Process image function
  const processImage = async (file: File | Blob) => {
    console.log(`🔄 Processing ${captureType} image...`)
    console.log(`🔄 Processing API: ${processingAPI}`)
    console.log(`🔄 Document type: ${captureType}`)
    console.log(`🔄 Vehicle ID prop:`, vehicleId)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('document_type', captureType)
      formData.append('mode', 'auto')
      if (vehicleId) {
        formData.append('vehicle_id', vehicleId)
        console.log(`✅ Added vehicle_id to FormData:`, vehicleId)
      } else {
        console.warn(`⚠️ No vehicle_id provided - image will not be stored!`)
      }
      
      console.log(`🔄 FormData contents:`, {
        image: file instanceof File ? file.name : 'blob',
        document_type: captureType,
        mode: 'auto',
        vehicle_id: vehicleId || 'NOT PROVIDED'
      })
      
      const response = await fetch(processingAPI, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log(`✅ ${captureType} processing complete:`, result)
      
      onCapture({
        success: true,
        data: result,
        processed_at: new Date().toISOString(),
        confidence: result.data?.confidence || result.confidence || 0.8
      })
      
    } catch (err) {
      console.error(`❌ ${captureType} processing error:`, err)
      
      // Retry logic
      if (maxRetries > 0) {
        console.log(`🔄 Retrying... (${maxRetries} attempts left)`)
        setTimeout(() => processImage(file), 2000)
        return
      }
      
      onCapture({
        success: false,
        error: err instanceof Error ? err.message : 'Processing failed',
        processed_at: new Date().toISOString()
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log(`📁 File upload for ${captureType}:`, file.name)
    setIsProcessing(true)
    setCurrentState('processing')
    
    await processImage(file)
  }

  // Handle file upload button click
  const handleUploadClick = () => {
    console.log('📤 Upload button clicked')
    console.log('📤 File input ref:', fileInputRef.current)
    
    if (fileInputRef.current) {
      console.log('📤 Triggering click on file input ref...')
      fileInputRef.current.value = '' // Reset value to allow same file selection
      fileInputRef.current.click()
    } else {
      console.error('📤 File input ref not available')
    }
  }

  const handleStartCamera = () => {
    console.log(`👆 User clicked "Take Photo" for ${captureType} - enabling camera...`)
    userRequestedCamera.current = true
    setCurrentState('camera')
  }

  const handleBack = () => {
    console.log(`⬅️ Back button pressed from ${currentState}`)
    if (currentState === 'camera') {
      stopCamera()
      if (autoStartCamera) {
        // If auto-started, cancel completely instead of going to choice
        onCancel?.()
      } else {
        setCurrentState('choice')
      }
    }
  }

  const handleCancel = () => {
    console.log(`❌ Cancel pressed for ${captureType}`)
    stopCamera()
    onCancel?.()
  }

  // Processing view
  if (currentState === 'processing') {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-2">Processing Image</div>
          <div className="text-sm text-gray-600">Please wait while we analyze your {captureType.replace('_', ' ')}...</div>
        </div>
      </div>
    )
  }

  if (currentState === 'camera') {
    return <FullScreenCameraView />
  }

  // Skip choice view if autoStartCamera is true
  if (autoStartCamera) {
    return <FullScreenCameraView />
  }

  // Choice view
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md mx-4 w-full">
        <div className="p-6">
          <div className="text-center mb-8">
            <Camera className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <div className="text-xl font-semibold text-gray-900 mb-2">
              {title || `Capture ${captureType.replace('_', ' ')}`}
            </div>
            <div className="text-sm text-gray-600">
              {isMobile ? 'Choose how to capture' : 'Take a photo or choose from files'}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleStartCamera}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-3" />
              Take Photo
            </Button>

            {allowFileUpload && (
              <label 
                htmlFor={`file-input-${captureType}`} 
                className="block w-full h-14 text-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer flex items-center justify-center font-medium transition-colors"
              >
                <Upload className="w-5 h-5 mr-3" />
                Upload Photo
              </label>
            )}

            <Button
              onClick={handleCancel}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>

          {/* Hidden file input */}
          <input
            id={`file-input-${captureType}`}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )

  // Full screen camera component
  function FullScreenCameraView() {
    React.useEffect(() => {
      console.log(`📹 FullScreenCameraView mounted for ${captureType}, starting camera...`)
      startCamera()
      return () => {
        console.log(`📹 FullScreenCameraView unmounting for ${captureType}`)
        stopCamera()
      }
    }, [])

    if (error) {
      return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="p-6 text-center max-w-sm mx-4">
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
            <div className="text-lg font-medium text-white mb-2">Camera Error</div>
            <div className="text-sm text-gray-300 mb-6">{error}</div>
            <Button onClick={() => setError(null)} className="w-full" size="lg">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    // Log video state
    React.useEffect(() => {
      console.log('🎥 Video transform: NONE - Using raw camera feed (no mirroring)')
      console.log('📱 Device detected as:', isMobile ? 'Mobile' : 'Desktop')
    }, [isMobile])

    return (
      <div className="fixed inset-0 z-50 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        <FrameGuide type={frameGuide} />

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-center mb-6">
            <div className="text-white text-lg font-medium mb-2">{instructions}</div>
            {isProcessing && (
              <div className="text-blue-400 text-sm">Processing image...</div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-6">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="lg"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>

            <Button
              onClick={capturePhoto}
              disabled={isProcessing}
              size="lg"
              className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-100 disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-8 h-8" />
              )}
            </Button>

            <div className="w-16" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>
    )
  }
}

// Frame guide component
function FrameGuide({ type }: { type: FrameGuideType }) {
  const getFrameStyle = () => {
    switch (type) {
      case 'vin-plate':
        return 'w-80 h-20'
      case 'license-plate':
        return 'w-72 h-16'
      case 'odometer-display':
        return 'w-64 h-32 rounded-2xl'
      case 'receipt-frame':
        return 'w-64 h-80'
      case 'dashboard-cluster':
        return 'w-96 h-64 rounded-xl'
      default:
        return 'w-72 h-96'
    }
  }

  const getBorderStyle = () => {
    return 'border-2 border-white/60 border-dashed'
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className={`${getFrameStyle()} ${getBorderStyle()}`}>
        {type === 'dashboard-cluster' && (
          <div className="absolute -top-8 left-0 right-0 text-center">
            <div className="text-white text-sm bg-black/50 px-3 py-1 rounded-full inline-block">
              Include gauges and warning lights
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
