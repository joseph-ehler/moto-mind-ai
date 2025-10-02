// Photo Capture Component - For receipts, odometer readings, etc.
import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  X, 
  RotateCcw, 
  Check,
  Upload,
  Loader2
} from 'lucide-react'

interface PhotoCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File, type: 'receipt' | 'odometer' | 'general') => void
  captureType?: 'receipt' | 'odometer' | 'general'
}

export function PhotoCapture({ isOpen, onClose, onCapture, captureType = 'general' }: PhotoCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Fallback to file input if camera fails
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Flip the canvas horizontally to un-mirror the video (since video preview is mirrored)
    context.save()
    context.scale(-1, 1)
    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
    context.restore()

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)
      }
    }, 'image/jpeg', 0.8)
  }

  const confirmCapture = () => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${captureType}-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file, captureType)
        resetCapture()
      }
      setIsProcessing(false)
    }, 'image/jpeg', 0.8)
  }

  const resetCapture = () => {
    setCapturedImage(null)
    stopCamera()
    onClose()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onCapture(file, captureType)
      resetCapture()
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      setCapturedImage(null)
    }

    return () => stopCamera()
  }, [isOpen])

  if (!isOpen) return null

  const getCaptureTitle = () => {
    switch (captureType) {
      case 'receipt': return 'Capture Receipt'
      case 'odometer': return 'Capture Odometer'
      default: return 'Take Photo'
    }
  }

  const getCaptureHint = () => {
    switch (captureType) {
      case 'receipt': return 'Position receipt clearly in frame. We\'ll extract the details automatically.'
      case 'odometer': return 'Center the odometer reading in the frame for best accuracy.'
      default: return 'Take a clear photo for processing.'
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
        <div className="flex items-center justify-between text-white">
          <button onClick={resetCapture} className="p-2">
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="font-medium">{getCaptureTitle()}</h2>
            <p className="text-sm text-gray-300">{getCaptureHint()}</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Camera View or Captured Image */}
      <div className="relative w-full h-full">
        {!capturedImage ? (
          <>
            {/* Live Camera */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            
            {/* Capture Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
              <div className="flex items-center justify-center gap-6">
                {/* File Upload Alternative */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white/20 rounded-full text-white"
                >
                  <Upload className="w-6 h-6" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
                  disabled={!stream}
                >
                  <Camera className="w-8 h-8 text-gray-900" />
                </button>

                {/* Spacer */}
                <div className="w-12" />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Captured Image Preview */}
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            
            {/* Confirm Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
              <div className="flex items-center justify-center gap-6">
                {/* Retake */}
                <button
                  onClick={() => {
                    setCapturedImage(null)
                    startCamera()
                  }}
                  className="p-3 bg-white/20 rounded-full text-white"
                >
                  <RotateCcw className="w-6 h-6" />
                </button>

                {/* Confirm */}
                <button
                  onClick={confirmCapture}
                  disabled={isProcessing}
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Check className="w-8 h-8" />
                  )}
                </button>

                {/* Spacer */}
                <div className="w-12" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  )
}
