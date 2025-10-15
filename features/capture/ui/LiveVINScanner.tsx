// Live VIN Scanner - Real-time camera with automatic VIN detection
import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Camera, 
  X, 
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Keyboard,
  Zap
} from 'lucide-react'

interface LiveVINScannerProps {
  onVINDetected: (result: any) => void
  onManualEntry: () => void
  onClose: () => void
}

export function LiveVINScanner({ 
  onVINDetected,
  onManualEntry,
  onClose
}: LiveVINScannerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const scanIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const [isScanning, setIsScanning] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [detectedVIN, setDetectedVIN] = React.useState<string | null>(null)
  const [cameraReady, setCameraReady] = React.useState(false)
  const [showManualEntry, setShowManualEntry] = React.useState(false)
  const [manualVIN, setManualVIN] = React.useState('')

  // Start camera when component mounts
  React.useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true)
          startAutoScanning()
        }
      }
    } catch (error) {
      console.error('Camera access error:', error)
      setError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setCameraReady(false)
  }

  const startAutoScanning = () => {
    if (scanIntervalRef.current) return
    
    setIsScanning(true)
    // Scan every 2 seconds for VIN
    scanIntervalRef.current = setInterval(() => {
      if (!isProcessing) {
        captureAndScanFrame()
      }
    }, 2000)
  }

  const stopAutoScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }

  const captureAndScanFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    setIsProcessing(true)
    
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return

      // Set canvas size to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to blob and scan for VIN
      canvas.toBlob(async (blob) => {
        if (!blob) return
        
        const formData = new FormData()
        formData.append('image', blob, 'vin-scan.jpg')

        try {
          const response = await fetch('/api/scan-vin', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success && result.vin) {
              console.log('🎯 VIN detected automatically:', result.vin)
              setDetectedVIN(result.vin)
              stopAutoScanning()
              
              // Brief delay to show detection, then proceed
              setTimeout(() => {
                onVINDetected({
                  vin: result.vin,
                  confidence: result.confidence,
                  vehicle: result.vehicle
                })
              }, 1000)
            }
          }
        } catch (error) {
          console.log('Scan attempt failed, continuing...', error)
          // Don't show error for auto-scan failures, just continue
        }
      }, 'image/jpeg', 0.8)
      
    } catch (error) {
      console.log('Frame capture failed, continuing...', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualCapture = async () => {
    stopAutoScanning()
    setIsProcessing(true)
    
    try {
      await captureAndScanFrame()
      
      // If no VIN detected after manual capture, show error
      setTimeout(() => {
        if (!detectedVIN) {
          setError('No VIN detected in this frame. Try adjusting the angle or lighting.')
          setIsProcessing(false)
          startAutoScanning() // Resume auto-scanning
        }
      }, 2000)
      
    } catch (error) {
      setError('Failed to capture image. Please try again.')
      setIsProcessing(false)
      startAutoScanning()
    }
  }

  const handleManualVINSubmit = async () => {
    if (manualVIN.length !== 17) {
      setError('VIN must be exactly 17 characters')
      return
    }

    setIsProcessing(true)
    
    try {
      // Validate and decode the manually entered VIN
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: manualVIN.toUpperCase() })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          onVINDetected({
            vin: manualVIN.toUpperCase(),
            confidence: 95, // High confidence for manual entry
            vehicle: {
              year: result.specs.year,
              make: result.specs.make,
              model: result.specs.model,
              trim: result.specs.trim,
              engine: result.specs.engine?.model,
              transmission: result.specs.transmission,
              drivetrain: result.specs.drivetrain,
              fuel_type: result.specs.engine?.fuel_type,
              body_style: result.specs.body_class
            }
          })
        } else {
          setError(result.details || 'Invalid VIN or unable to decode vehicle details')
        }
      } else {
        setError('Invalid VIN or unable to decode vehicle details')
      }
    } catch (error) {
      setError('Failed to process VIN. Please check the number and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setDetectedVIN(null)
    setShowManualEntry(false)
    setManualVIN('')
    startAutoScanning()
  }

  if (showManualEntry) {
    return (
      <div className="p-6">
        <div className="text-center mb-6">
          <Keyboard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Enter VIN Manually
          </h3>
          <p className="text-sm text-gray-600">
            Type the 17-character Vehicle Identification Number
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VIN (17 characters)
            </label>
            <input
              type="text"
              value={manualVIN}
              onChange={(e) => setManualVIN(e.target.value.toUpperCase())}
              placeholder="1HGBH41JXMN109186"
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg tracking-wider"
            />
            <div className="text-xs text-gray-500 mt-1">
              {manualVIN.length}/17 characters
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleManualVINSubmit}
              disabled={manualVIN.length !== 17 || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Decode VIN'
              )}
            </Button>

            <Button
              onClick={() => setShowManualEntry(false)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Use Camera Instead
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {!cameraReady && !error && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            Starting Camera...
          </div>
          <div className="text-sm text-gray-600">
            Please allow camera access when prompted
          </div>
        </div>
      )}

      {error && (
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <div className="text-lg font-medium text-gray-900 mb-2">
            Camera Error
          </div>
          <div className="text-sm text-gray-600 mb-6">
            {error}
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => setShowManualEntry(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Enter VIN Manually
            </Button>
          </div>
        </div>
      )}

      {cameraReady && (
        <div className="space-y-4">
          {/* Camera viewfinder */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
            />
            
            {/* VIN detection overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed rounded-lg w-80 h-16 flex items-center justify-center">
                <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                  {detectedVIN ? (
                    <span className="text-green-400">✓ {detectedVIN}</span>
                  ) : isScanning ? (
                    'Scanning for VIN...'
                  ) : (
                    'Point at VIN'
                  )}
                </div>
              </div>
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute top-4 right-4">
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing
                </div>
              </div>
            )}

            {/* Auto-scan indicator */}
            {isScanning && !isProcessing && (
              <div className="absolute top-4 left-4">
                <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Auto-scanning
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-4">
              {detectedVIN ? (
                <span className="text-green-600 font-medium">
                  VIN detected! Processing vehicle details...
                </span>
              ) : (
                <>
                  Position the VIN within the frame. The system will automatically detect and capture it.
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleManualCapture}
              disabled={isProcessing || !!detectedVIN}
              className="w-full"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Capture Now'}
            </Button>

            <Button
              onClick={() => setShowManualEntry(true)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Enter VIN Manually
            </Button>
          </div>

          {/* VIN location guide */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-2">
              Where to find your VIN:
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Dashboard near windshield (most common)</li>
              <li>• Driver's side door jamb sticker</li>
              <li>• Engine bay on metal plate</li>
              <li>• Registration or insurance documents</li>
            </ul>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
