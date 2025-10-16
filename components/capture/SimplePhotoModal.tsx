'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle,
  Gauge,
  Fuel,
  Wrench,
  FileText
} from 'lucide-react'

// RADICAL SIMPLIFICATION: Capture → Log → Done
type FlowState = 
  | 'camera_choice'  // Choose camera or upload
  | 'capture'        // Take photo
  | 'processing'     // Extract essentials only
  | 'confirm'        // Minimal confirmation with just the essentials
  | 'saved'          // Event saved successfully
// Minimal event shapes - only what matters, no nulls
interface MinimalEvent {
  type: 'odometer' | 'fuel' | 'service' | 'document'
  captured_at: string
  miles?: number           // odometer
  total_amount?: number    // fuel, service
  gallons?: number         // fuel
  kind?: string           // service (human readable)
  doc_type?: string       // document
  // Optional enrichment
  vendor?: string
  station?: string
  document_date?: string
  confidence?: number
  source_document_url?: string
  // LLM-ready compact data
  summary?: string         // ~150 char summary for chat
  key_facts?: {           // Structured facts for efficient querying
    vendor?: string
    cost?: number
    services?: string[]
    mileage?: number
    gallons?: number
    station?: string
    category?: string     // oil_change | tire_service | brake_service | fuel_purchase | mileage_update
  }
  // Store ALL extracted data for transparency and LLM chat
  raw_extraction?: any
  // Validation and quality tracking
  validation?: {
    amount_makes_sense?: boolean | null
    date_is_recent?: boolean | null
    vendor_identified?: boolean | null
    confidence_adequate?: boolean | null
    has_vehicle_info?: boolean
    extraction_complete?: boolean
    gallons_makes_sense?: boolean | null
    price_per_gallon_makes_sense?: boolean | null
    service_detected?: boolean
    miles_positive?: boolean
    miles_reasonable?: boolean
  }
  processing_metadata?: {
    model_version?: string
    processing_time_ms?: number
    token_usage?: number
    prompt_sent?: string
    prompt_template_id?: string
    prompt_hash?: string
    started_at?: string
    finished_at?: string
    pipeline_version?: string
    estimated_input_tokens?: number
    preprocessing_steps?: string[]
  }
  quality_signals?: {
    user_edited: boolean
    edit_count: number
    fields_corrected: string[]
    verification_status: 'pending' | 'verified' | 'corrected'
  }
}

interface SimplePhotoModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveEvent: (event: MinimalEvent) => void
  title?: string
  captureType?: 'document' | 'odometer' | 'fuel' | 'maintenance' | 'service' | 'inspection'
}

