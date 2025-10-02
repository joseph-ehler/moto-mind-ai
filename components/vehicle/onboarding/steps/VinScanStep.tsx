import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Upload, CheckCircle, Loader2, X, RotateCcw, Zap, AlertCircle } from 'lucide-react'

interface VinScanStepProps {
  onVINConfirmed: (vin: string) => void
  onError: (error: string) => void
}

export function VinScanStep({ onVINConfirmed, onError }: VinScanStepProps) {
  const [vin, setVIN] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [detectedVIN, setDetectedVIN] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanConfidence, setScanConfidence] = useState(0)
  const [scanLock, setScanLock] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScanTimeRef = useRef<number>(0)

  // VIN validation regex (17 characters, no I, O, Q)
  const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/
  
  const validateVIN = useCallback((vinValue: string) => {
    const cleanVIN = vinValue.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const isValidFormat = VIN_REGEX.test(cleanVIN)
    return { isValid: isValidFormat, cleanVIN }
  }, [])

  const handleVINChange = useCallback((value: string) => {
    const { isValid: valid, cleanVIN } = validateVIN(value)
    setVIN(cleanVIN)
    setIsValid(valid)
  }, [validateVIN])

  const handleContinue = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (isValid && vin) {
      onVINConfirmed(vin)
    } else if (isValid && vin.length === 17) {
      onVINConfirmed(vin)
    }
  }, [isValid, vin, onVINConfirmed])

  // Live VIN scanning function with scan lock
  const scanVideoForVIN = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoReady || isScanning || scanLock) {
      return
    }

    const now = Date.now()
    if (now - lastScanTimeRef.current < 3000) {
      return
    }

    lastScanTimeRef.current = now
    setIsScanning(true)

    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Convert to blob for processing
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        }, 'image/jpeg', 0.7)
      })

      // Process with OCR API
      const formData = new FormData()
      formData.append('image', blob, 'live-scan.jpg')

      console.log('📤 Sending live scan request to OCR API...')
      const response = await fetch('/api/ocr/extract-vin', {
        method: 'POST',
        body: formData
      })

      console.log('📥 Live scan response status:', response.status)
      const data = await response.json()
      console.log('📊 Live scan response data:', data)
      
      if (data.success && data.vin) {
        const { isValid } = validateVIN(data.vin)
        if (isValid) {
          console.log('✅ Valid VIN detected:', data.vin, 'Confidence:', data.confidence)
          setDetectedVIN(data.vin)
          setScanConfidence(data.confidence * 100)
          
          // CRITICAL: Stop scanning immediately after successful detection
          setScanLock(true)
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
            console.log('🛑 Stopped live scanning after successful detection')
          }
          
          // Auto-confirm if confidence is high enough
          if (data.confidence > 0.8) {
            handleVINChange(data.vin)
            // Auto-advance after a brief delay to show the detection
            setTimeout(() => {
              onVINConfirmed(data.vin)
            }, 1500)
          }
        } else {
          console.log('❌ Invalid VIN format detected:', data.vin, '- ignoring')
        }
      } else {
        // Clear detection if no VIN found (this is normal)
        setDetectedVIN(null)
        setScanConfidence(0)
        
        // Don't log "no VIN found" as an error - it's expected
        if (data.error !== 'Could not extract VIN from image') {
          console.log('OCR processing result:', data.message || 'No VIN detected')
        }
      }
    } catch (error) {
      console.error('Live scan error:', error)
      // Don't show errors for live scanning to avoid spam
    } finally {
      setIsScanning(false)
    }
  }, [videoReady, isScanning, scanLock, validateVIN, handleVINChange, onVINConfirmed])

  // Start live scanning when video is ready
  useEffect(() => {
    if (videoReady && showCamera && !scanLock) {
      scanIntervalRef.current = setInterval(scanVideoForVIN, 3000)
      return () => {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current)
          scanIntervalRef.current = null
        }
      }
    }
  }, [videoReady, showCamera, scanLock, scanVideoForVIN])

  const startCamera = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    try {
      console.log('🎥 Requesting camera access...')
      setCameraError(null)
      setVideoReady(false)
      setShowCamera(true)
      setScanLock(false) // Reset scan lock when starting camera
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📹 Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('▶️ Video playing successfully')
              setVideoReady(true)
            }).catch((error) => {
              console.error('❌ Video play error:', error)
              setCameraError('Failed to start video playback')
            })
          }
        }
        
        videoRef.current.oncanplay = () => {
          console.log('📺 Video can play')
          setVideoReady(true)
        }
        
        // Fallback timeout
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            setVideoReady(true)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Camera error:', error)
      setCameraError('Camera access denied or not available')
      onError('Camera access denied. Please enable camera permissions.')
    }
  }, [onError])

  const stopCamera = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setShowCamera(false)
    setCameraError(null)
    setVideoReady(false)
    setDetectedVIN(null)
    setIsScanning(false)
    setScanConfidence(0)
    setScanLock(false)
  }, [])

  const capturePhoto = useCallback(async (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    try {
      setIsProcessing(true)
      setProcessingMessage('Capturing image...')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create blob'))
        }, 'image/jpeg', 0.9)
      })

      const formData = new FormData()
      formData.append('image', blob, 'captured-vin.jpg')

      setProcessingMessage('Processing with OCR...')
      
      const response = await fetch('/api/ocr/extract-vin', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.vin) {
        const { isValid, cleanVIN } = validateVIN(data.vin)
        if (isValid) {
          handleVINChange(cleanVIN)
          setIsProcessing(false)
          setProcessingMessage('')
        } else {
          setIsProcessing(false)
          setProcessingMessage('')
          onError('Invalid VIN format detected. Please try again.')
        }
      } else {
        setIsProcessing(false)
        setProcessingMessage('')
        onError(data.message || 'Could not extract VIN from image')
      }
    } catch (error) {
      setIsProcessing(false)
      setProcessingMessage('')
      onError('Failed to process image. Please try again.')
    }
  }, [handleVINChange, onError, validateVIN])

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file')
      return
    }

    try {
      setIsProcessing(true)
      setProcessingMessage('Uploading image...')

      const formData = new FormData()
      formData.append('image', file)

      setProcessingMessage('Processing with OCR...')
      
      const response = await fetch('/api/ocr/extract-vin', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.vin) {
        const { isValid, cleanVIN } = validateVIN(data.vin)
        if (isValid) {
          handleVINChange(cleanVIN)
          setIsProcessing(false)
          setProcessingMessage('')
        } else {
          setIsProcessing(false)
          setProcessingMessage('')
          onError('Invalid VIN format detected. Please try again.')
        }
      } else {
        setIsProcessing(false)
        setProcessingMessage('')
        onError(data.message || 'Could not extract VIN from image')
      }
    } catch (error) {
      setIsProcessing(false)
      setProcessingMessage('')
      onError('Failed to process image. Please try again.')
    }
  }, [handleVINChange, onError, validateVIN])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    } else {
      onError('No files found in drop')
    }
  }, [handleFileUpload, onError])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Camera view
  if (showCamera) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Capture VIN</CardTitle>
            <Button variant="ghost" size="sm" onClick={stopCamera}>
              <X size={20} />
            </Button>
          </div>
          <p className="text-sm text-gray-600">Position the VIN within the frame</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-black min-h-[320px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-h-[400px] object-cover rounded-none"
              style={{ 
                transform: 'scaleX(-1)', // Mirror for front-facing camera
                minHeight: '320px'
              }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Loading state when camera is starting */}
            {!videoReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
                  <p className="text-sm">Starting camera...</p>
                  <p className="text-xs text-gray-400 mt-1">Please allow camera access</p>
                </div>
              </div>
            )}

            {/* Camera overlay with VIN alignment zone */}
            <div className="absolute inset-0 pointer-events-none">
              {/* VIN alignment rectangle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative w-80 h-16 max-w-[90%] transition-all duration-300 ${
                  detectedVIN ? 'border-4 border-green-400 shadow-lg shadow-green-400/50' : ''
                }`}>
                  {/* Semi-transparent overlay outside the VIN zone */}
                  <div className={`absolute inset-0 rounded-lg transition-colors duration-300 ${
                    detectedVIN ? 'bg-green-500/20' : 'bg-black/40'
                  }`}></div>
                  
                  {/* Corner markers */}
                  <div className={`absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-300 ${
                    detectedVIN ? 'border-green-400' : 'border-white'
                  }`}></div>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-300 ${
                    detectedVIN ? 'border-green-400' : 'border-white'
                  }`}></div>
                  <div className={`absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-300 ${
                    detectedVIN ? 'border-green-400' : 'border-white'
                  }`}></div>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors duration-300 ${
                    detectedVIN ? 'border-green-400' : 'border-white'
                  }`}></div>
                  
                  {/* Center guide or detected VIN */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {detectedVIN ? (
                      <div className="text-green-400 text-sm font-bold bg-black/80 px-3 py-2 rounded-lg border border-green-400/50">
                        ✓ {detectedVIN}
                      </div>
                    ) : (
                      <div className="text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                        VIN (17 characters)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Live scanning indicator */}
              {isScanning && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-2 text-white text-sm bg-blue-600/80 px-3 py-2 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Scanning...</span>
                  </div>
                </div>
              )}
              
              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className={`text-white text-sm px-4 py-2 rounded-full text-center transition-colors duration-300 ${
                  detectedVIN ? 'bg-green-600/80' : 'bg-black/70'
                }`}>
                  {detectedVIN ? '🎉 VIN Detected! Auto-advancing...' : '📍 Align VIN plate within the frame'}
                </div>
              </div>
            </div>
            
            {/* Error overlay */}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white p-6">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
                  <h3 className="text-lg font-medium mb-2">Camera Error</h3>
                  <p className="text-sm text-gray-300 mb-4">{cameraError}</p>
                  <Button variant="outline" onClick={stopCamera} className="text-white border-white hover:bg-white hover:text-black">
                    Use Upload Instead
                  </Button>
                </div>
              </div>
            )}
            
            {/* Camera controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={stopCamera}
                className="bg-black/60 text-white border-white/30 hover:bg-black/80"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              
              <div className="flex space-x-2">
                {/* Demo button for testing */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Simulate VIN detection for demo
                    const demoVIN = '1HGBH41JXMN109186'
                    setDetectedVIN(demoVIN)
                    setScanConfidence(95)
                    setScanLock(true)
                    setTimeout(() => {
                      handleVINChange(demoVIN)
                      setTimeout(() => onVINConfirmed(demoVIN), 1500)
                    }, 1000)
                  }}
                  className="bg-green-600/80 text-white border-green-400/30 hover:bg-green-700/80"
                >
                  🎯 Demo
                </Button>
                
                <Button
                  size="sm"
                  onClick={capturePhoto}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="mr-1 animate-spin" />
                  ) : (
                    <Camera size={16} className="mr-1" />
                  )}
                  {isProcessing ? 'Processing...' : 'Capture VIN'}
                </Button>
              </div>
            </div>
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
        {/* Processing Status */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Processing...</p>
                <p className="text-xs text-blue-700">{processingMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Capture Options - Side by Side Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Camera Option */}
          <div className="space-y-3">
            <Button
              onClick={startCamera}
              disabled={isProcessing}
              className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6" />
                  <span className="text-sm font-medium">Capture VIN</span>
                </>
              )}
            </Button>
          </div>

          {/* Upload Option */}
          <div className="space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">
                {dragActive ? 'Drop here' : 'Upload Image'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-sm text-gray-500 px-2">or enter manually</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vin">VIN (17 characters)</Label>
            <div className="relative">
              <Input
                id="vin"
                value={vin}
                onChange={(e) => handleVINChange(e.target.value)}
                placeholder="Enter 17-character VIN"
                maxLength={17}
                className="uppercase"
                disabled={isProcessing}
              />
              {isProcessing && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
              {isValid && vin.length === 17 && !isProcessing && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex justify-between text-xs">
              <span className={vin.length === 17 ? 'text-green-600' : 'text-gray-500'}>
                {vin.length}/17 characters
              </span>
              {isValid && vin.length === 17 && (
                <span className="text-green-600 flex items-center space-x-1">
                  <CheckCircle size={12} />
                  <span>Valid VIN format</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={!isValid || vin.length !== 17 || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Continue with VIN
            </>
          )}
        </Button>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Tips for best results:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• VIN is usually on the dashboard (visible through windshield)</li>
            <li>• Also check the driver's side door jamb</li>
            <li>• Ensure good lighting and hold camera steady</li>
            <li>• VIN contains 17 characters (no I, O, or Q)</li>
          </ul>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
