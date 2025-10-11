/**
 * Fuel Capture Flow Page
 * Complete end-to-end flow: Camera → GPS/EXIF → Conflicts → Proposal → Save
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraCapture } from '@/components/capture/CameraCapture'
import { ProcessingScreen } from '@/components/capture/ProcessingScreen'
import { SuccessScreen } from '@/components/capture/SuccessScreen'
import { ErrorToast } from '@/components/ui/ErrorToast'
import { uploadToVisionAPI } from '@/lib/vision-api'
import { getCurrentLocation } from '@/lib/gps-capture'
import { extractExifData } from '@/lib/exif-extraction'
import { detectConflicts, type DataConflict } from '@/lib/data-conflict-detection'
import { determineLocationSource, type LocationResult } from '@/lib/location-intelligence'
import { AIProposalReview, type ExtractedField } from '@/components/capture/AIProposalReview'
import { fileToBase64 } from '@/lib/utils/file'

type CaptureStep = 'camera' | 'processing' | 'proposal' | 'success'

interface ProposalData {
  fields: ExtractedField[]
  imageUrl: string
  processingMetadata?: any
  supplementalData?: any
  conflicts: DataConflict[]
  locationResult?: LocationResult
}

interface LiveData {
  gallons?: number
  cost?: number
  station?: string
}

export default function FuelCapturePage() {
  const router = useRouter()
  const [step, setStep] = useState<CaptureStep>('camera')
  const [proposalData, setProposalData] = useState<ProposalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveData, setLiveData] = useState<LiveData>({})
  const [isSaving, setIsSaving] = useState(false)

  const handlePhotoCapture = async (photo: File) => {
    setStep('processing')
    setError(null)
    setLiveData({}) // Reset live data

    try {
      // Step 1: Parallel data collection (GPS, EXIF, Vision)
      console.log('🚀 Starting parallel data collection...')
      
      const [vision, gps, exif] = await Promise.allSettled([
        uploadToVisionAPI(photo, 'fuel_receipt'),
        getCurrentLocation(),
        extractExifData(photo),
      ])

      console.log('📊 Data collected:', {
        vision: vision.status === 'fulfilled' ? 'success' : 'failed',
        gps: gps.status === 'fulfilled' ? 'success' : 'failed',
        exif: exif.status === 'fulfilled' ? 'success' : 'failed',
      })

      const visionData = vision.status === 'fulfilled' ? vision.value : null
      const gpsData = gps.status === 'fulfilled' ? gps.value : null
      const exifData = exif.status === 'fulfilled' ? exif.value : null

      // Update live data from vision result
      if (visionData?.extractedData) {
        const keyFacts = visionData.extractedData.key_facts || visionData.extractedData
        console.log('🔍 Vision extracted data:', keyFacts)
        setLiveData({
          gallons: keyFacts.gallons,
          cost: keyFacts.total_amount,
          station: keyFacts.station_name,
        })
      }

      // Step 2: Hybrid address extraction (NEW!)
      const keyFacts = visionData?.extractedData?.key_facts || visionData?.extractedData || {}
      let finalAddress = keyFacts.station_address
      let addressSource = 'vision_structured'
      let addressCoordinates: { latitude: number; longitude: number } | null = null

      // If structured extraction didn't get address, try hybrid extraction
      if (!finalAddress) {
        console.log('📍 No address in structured data, trying hybrid extraction...')
        try {
          const photoBase64 = await fileToBase64(photo)
          const addressResult = await fetch('/api/vision/extract-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photo_base64: photoBase64,
              gps: gpsData?.gps ? { 
                latitude: gpsData.gps.latitude, 
                longitude: gpsData.gps.longitude 
              } : null,
              structured_address: keyFacts.station_address
            })
          })

          if (addressResult.ok) {
            const addressData = await addressResult.json()
            if (addressData.address) {
              finalAddress = addressData.address
              addressSource = addressData.source
              console.log(`✅ Address extracted via ${addressData.method}:`, finalAddress)
              
              // Geocoding now happens server-side! Just use the returned coordinates
              if (addressData.coordinates) {
                addressCoordinates = addressData.coordinates
                console.log(
                  `✅ Address geocoded via ${addressData.geocode_provider} (${addressData.geocode_confidence} confidence):`,
                  addressCoordinates
                )
                
                // Log any warnings (e.g., far from current location)
                if (addressData.geocode_warnings && addressData.geocode_warnings.length > 0) {
                  console.log('⚠️ Geocoding warnings:', addressData.geocode_warnings)
                }
              } else {
                console.log('⚠️ Geocoding returned null - address may be invalid or incomplete')
              }
            }
          }
        } catch (addressError) {
          console.log('⚠️ Hybrid address extraction failed:', addressError)
        }
      }

      // Step 3: Smart location detection
      const imageType = keyFacts.image_type || 'unclear'
      
      // Extract actual GPS coordinates (gpsData has wrapper structure)
      const actualGPS = gpsData?.gps || null
      
      const locationResult = determineLocationSource(
        actualGPS,
        exifData,
        keyFacts.date,
        imageType
      )

      console.log('📍 Location intelligence:', {
        ...locationResult,
        imageType,
      })

      // Step 4: Detect conflicts
      const conflicts = detectConflicts({
        visionData: {
          station: keyFacts.station_name,
          date: keyFacts.date,
        },
        currentGPS: actualGPS || undefined,
        exifData: exifData || undefined,
      })

      console.log('⚠️ Conflicts detected:', conflicts.length)
      // Step 5: Build fields for proposal
      const fields: ExtractedField[] = buildFieldsFromVision(
        visionData?.extractedData || {}
      )

      // Step 6: Build proposal data
      // Use address coordinates if available, otherwise fall back to GPS
      const displayCoordinates = addressCoordinates || gpsData?.gps
      
      console.log('🗺️ Map will display:', {
        addressCoordinates,
        currentGPS: gpsData?.gps,
        using: addressCoordinates ? 'ADDRESS (Jean, NV)' : 'CURRENT GPS (Florida)'
      })
      
      setProposalData({
        fields,
        imageUrl: visionData?.publicUrl || '',
        processingMetadata: visionData?.processingMetadata,
        supplementalData: {
          gps: displayCoordinates
            ? {
                latitude: displayCoordinates.latitude,
                longitude: displayCoordinates.longitude,
                accuracy: gpsData?.gps?.accuracy || 0,
                address: finalAddress || '', // Hybrid extracted address!
              }
            : null,
          exif: exifData
            ? {
                capture_date: exifData.captureDate,
                device: exifData.device,
              }
            : null,
          station_name: keyFacts.station_name,
          station_address: finalAddress, // Hybrid extracted address
          address_source: addressSource, // Track where it came from
          address_coordinates: addressCoordinates, // Geocoded coordinates
        },
        conflicts,
        locationResult, // Smart location intelligence
      })

      setStep('proposal')
    } catch (error) {
      console.error('❌ Capture failed:', error)
      setError('Failed to process photo. Please try again.')
      setStep('camera')
    }
  }

  const handleProposalAccept = async (validatedData: Record<string, any>) => {
    try {
      setIsSaving(true)
      console.log('💾 Saving event...', validatedData)

      // TODO: Implement actual save to database
      // const response = await fetch('/api/events', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     type: 'fuel',
      //     data: validatedData,
      //     supplemental_data: proposalData?.supplementalData,
      //     image_url: proposalData?.imageUrl,
      //   }),
      // })

      // Simulate save for now
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setStep('success')
      setIsSaving(false)

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/timeline')
      }, 3000)
    } catch (error) {
      console.error('❌ Save failed:', error)
      setError('Failed to save event. Please try again.')
      setIsSaving(false)
    }
  }

  const handleRetake = () => {
    setStep('camera')
    setProposalData(null)
    setError(null)
  }

  const handleCancel = () => {
    router.push('/timeline')
  }

  return (
    <>
      {/* Camera Step */}
      {step === 'camera' && (
        <CameraCapture
          kind="fuel_receipt"
          vehicleId="demo"
          onCapture={(file) => handlePhotoCapture(file)}
          onCancel={handleCancel}
        />
      )}

      {/* Processing Step */}
      {step === 'processing' && <ProcessingScreen liveData={liveData} />}

      {/* Proposal Review Step */}
      {step === 'proposal' && proposalData && (
        <AIProposalReview
          fields={proposalData.fields}
          imageUrl={proposalData.imageUrl}
          processingMetadata={proposalData.processingMetadata}
          supplementalData={proposalData.supplementalData}
          locationResult={proposalData.locationResult}
          conflicts={proposalData.conflicts}
          eventType="fuel"
          isSaving={isSaving}
          onAccept={handleProposalAccept}
          onRetake={handleRetake}
          onCancel={handleCancel}
        />
      )}

      {/* Success Step */}
      {step === 'success' && (
        <SuccessScreen
          onContinue={() => router.push('/timeline')}
          onAddAnother={() => {
            setStep('camera')
            setProposalData(null)
          }}
        />
      )}

      {/* Error Toast */}
      {error && <ErrorToast message={error} onDismiss={() => setError(null)} />}
    </>
  )
}

