'use client'

import React, { useState } from 'react'
import { FileText, CheckCircle, Camera, Upload, Receipt, Wrench, CreditCard, X } from 'lucide-react'
import { UnifiedCameraCapture, CaptureResult } from './UnifiedCameraCapture'

interface DocumentScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: MinimalEvent) => Promise<void>
  vehicleName?: string
  vehicleId: string
  documentType?: 'auto' | 'fuel_receipt' | 'service_invoice' | 'insurance_card'
}

interface MinimalEvent {
  type: string
  captured_at: string
  total_amount?: number
  vendor?: string
  station?: string
  gallons?: number
  summary: string
  key_facts: Record<string, any>
  raw_extraction: any
  validation: any
  processing_metadata: any
  quality_signals: any
  source_document_url?: string
}

type ScanStep = 'document-type' | 'capture' | 'processing' | 'confirm'

export function DocumentScannerModal({
  isOpen,
  onClose,
  onSave,
  vehicleName = 'your vehicle',
  vehicleId,
  documentType = 'auto'
}: DocumentScannerModalProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('document-type')
  const [selectedDocType, setSelectedDocType] = useState<string>(documentType === 'auto' ? '' : documentType)
  const [capturedData, setCapturedData] = useState<any>(null)
  const [minimalEvent, setMinimalEvent] = useState<MinimalEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showCamera, setShowCamera] = useState(false)

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep('document-type')
      setSelectedDocType(documentType === 'auto' ? '' : documentType)
      setCapturedData(null)
      setMinimalEvent(null)
      setIsSaving(false)
      setShowCamera(false)
    }
  }, [isOpen, documentType])

  const documentTypes = [
    {
      id: 'fuel_receipt',
      label: 'Fuel Receipt',
      icon: Receipt,
      description: 'Gas station receipts',
      color: 'text-blue-600'
    },
    {
      id: 'service_invoice',
      label: 'Service Invoice',
      icon: Wrench,
      description: 'Maintenance & repair records',
      color: 'text-emerald-600'
    },
    {
      id: 'insurance_card',
      label: 'Insurance Card',
      icon: CreditCard,
      description: 'Insurance documentation',
      color: 'text-purple-600'
    }
  ]

  const handleDocTypeSelect = (typeId: string) => {
    setSelectedDocType(typeId)
    setCurrentStep('capture')
  }

  const handleCameraCapture = (result: CaptureResult) => {
    if (result.success && result.data) {
      setCapturedData(result.data)
      setShowCamera(false)
      
      // Extract minimal event from vision data
      const event = extractMinimalEvent(result.data)
      setMinimalEvent(event)
      setCurrentStep('confirm')
    } else {
      console.error('Document capture failed:', result.error)
      setCurrentStep('capture')
    }
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setCurrentStep('processing')

      try {
        const formData = new FormData()
        formData.append('image', file)
        formData.append('mode', 'auto')
        formData.append('document_type', selectedDocType || 'document')
        formData.append('vehicle_id', vehicleId)

        const response = await fetch('/api/vision/process', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          handleCameraCapture({
            success: true,
            data: result.data,
            processed_at: new Date().toISOString()
          })
        } else {
          console.error('File upload processing failed:', response.status)
          setCurrentStep('capture')
        }
      } catch (error) {
        console.error('File upload error:', error)
        setCurrentStep('capture')
      }
    }
    input.click()
  }

  const handleSave = async () => {
    if (!minimalEvent) return

    setIsSaving(true)
    try {
      await onSave(minimalEvent)
      onClose()
    } catch (error) {
      console.error('Save error:', error)
      setIsSaving(false)
    }
  }

  // Extract minimal event from Vision API response
  const extractMinimalEvent = (visionData: any): MinimalEvent => {
    const now = new Date().toISOString()
    
    console.log('🔍 EXTRACTING FROM VISION DATA:', visionData)

    // Parse fuel receipts
    if (selectedDocType === 'fuel_receipt' || 
        visionData.type === 'fuel_receipt' ||
        visionData.raw_extraction?.extracted_text?.includes('FUEL') ||
        visionData.raw_extraction?.extracted_text?.includes('GALLON')) {
      
      // Try to extract fuel data from various locations
      const extractedText = visionData.raw_extraction?.extracted_text || ''
      const keyInfo = visionData.raw_extraction?.key_information || {}
      
      // Parse gallons from extracted text if not structured
      let gallons = visionData.gallons
      if (!gallons) {
        const gallonMatch = extractedText.match(/GALLONS?\s+(\d+\.?\d*)/i)
        if (gallonMatch) gallons = parseFloat(gallonMatch[1])
      }
      
      // Parse total amount
      let totalAmount = visionData.total_amount || keyInfo.amount
      if (!totalAmount) {
        const amountMatch = extractedText.match(/TOTAL\s+\$\s*(\d+\.?\d*)/i)
        if (amountMatch) totalAmount = parseFloat(amountMatch[1])
      }
      
      // Parse price per gallon
      let pricePerGal = visionData.price_per_gallon
      if (!pricePerGal && extractedText) {
        const ppgMatch = extractedText.match(/\$\s*(\d+\.?\d*)\s*\/\s*GAL/i)
        if (ppgMatch) pricePerGal = parseFloat(ppgMatch[1])
      }
      
      // Extract station name
      const station = visionData.station_name || 
                     keyInfo.vendor_name ||
                     extractedText.split('\n')[0] || // First line often has station name
                     'Gas Station'

      return {
        type: 'fuel',
        captured_at: now,
        total_amount: totalAmount,
        gallons: gallons,
        station: station,
        summary: `Fuel at ${station}${totalAmount ? ` • $${totalAmount}` : ''}${gallons ? ` • ${gallons} gal` : ''}${pricePerGal ? ` @ $${pricePerGal}/gal` : ''}`,
        key_facts: {
          station: station !== 'Gas Station' ? station : undefined,
          cost: totalAmount,
          gallons,
          price_per_gallon: pricePerGal,
          category: 'fuel_purchase'
        },
        raw_extraction: visionData,
        validation: {
          extraction_complete: !!(totalAmount && gallons),
          confidence_adequate: (visionData.confidence || 0) >= 0.6
        },
        processing_metadata: visionData.processing_metadata,
        quality_signals: {
          user_edited: false,
          edit_count: 0,
          fields_corrected: [],
          verification_status: 'pending'
        },
        source_document_url: visionData.image_url
      }
    }

    // Parse service invoices
    if (selectedDocType === 'service_invoice' || visionData.type === 'service_invoice') {
      const keyInfo = visionData.raw_extraction?.key_information || {}
      const vendor = keyInfo.vendor_name || visionData.shop_name || 'Auto Service'
      const totalAmount = keyInfo.amount || visionData.total_amount

      return {
        type: 'service',
        captured_at: now,
        total_amount: totalAmount,
        vendor: vendor,
        summary: `Service at ${vendor}${totalAmount ? ` • $${totalAmount}` : ''}`,
        key_facts: {
          vendor: vendor !== 'Auto Service' ? vendor : undefined,
          cost: totalAmount,
          category: 'routine_service'
        },
        raw_extraction: visionData,
        validation: {
          extraction_complete: !!(vendor && totalAmount),
          confidence_adequate: (visionData.confidence || 0) >= 0.6
        },
        processing_metadata: visionData.processing_metadata,
        quality_signals: {
          user_edited: false,
          edit_count: 0,
          fields_corrected: [],
          verification_status: 'pending'
        },
        source_document_url: visionData.image_url
      }
    }

    // Default/fallback
    return {
      type: 'document',
      captured_at: now,
      summary: 'Document scanned',
      key_facts: {},
      raw_extraction: visionData,
      validation: {
        extraction_complete: false,
        confidence_adequate: false
      },
      processing_metadata: visionData.processing_metadata,
      quality_signals: {
        user_edited: false,
        edit_count: 0,
        fields_corrected: [],
        verification_status: 'pending'
      },
      source_document_url: visionData.image_url
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Scan Document</h2>
            {vehicleName && (
              <p className="text-sm text-gray-600 mt-0.5">For {vehicleName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Document Type Selection */}
          {currentStep === 'document-type' && !selectedDocType && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">What type of document?</h3>
            <p className="text-sm text-gray-600 mt-1">Select the document type to scan</p>
          </div>

          <div className="grid gap-3">
            {documentTypes.map((docType) => (
              <button
                key={docType.id}
                onClick={() => handleDocTypeSelect(docType.id)}
                className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
              >
                <docType.icon className={`h-6 w-6 ${docType.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{docType.label}</div>
                  <div className="text-sm text-gray-600">{docType.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Capture */}
      {currentStep === 'capture' && !showCamera && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Capture Document</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDocType === 'fuel_receipt' && 'Take a photo of your fuel receipt'}
              {selectedDocType === 'service_invoice' && 'Take a photo of your service invoice'}
              {selectedDocType === 'insurance_card' && 'Take a photo of your insurance card'}
            </p>
          </div>

          <div className="grid gap-3">
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center justify-center gap-3 p-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
              <Camera className="h-5 w-5" />
              <span className="font-semibold">Take Photo</span>
            </button>

            <button
              onClick={handleFileUpload}
              className="flex items-center justify-center gap-3 p-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all"
            >
              <Upload className="h-5 w-5" />
              <span className="font-semibold">Upload from Files</span>
            </button>
          </div>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="border rounded-lg overflow-hidden bg-gray-900">
          <UnifiedCameraCapture
            captureType={selectedDocType as any}
            frameGuide="document-frame"
            instructions={
              selectedDocType === 'fuel_receipt' ? 'Center the receipt in frame' :
              selectedDocType === 'service_invoice' ? 'Capture the entire invoice' :
              'Center the document in frame'
            }
            onCapture={handleCameraCapture}
            onCancel={() => {
              setShowCamera(false)
              setCurrentStep('capture')
            }}
            processingAPI="/api/vision/process"
            vehicleId={vehicleId}
            title=""
            allowFileUpload={false}
            autoStartCamera={true}
          />
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing document...</p>
        </div>
      )}

      {/* Step 4: Confirm */}
      {currentStep === 'confirm' && minimalEvent && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-900">{minimalEvent.summary}</div>
              <div className="text-sm text-emerald-700 mt-0.5">
                Ready to save to timeline
              </div>
            </div>
          </div>

          {/* Show extracted details */}
          {minimalEvent.type === 'fuel' && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              {minimalEvent.station && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Station:</span>
                  <span className="font-medium">{minimalEvent.station}</span>
                </div>
              )}
              {minimalEvent.gallons && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gallons:</span>
                  <span className="font-medium">{minimalEvent.gallons}</span>
                </div>
              )}
              {minimalEvent.total_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">${minimalEvent.total_amount.toFixed(2)}</span>
                </div>
              )}
              {minimalEvent.key_facts?.price_per_gallon && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Price/Gallon:</span>
                  <span className="font-medium">${minimalEvent.key_facts.price_per_gallon.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {minimalEvent.type === 'service' && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              {minimalEvent.vendor && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium">{minimalEvent.vendor}</span>
                </div>
              )}
              {minimalEvent.total_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${minimalEvent.total_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setCurrentStep('capture')}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              disabled={isSaving}
            >
              Retake
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save to Timeline'}
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
