// MotoMindAI: Camera Capture Component
// Smartphone-first photo capture with OCR processing

import { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'

// OpenAI Vision API helper
async function tryOpenAIVision(file: File): Promise<{ miles: number; confidence: number }> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data:image/jpeg;base64, prefix
    }
    reader.readAsDataURL(file)
  })

  // Call our vision API endpoint
  const response = await fetch('/api/vision-ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64,
      type: 'odometer'
    })
  })

  if (!response.ok) {
    throw new Error(`Vision API failed: ${response.status}`)
  }

  const result = await response.json()
  
  if (!result.miles || isNaN(result.miles)) {
    throw new Error('No valid miles extracted from vision API')
  }

  return {
    miles: parseInt(result.miles),
    confidence: result.confidence || 85 // Vision API typically has high confidence
  }
}

interface CameraCaptureProps {
  kind: 'odometer_photo' | 'fuel_receipt' | 'maintenance_doc' | 'issue_photo'
  vehicleId: string
  onCapture: (file: File, extractedData?: any) => void
  onCancel: () => void
}

export function CameraCapture({ kind, vehicleId, onCapture, onCancel }: CameraCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true)
    setExtractedData(null)

    try {
      if (kind === 'odometer_photo') {
        // OCR for odometer reading with multiple attempts
        let bestResult = null
        let bestConfidence = 0
        
        // Try different OCR configurations (simplified to avoid config errors)
        const ocrConfigs = [
          { logger: (m: any) => console.log(m) }, // Basic config
          { 
            logger: (m: any) => console.log(m),
            tessedit_char_whitelist: '0123456789'
          }
        ]
        
        for (const config of ocrConfigs) {
          try {
            const result = await Tesseract.recognize(file, 'eng', config)
            const digits = result.data.text.replace(/\D/g, '')
            const confidence = Math.round(result.data.confidence)
            
            if (digits.length >= 4 && digits.length <= 7 && confidence > bestConfidence) {
              bestResult = {
                digits,
                confidence,
                miles: parseInt(digits)
              }
              bestConfidence = confidence
            }
          } catch (e) {
            console.warn('OCR config failed:', e)
          }
        }
        
        if (bestResult && bestResult.miles && !isNaN(bestResult.miles)) {
          setExtractedData({
            miles: bestResult.miles,
            ocr_confidence: bestResult.confidence,
            parsed_digits: bestResult.digits
          })
        } else {
          // Try OpenAI Vision as fallback
          console.log('OCR failed, trying OpenAI Vision...', { bestResult })
          try {
            const visionResult = await tryOpenAIVision(file)
            console.log('Vision result:', visionResult)
            if (visionResult.miles) {
              setExtractedData({
                miles: visionResult.miles,
                ocr_confidence: visionResult.confidence,
                parsed_digits: visionResult.miles.toString(),
                source: 'openai_vision'
              })
            } else {
              throw new Error('Vision API could not extract reading')
            }
          } catch (visionError) {
            console.error('OpenAI Vision also failed:', visionError)
            // Final fallback to manual entry
            setExtractedData({
              miles: null,
              ocr_confidence: 0,
              parsed_digits: bestResult?.digits || '',
              error: 'Could not extract valid odometer reading. You can enter the number manually below.',
              manual_entry_hint: 'Both OCR and AI vision attempted - manual entry recommended'
            })
          }
        }
      } else if (kind === 'fuel_receipt') {
        // Use our new process-receipt endpoint with OpenAI Vision
        console.log('🔥 Processing fuel receipt with new endpoint...')
        
        const formData = new FormData()
        formData.append('image', file, 'fuel-receipt.jpg')
        formData.append('vehicleId', 'demo-vehicle')
        formData.append('captureType', 'fuel_receipt')

        const response = await fetch('/api/process-receipt', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Receipt processing failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('🔥 Receipt processing result:', result)

        const gallons = result.data?.gallons || null
        const priceTotal = result.data?.total_cost || null
        const dateString = result.data?.date || null

        setExtractedData({
          gallons,
          price_total: priceTotal,
          unit_price: gallons && priceTotal ? priceTotal / gallons : null,
          date: dateString || new Date().toISOString().split('T')[0],
          ocr_confidence: result.data?.ocr_confidence || 95,
          raw_text: 'Processed by OpenAI Vision'
        })
      } else {
        // For other types, just capture the image
        setExtractedData({
          note: '',
          category: kind === 'issue_photo' ? 'other' : 'general'
        })
      }
    } catch (error) {
      console.error('OCR processing failed:', error)
      setExtractedData({
        error: 'OCR processing failed. You can still save the image and enter data manually.'
      })
    } finally {
      setIsProcessing(false)
    }
  }, [kind])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setCapturedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    
    // Process with OCR if it's an odometer or receipt
    if (kind === 'odometer_photo' || kind === 'fuel_receipt') {
      await processImage(file)
    } else {
      setExtractedData({
        note: '',
        category: kind === 'issue_photo' ? 'other' : 'general'
      })
    }
  }, [kind, processImage])

  const handleConfirm = useCallback(() => {
    if (capturedFile && extractedData) {
      onCapture(capturedFile, extractedData)
    }
  }, [capturedFile, extractedData, onCapture])

  const getTitle = () => {
    switch (kind) {
      case 'odometer_photo':
        return 'Capture Odometer Reading'
      case 'fuel_receipt':
        return 'Capture Fuel Receipt'
      case 'maintenance_doc':
        return 'Capture Maintenance Document'
      case 'issue_photo':
        return 'Capture Issue Photo'
      default:
        return 'Capture Photo'
    }
  }

  const getInstructions = () => {
    switch (kind) {
      case 'odometer_photo':
        return 'Take a clear photo of your odometer display. Make sure the numbers are clearly visible.'
      case 'fuel_receipt':
        return 'Take a photo of your fuel receipt. Make sure the gallons and total price are visible.'
      case 'maintenance_doc':
        return 'Take a photo of your maintenance receipt or service record.'
      case 'issue_photo':
        return 'Take a photo of the issue you want to report.'
      default:
        return 'Take a clear photo.'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {getTitle()}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            {getInstructions()}
          </p>

          {/* File Input */}
          <div className="mb-4">
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Take Photo
                  </>
                )}
              </button>

              {/* Debug: Test Vision API directly */}
              {capturedFile && (
                <button
                  onClick={async () => {
                    console.log('Testing Vision API directly...')
                    try {
                      const result = await tryOpenAIVision(capturedFile)
                      console.log('Direct Vision API result:', result)
                      alert(`Vision API Result: ${result.miles} miles (confidence: ${result.confidence}%)`)
                    } catch (error) {
                      console.error('Direct Vision API error:', error)
                      alert(`Vision API Error: ${error}`)
                    }
                  }}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                >
                  🧪 Test Vision API Directly
                </button>
              )}
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="Captured"
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Extracted Data */}
          {extractedData && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Extracted Data</h3>
              
              {extractedData.error ? (
                <p className="text-sm text-error-600">{extractedData.error}</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {kind === 'odometer_photo' && (
                    <>
                      <div>
                        <span className="font-medium">Miles:</span> {extractedData.miles || 'Not detected'}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {extractedData.ocr_confidence}%
                      </div>
                    </>
                  )}
                  
                  {kind === 'fuel_receipt' && (
                    <>
                      <div>
                        <span className="font-medium">Gallons:</span> {extractedData.gallons || 'Not detected'}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ${extractedData.price_total || 'Not detected'}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {extractedData.date}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span> {extractedData.ocr_confidence}%
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {capturedFile && (
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 btn-primary"
                disabled={!extractedData}
              >
                Confirm & Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