/**
 * Helper: Build fields from vision-extracted data
 */
function buildFieldsFromVision(extractedData: Record<string, any>): ExtractedField[] {
  const fields: ExtractedField[] = []

  // Extract from key_facts (API returns nested structure)
  const keyFacts = extractedData.key_facts || extractedData

  // Total cost
  if (keyFacts.total_amount !== undefined) {
    fields.push({
      name: 'cost',
      label: 'Total Cost',
      value: keyFacts.total_amount,
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'number',
      required: true,
    })
  }

  // Gallons
  if (keyFacts.gallons !== undefined) {
    fields.push({
      name: 'gallons',
      label: 'Gallons',
      value: keyFacts.gallons,
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'number',
      required: true,
    })
  }

  // Station
  if (keyFacts.station_name) {
    fields.push({
      name: 'station',
      label: 'Gas Station',
      value: keyFacts.station_name,
      confidence: 'medium',
      source: 'vision_ai',
      inputType: 'text',
    })
  }

  // Fuel type
  if (keyFacts.fuel_type) {
    fields.push({
      name: 'fuel_type',
      label: 'Fuel Type',
      value: keyFacts.fuel_type,
      confidence: 'medium',
      source: 'vision_ai',
      inputType: 'text',
    })
  }

  // Date
  if (keyFacts.date) {
    fields.push({
      name: 'date',
      label: 'Date',
      value: keyFacts.date,
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'date',
    })
  }

  // Odometer (may be extracted or empty)
  fields.push({
    name: 'odometer',
    label: 'Odometer Reading',
    value: keyFacts.odometer_reading || null,
    confidence: keyFacts.odometer_reading ? 'medium' : 'none',
    prompt: keyFacts.odometer_reading ? undefined : 'Helps track fuel efficiency',
    inputType: 'number',
  })

  // Notes (optional)
  fields.push({
    name: 'notes',
    label: 'Notes',
    value: null,
    confidence: 'none',
    prompt: 'Optional notes about this fill-up',
    inputType: 'text',
  })

  return fields
}
