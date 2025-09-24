// MotoMindAI: Camera Capture Component
// Smartphone-first photo capture with OCR processing

import { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'

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
        // OCR for odometer reading
        const result = await Tesseract.recognize(file, 'eng', {
          tessedit_char_whitelist: '0123456789',
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
        })

        const digits = result.data.text.replace(/\D/g, '')
        const miles = parseInt(digits)
        
        if (digits.length >= 4 && digits.length <= 6 && !isNaN(miles)) {
          setExtractedData({
            miles,
            ocr_confidence: Math.round(result.data.confidence),
            parsed_digits: digits
          })
        } else {
          setExtractedData({
            miles: null,
            ocr_confidence: 0,
            parsed_digits: digits,
            error: 'Could not extract valid odometer reading'
          })
        }
      } else if (kind === 'fuel_receipt') {
        // OCR for fuel receipt
        const result = await Tesseract.recognize(file, 'eng')
        const text = result.data.text.toLowerCase()
        
        // Extract gallons (look for patterns like "12.34 gal" or "gallons 12.34")
        const gallonMatches = text.match(/(\d+\.?\d*)\s*(gal|gallons?)/i) || 
                             text.match(/(gal|gallons?)\s*(\d+\.?\d*)/i)
        const gallons = gallonMatches ? parseFloat(gallonMatches[1] || gallonMatches[2]) : null

        // Extract total price (look for patterns like "$45.67" or "total 45.67")
        const priceMatches = text.match(/\$(\d+\.?\d*)/) || 
                            text.match(/(total|amount)\s*(\d+\.?\d*)/i)
        const priceTotal = priceMatches ? parseFloat(priceMatches[1] || priceMatches[2]) : null

        // Extract date (look for date patterns)
        const dateMatches = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
        let date = null
        if (dateMatches) {
          const [, month, day, year] = dateMatches
          const fullYear = year.length === 2 ? `20${year}` : year
          date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }

        setExtractedData({
          gallons,
          price_total: priceTotal,
          unit_price: gallons && priceTotal ? priceTotal / gallons : null,
          date: date || new Date().toISOString().split('T')[0],
          ocr_confidence: Math.round(result.data.confidence),
          raw_text: text
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-primary py-3"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </>
              )}
            </button>
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
