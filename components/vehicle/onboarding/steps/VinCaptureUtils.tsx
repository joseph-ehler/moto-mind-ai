import React, { useState, useRef, useCallback } from 'react'
import { Button, Card, CardContent, Input, Label, Badge, Alert, AlertDescription } from '@/components/ui'
import { Camera, Upload, Keyboard, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface VINResult {
  vin: string
  confidence: number
  source: 'tesseract' | 'openai_vision' | 'manual'
  validated: boolean
}

interface VINCaptureProps {
  onVINDetected: (result: VINResult) => void
  onVINConfirmed: (vin: string) => void
  onError: (error: string) => void
  mode?: 'camera' | 'gallery' | 'manual'
}

export function VINCapture({ onVINDetected, onVINConfirmed, onError, mode = 'camera' }: VINCaptureProps) {
  const [currentMode, setCurrentMode] = useState(mode)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedVIN, setDetectedVIN] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [manualVIN, setManualVIN] = useState<string>('')
  const [vinValidated, setVinValidated] = useState(false)
  const [showContinue, setShowContinue] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // VIN validation with checksum
  const validateVIN = useCallback((vin: string): boolean => {
    if (vin.length !== 17) return false
    
    // Remove invalid characters
    const cleanVIN = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    if (cleanVIN.length !== 17) return false
    
    // ISO 3779 checksum validation
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]
    const values: { [key: string]: number } = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
      'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
      'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
      '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
    }
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      if (i === 8) continue // Skip check digit position
      sum += values[cleanVIN[i]] * weights[i]
    }
    
    const checkDigit = sum % 11
    const expectedCheck = checkDigit === 10 ? 'X' : checkDigit.toString()
    
    return cleanVIN[8] === expectedCheck
  }, [])

  // Process image with Tesseract first, then OpenAI Vision if needed
  const processImage = useCallback(async (imageData: string) => {
    setIsProcessing(true)
    
    try {
      // Step 1: Try Tesseract OCR (fast, client-side)
      console.log('🔍 Processing with Tesseract OCR...')
      
      const tesseractResult = await extractVINWithTesseract(imageData)
      
      if (tesseractResult.confidence > 0.8 && validateVIN(tesseractResult.vin)) {
        console.log('✅ Tesseract success:', tesseractResult.vin)
        setDetectedVIN(tesseractResult.vin)
        setConfidence(tesseractResult.confidence)
        setVinValidated(true)
        setShowContinue(true)
        return
      }
      
      // Step 2: Fallback to OpenAI Vision (higher accuracy, costs money)
      console.log('🤖 Falling back to OpenAI Vision...')
      
      const visionResult = await extractVINWithVision(imageData)
      
      if (validateVIN(visionResult.vin)) {
        console.log('✅ Vision success:', visionResult.vin)
        setDetectedVIN(visionResult.vin)
        setConfidence(visionResult.confidence)
        setVinValidated(true)
        setShowContinue(true)
      } else {
        // Show detected VIN for manual correction
        setDetectedVIN(visionResult.vin)
        setConfidence(visionResult.confidence)
        setVinValidated(false)
        setShowContinue(true)
        setCurrentMode('manual')
      }
      
    } catch (error) {
      console.error('VIN processing error:', error)
      onError('Failed to process VIN. Please try again or enter manually.')
      setCurrentMode('manual')
    } finally {
      setIsProcessing(false)
    }
  }, [validateVIN, onVINDetected, onError])

  // Tesseract OCR implementation
  const extractVINWithTesseract = async (imageData: string) => {
    // This would use Tesseract.js in a real implementation
    // For now, simulate the API
    return new Promise<{ vin: string; confidence: number }>((resolve) => {
      setTimeout(() => {
        // Simulate OCR result
        resolve({
          vin: '1HGBH41JXMN109186', // Mock VIN
          confidence: 0.75
        })
      }, 1000)
    })
  }

  // OpenAI Vision API call
  const extractVINWithVision = async (imageData: string) => {
    const response = await fetch('/api/extract-vin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        prompt: 'Extract the VIN (Vehicle Identification Number) from this image. Return only the 17-character VIN code.'
      })
    })
    
    if (!response.ok) {
      throw new Error('Vision API failed')
    }
    
    const result = await response.json()
    return {
      vin: result.vin || '',
      confidence: result.confidence || 0.9
    }
  }

  // Camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      onError('Camera access denied. Please use gallery upload or manual entry.')
      setCurrentMode('gallery')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    processImage(imageData)
  }

  // Gallery upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageData = e.target?.result as string
      processImage(imageData)
    }
    reader.readAsDataURL(file)
  }

  // Manual VIN entry
  const handleManualSubmit = () => {
    const cleanVIN = (manualVIN || detectedVIN).toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    
    if (validateVIN(cleanVIN)) {
      setDetectedVIN(cleanVIN)
      setVinValidated(true)
      setShowContinue(true)
    } else {
      setDetectedVIN(cleanVIN)
      setVinValidated(false)
      setShowContinue(true)
    }
  }

  // Handle continue button click
  const handleContinue = () => {
    if (detectedVIN && showContinue) {
      onVINConfirmed(detectedVIN)
    }
  }

  // Start camera when component mounts in camera mode
  React.useEffect(() => {
    if (currentMode === 'camera') {
      startCamera()
    }
  }, [currentMode])

  return (
    <Card className="max-w-md mx-auto">
      {/* Mode Selector */}
      <div className="flex border-b">
        <Button
          variant={currentMode === 'camera' ? 'default' : 'ghost'}
          onClick={() => setCurrentMode('camera')}
          className="flex-1 rounded-none border-0"
        >
          <Camera size={20} className="mr-2" />
          Camera
        </Button>
        <Button
          variant={currentMode === 'gallery' ? 'default' : 'ghost'}
          onClick={() => setCurrentMode('gallery')}
          className="flex-1 rounded-none border-0"
        >
          <Upload size={20} className="mr-2" />
          Gallery
        </Button>
        <Button
          variant={currentMode === 'manual' ? 'default' : 'ghost'}
          onClick={() => setCurrentMode('manual')}
          className="flex-1 rounded-none border-0"
        >
          <Keyboard size={20} className="mr-2" />
          Manual
        </Button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {currentMode === 'gallery' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50"
            >
              <Upload size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Tap to select VIN photo from gallery
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
        {currentMode === 'manual' && (
          <div className="space-y-4">
            {detectedVIN && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="text-sm text-yellow-800">
                    Detected VIN needs verification
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Detected: {detectedVIN} ({Math.round(confidence * 100)}% confidence)
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter VIN (17 characters)
              </label>
              <input
                type="text"
                value={manualVIN || detectedVIN}
                onChange={(e) => setManualVIN(e.target.value.toUpperCase())}
                placeholder="1HGBH41JXMN109186"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg tracking-wider"
                maxLength={17}
              />
              <p className="text-xs text-gray-500 mt-1">
                {manualVIN.length}/17 characters
              </p>
            </div>
            
            <button
              onClick={handleManualSubmit}
              disabled={manualVIN.length !== 17}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Validate VIN
            </button>
          </div>
        )}

        {/* Continue Button - Shows after VIN is detected/entered */}
        {showContinue && detectedVIN && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-2">
              {vinValidated ? (
                <>
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="text-green-700 font-medium">Valid VIN • ISO 3779</span>
                </>
              ) : (
                <>
                  <AlertCircle className="text-yellow-500" size={20} />
                  <span className="text-yellow-700 font-medium">VIN format looks off. Common confusions: O↔0, I↔1, S↔5</span>
                </>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">Detected VIN:</p>
              <p className="text-lg font-mono text-blue-900">{detectedVIN}</p>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to Vehicle Info
            </button>
            
            {!vinValidated && (
              <p className="text-xs text-gray-600 text-center">
                You can continue even if the VIN format appears incorrect
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <CardContent className="bg-gray-50 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for best results:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Ensure good lighting on the VIN plate</li>
          <li>• Hold camera steady and get close</li>
          <li>• VIN is usually on dashboard, door jamb, or engine bay</li>
          <li>• Remove glare and shadows if possible</li>
        </ul>
      </CardContent>
    </Card>
  )
}
