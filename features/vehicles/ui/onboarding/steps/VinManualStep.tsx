import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { Camera, Upload, CheckCircle, Loader2, X, RotateCcw, Zap } from 'lucide-react'

interface VINInputSimpleProps {
  onVINConfirmed: (vin: string) => void
  onError: (error: string) => void
}

export function VINInputSimple({ onVINConfirmed, onError }: VINInputSimpleProps) {
  const [vin, setVIN] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simple VIN validation (17 characters, alphanumeric, no I, O, Q)
  const validateVIN = useCallback((vinValue: string) => {
    const cleanVIN = vinValue.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const isValidFormat = /^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVIN)
    return { isValid: isValidFormat, cleanVIN }
  }, [])

  const handleVINChange = useCallback((value: string) => {
    const { isValid: valid, cleanVIN } = validateVIN(value)
    setVIN(cleanVIN)
    setIsValid(valid)
  }, [validateVIN])

  const handleContinue = useCallback(() => {
    if (isValid && vin) {
      onVINConfirmed(vin)
    }
  }, [isValid, vin, onVINConfirmed])

  // Camera functionality
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setShowCamera(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      onError('Camera access denied. Please use manual entry or upload a photo.')
    }
  }, [onError])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
  }, [])

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)

    // Convert to blob and process with OCR
    canvas.toBlob(async (blob) => {
      if (!blob) return
      
      setIsValidating(true)
      try {
        const formData = new FormData()
        formData.append('image', blob, 'vin-capture.jpg')

        const response = await fetch('/api/ocr/extract-vin', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        
        if (data.success && data.vin) {
          handleVINChange(data.vin)
          stopCamera()
        } else {
          onError('Could not detect VIN in photo. Please try again or enter manually.')
        }
      } catch (err) {
        console.error('OCR error:', err)
        onError('Failed to process image. Please try manual entry.')
      } finally {
        setIsValidating(false)
      }
    }, 'image/jpeg', 0.8)
  }, [handleVINChange, stopCamera, onError])

  // File upload functionality
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsValidating(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/ocr/extract-vin', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success && data.vin) {
        handleVINChange(data.vin)
      } else {
        onError('Could not detect VIN in image. Please try again or enter manually.')
      }
    } catch (err) {
      console.error('Upload OCR error:', err)
      onError('Failed to process image. Please try manual entry.')
    } finally {
      setIsValidating(false)
    }
  }, [handleVINChange, onError])

  if (showCamera) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Capture VIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={stopCamera} className="flex-1">
              Cancel
            </Button>
            <Button onClick={capturePhoto} disabled={isValidating} className="flex-1">
              {isValidating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Capture
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter Vehicle VIN</CardTitle>
        <p className="text-sm text-gray-600">
          Find your VIN on the dashboard, door jamb, or registration
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Methods */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={startCamera}
            disabled={isValidating}
            className="flex flex-col items-center py-6 h-auto"
          >
            <Camera className="mb-2" size={24} />
            <span className="text-sm">Camera</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isValidating}
            className="flex flex-col items-center py-6 h-auto"
          >
            <Upload className="mb-2" size={24} />
            <span className="text-sm">Upload</span>
          </Button>
          
          <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
            <span className="text-sm text-gray-600">or type below</span>
          </div>
        </div>

        {/* VIN Input */}
        <div className="space-y-2">
          <Label htmlFor="vin">VIN (17 characters)</Label>
          <div className="relative">
            <Input
              id="vin"
              value={vin}
              onChange={(e) => handleVINChange(e.target.value)}
              placeholder="Enter VIN..."
              maxLength={17}
              className="pr-10"
              disabled={isValidating}
            />
            {isValidating && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
            {isValid && !isValidating && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{vin.length}/17 characters</span>
            {isValid && <span className="text-green-600">✓ Valid VIN</span>}
          </div>
        </div>

        {/* Continue Button */}
        <Button 
          onClick={handleContinue}
          disabled={!isValid || isValidating}
          className="w-full"
          size="lg"
        >
          Continue
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