function SimplePhotoModal({ 
  isOpen, 
  onClose, 
  onSaveEvent, 
  title, 
  captureType 
}: SimplePhotoModalProps) {
  // SIMPLIFIED state - just what we need
  const [currentState, setCurrentState] = React.useState<FlowState>('camera_choice')
  const [extractedEvent, setExtractedEvent] = React.useState<MinimalEvent | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  // Camera refs
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentState('camera_choice')
      setExtractedEvent(null)
      setError(null)
      setIsProcessing(false)
    } else {
      stopCamera()
    }
  }, [isOpen])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setError('Camera access denied. Please use file upload instead.')
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        await processImage(blob)
      }
    }, 'image/jpeg', 0.8)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processImage(file)
    }
  }

  const processImage = async (imageBlob: Blob) => {
    setIsProcessing(true)
    setCurrentState('processing')
    setError(null)

    try {
      // Call Vision API to extract essentials only
      const formData = new FormData()
      formData.append('image', imageBlob, `${captureType || 'document'}.jpg`)
      formData.append('document_type', captureType || 'document') // FIXED: Use correct field name
      formData.append('store_original', 'true') // Request to store original image
      
      const response = await fetch('/api/vision/process', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('📋 VISION API RESPONSE:', result)
        
        // Extract minimal event data
        const visionData = result.success ? result.data : result
        const minimalEvent = extractMinimalEvent(visionData)
        
        console.log('📄 MINIMAL EVENT EXTRACTED:', minimalEvent)
        
        setExtractedEvent(minimalEvent)
        setCurrentState('confirm')
        stopCamera()
      } else {
        throw new Error('Failed to process image')
      }
    } catch (error) {
      console.error('Processing error:', error)
      setError('Failed to process image. Please try again.')
      setCurrentState('camera_choice')
    } finally {
      setIsProcessing(false)
    }
  }

  // Validate extraction quality - advisory scorecard, not blocking
  const validateExtraction = (visionData: any) => {
    const currentYear = new Date().getFullYear()
    const currentDate = new Date().toISOString().split('T')[0]
    const twentyYearsAgo = `${currentYear - 20}-01-01`
    
    // Base validation
    const base = {
      confidence_adequate: visionData.confidence ? visionData.confidence >= 70 : false,
      has_vehicle_info: visionData.vehicle_info ? Object.values(visionData.vehicle_info).some(v => v !== null) : false,
      extraction_complete: visionData.type !== 'other'
    }
    
    // Event-type specific validation
    if (visionData.type === 'fuel' || visionData.station_name || visionData.gallons) {
      return {
        ...base,
        amount_makes_sense: visionData.total_amount ? (visionData.total_amount > 0 && visionData.total_amount < 1000) : null,
        gallons_makes_sense: visionData.gallons ? (visionData.gallons > 0 && visionData.gallons < 50) : null,
        price_per_gallon_makes_sense: (visionData.total_amount && visionData.gallons) ? 
          (() => {
            const ppg = visionData.total_amount / visionData.gallons
            return ppg >= 1.0 && ppg <= 15.0
          })() : null,
        date_is_recent: visionData.document_details?.date ? 
          (visionData.document_details.date >= twentyYearsAgo && visionData.document_details.date <= currentDate) : null
      }
    }
    
    if (visionData.type === 'service' || visionData.services_performed || visionData.shop_name) {
      return {
        ...base,
        vendor_identified: visionData.shop_name ? (visionData.shop_name !== 'Not Visible' && visionData.shop_name !== null) : null,
        amount_makes_sense: visionData.total_amount ? (visionData.total_amount > 0 && visionData.total_amount < 10000) : null,
        service_detected: visionData.services_performed || visionData.extracted_data?.services_performed ? true : false,
        date_is_recent: visionData.document_details?.date ? 
          (visionData.document_details.date >= twentyYearsAgo && visionData.document_details.date <= currentDate) : null
      }
    }
    
    if (visionData.type === 'odometer' || visionData.current_mileage || visionData.vehicle_info?.odometer) {
      const miles = visionData.current_mileage || visionData.vehicle_info?.odometer
      return {
        ...base,
        miles_positive: miles ? miles > 0 : false,
        miles_reasonable: miles ? (miles > 0 && miles < 1000000) : false, // Under 1M miles
        // Note: does_not_drop_vs_last will be handled by DB trigger
      }
    }
    
    // Default validation for documents
    return {
      ...base,
      date_is_recent: visionData.document_details?.date ? 
        (visionData.document_details.date >= twentyYearsAgo && visionData.document_details.date <= currentDate) : null
    }
  }

  // Extract minimal event from Vision API response
  const extractMinimalEvent = (visionData: any): MinimalEvent => {
    const now = new Date().toISOString()
    
    console.log('🔍 EXTRACTING MINIMAL EVENT FROM:', visionData)
    
    // Validate extraction quality
    const validation = validateExtraction(visionData)
    
    // Generate LLM-ready summary and key facts
    const generateSummaryAndFacts = (eventType: string, data: any) => {
      switch (eventType) {
        case 'service':
          const serviceKind = Array.isArray(data.services_performed) 
            ? data.services_performed[0]?.description || data.services_performed[0] 
            : data.services_performed || 'Service'
          const vendor = data.shop_name || data.extracted_data?.shop_name || data.document_details?.business_name || 'Auto Service'
          const cost = data.total_amount || data.document_details?.total_amount
          
          return {
            summary: `${serviceKind} at ${vendor}${cost ? ` for $${cost}` : ''}`,
            key_facts: {
              vendor: vendor !== 'Auto Service' ? vendor : undefined,
              cost,
              services: Array.isArray(data.services_performed) ? data.services_performed : (data.services_performed ? [data.services_performed] : undefined),
              mileage: data.vehicle_info?.odometer,
              category: serviceKind.toLowerCase().includes('oil') ? 'oil_change' : 
                       serviceKind.toLowerCase().includes('tire') ? 'tire_service' :
                       serviceKind.toLowerCase().includes('brake') ? 'brake_service' : 'routine_service'
            }
          }
          
        case 'fuel':
          const station = data.station_name || 'Gas Station'
          const amount = data.total_amount
          const gallons = data.gallons
          const ppg = (amount && gallons) ? (amount / gallons).toFixed(2) : null
          
          return {
            summary: `Fuel at ${station}${amount ? ` for $${amount}` : ''}${gallons ? ` (${gallons} gal)` : ''}${ppg ? ` @ $${ppg}/gal` : ''}`,
            key_facts: {
              station: station !== 'Gas Station' ? station : undefined,
              cost: amount,
              gallons,
              category: 'fuel_purchase'
            }
          }
          
        case 'odometer':
          const miles = data.current_mileage || data.vehicle_info?.odometer
          return {
            summary: `Mileage update: ${miles?.toLocaleString()} miles`,
            key_facts: {
              mileage: miles,
              category: 'mileage_update'
            }
          }
          
        default:
          return {
            summary: `Document: ${data.type || 'other'}`,
            key_facts: {
              category: 'document'
            }
          }
      }
    }
    
    // Determine event type and extract only essentials
    
    // Handle service invoices/maintenance records
    if (visionData.type === 'maintenance' || visionData.type === 'service_invoice' || visionData.type === 'service' || 
        visionData.services_performed || 
        (visionData.document_details?.business_name && 
         (visionData.extracted_data?.services_performed || visionData.extracted_data?.shop_name))) {
      return {
        type: 'service',
        captured_at: now,
        kind: Array.isArray(visionData.services_performed) 
          ? visionData.services_performed[0]?.description || visionData.services_performed[0] 
          : visionData.services_performed || 
            (Array.isArray(visionData.extracted_data?.services_performed) 
              ? visionData.extracted_data.services_performed[0]?.description || visionData.extracted_data.services_performed[0]
              : visionData.extracted_data?.services_performed) || 'Service',
        total_amount: visionData.total_amount || 
                     visionData.document_details?.total_amount || undefined,
        vendor: (visionData.shop_name && visionData.shop_name !== 'Not Visible') ? visionData.shop_name :
               (visionData.extracted_data?.shop_name && visionData.extracted_data.shop_name !== 'Not Visible') ? visionData.extracted_data.shop_name :
               (visionData.document_details?.business_name && visionData.document_details.business_name !== 'Not Visible') ? visionData.document_details.business_name :
               (visionData.vehicle_info?.make ? `${visionData.vehicle_info.make} Service` : 'Auto Service'),
        confidence: visionData.confidence,
        source_document_url: visionData.source_document_url,
        // LLM-ready compact data
        ...generateSummaryAndFacts('service', visionData),
        // Store ALL extracted data for transparency and LLM chat
        raw_extraction: visionData || {},
        // Add null-safe key_facts access
        key_facts: generateSummaryAndFacts('service', visionData)?.key_facts || {},
        validation,
        processing_metadata: visionData.processing_metadata,
        quality_signals: {
          user_edited: false,
          edit_count: 0,
          fields_corrected: [],
          verification_status: 'pending'
        }
      }
    }
    
    // Check for fuel receipt indicators (including raw text for misclassified receipts)
    const hasFuelData = visionData.type === 'fuel' || visionData.type === 'fuel_receipt' ||
                       visionData.station_name || visionData.gallons ||
                       (visionData.raw_extraction?.extracted_text && 
                        (visionData.raw_extraction.extracted_text.includes('FUEL') ||
                         visionData.raw_extraction.extracted_text.includes('GAL') ||
                         visionData.raw_extraction.extracted_text.includes('GALLONS')))
    
    if (hasFuelData) {
      return {
        type: 'fuel',
        captured_at: now,
        total_amount: visionData.total_amount || undefined,
        gallons: visionData.gallons || undefined,
        station: visionData.station_name || 'Gas Station',
        confidence: visionData.confidence,
        source_document_url: visionData.source_document_url,
        // LLM-ready compact data
        ...generateSummaryAndFacts('fuel', visionData),
        raw_extraction: visionData || {},
        // Add null-safe key_facts access
        key_facts: generateSummaryAndFacts('fuel', visionData)?.key_facts || {},
        validation,
        processing_metadata: visionData.processing_metadata,
        quality_signals: {
          user_edited: false,
          edit_count: 0,
          fields_corrected: [],
          verification_status: 'pending'
        }
      }
    }
    
    if (visionData.type === 'odometer' || visionData.current_mileage || visionData.vehicle_info?.odometer) {
      return {
        type: 'odometer',
        captured_at: now,
        miles: visionData.current_mileage || visionData.vehicle_info?.odometer,
        confidence: visionData.confidence,
        source_document_url: visionData.source_document_url,
        // LLM-ready compact data
        ...generateSummaryAndFacts('odometer', visionData),
        raw_extraction: visionData,
        validation,
        processing_metadata: visionData.processing_metadata,
        quality_signals: {
          user_edited: false,
          edit_count: 0,
          fields_corrected: [],
          verification_status: 'pending'
        }
      }
    }
    
    // Default fallback for unrecognized types
    return {
      type: 'document',
      captured_at: now,
      doc_type: visionData.type || 'other',
      confidence: visionData.confidence,
      source_document_url: visionData.source_document_url,
      // LLM-ready compact data
      ...generateSummaryAndFacts('document', visionData),
      raw_extraction: visionData,
      validation,
      processing_metadata: visionData.processing_metadata,
      quality_signals: {
        user_edited: false,
        edit_count: 0,
        fields_corrected: [],
        verification_status: 'pending'
      }
    }
  }

  const handleSaveEvent = () => {
    if (extractedEvent) {
      console.log('Saving event with source document URL:', extractedEvent.source_document_url)
      console.log('💾 SAVING MINIMAL EVENT:', extractedEvent)
      onSaveEvent(extractedEvent)
      setCurrentState('saved')
      // Close modal after brief success state
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  const getConfirmationText = (event: MinimalEvent): string => {
    // Use driver-focused summary if available
    if (event.summary) {
      switch (event.type) {
        case 'service':
          return `${event.summary} — Save service record`
        case 'fuel':
          return `${event.summary} — Add fuel record`
        case 'odometer':
          return `${event.summary} — Update mileage`
        case 'document':
          return `${event.summary} — Save document`
        default:
          return `${event.summary} — Save event`
      }
    }
    
    // Fallback to old format for older events
    switch (event.type) {
      case 'odometer':
        return `${event.miles?.toLocaleString()} mi — Update mileage`
      case 'fuel':
        const parts = []
        if (event.total_amount) parts.push(`$${event.total_amount}`)
        if (event.gallons) parts.push(`${event.gallons} gal`)
        return `${parts.join(' · ')} — Add fuel`
      case 'service':
        const serviceParts = []
        if (event.kind && event.kind !== 'Service') serviceParts.push(event.kind)
        if (event.total_amount) serviceParts.push(`$${event.total_amount}`)
        if (event.vendor && event.vendor !== 'Unknown Shop' && event.vendor !== 'not visible') {
          serviceParts.push(`at ${event.vendor}`)
        }
        return serviceParts.length > 0 
          ? `${serviceParts.join(' · ')} — Save service record`
          : 'Service record — Save service record'
      case 'document':
        return `${event.doc_type?.replace(/_/g, ' ') || 'Document'} — Save document`
      default:
        return 'Event — Save event'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'odometer': return Gauge
      case 'fuel': return Fuel
      case 'service': return Wrench
      default: return FileText
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentState === 'camera_choice' && 'Capture Document'}
              {currentState === 'capture' && 'Take Photo'}
              {currentState === 'processing' && 'Processing...'}
              {currentState === 'confirm' && 'Confirm & Save'}
              {currentState === 'saved' && 'Saved!'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Camera Choice */}
          {currentState === 'camera_choice' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <Camera className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Add Document
                </div>
                <div className="text-sm text-gray-600">
                  Take a photo or upload from your device
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setCurrentState('capture')
                    startCamera()
                  }}
                  className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Take Photo</div>
                      <div className="text-sm text-gray-600">Use your camera</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                      <Upload className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Upload File</div>
                      <div className="text-sm text-gray-600">Choose from device</div>
                    </div>
                  </div>
                </button>
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

          {/* Camera Capture */}
          {currentState === 'capture' && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-video object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full" />
                </button>
              </div>

              {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}
            </div>
          )}

          {/* Processing */}
          {currentState === 'processing' && (
            <div className="p-6 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <div className="text-gray-600">Extracting information...</div>
            </div>
          )}

          {/* Confirmation */}
          {currentState === 'confirm' && extractedEvent && (
            <div className="p-6">
              <div className="text-center mb-6">
                {React.createElement(getEventIcon(extractedEvent.type), {
                  className: "w-12 h-12 mx-auto mb-4 text-green-600"
                })}
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {getConfirmationText(extractedEvent)}
                </div>
                <div className="text-sm text-gray-600">
                  Looks right?
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={handleSaveEvent} className="w-full" size="lg">
                  Save to Timeline
                </Button>
                <button
                  onClick={() => setCurrentState('camera_choice')}
                  className="w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Saved */}
          {currentState === 'saved' && (
            <div className="p-6 text-center">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <div className="text-lg font-semibold text-gray-900 mb-2">
                Saved to Timeline!
              </div>
              <div className="text-sm text-gray-600">
                Your record has been added
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { SimplePhotoModal }
