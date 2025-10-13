/**
 * Fuel Capture Flow Page
 * Complete end-to-end flow: Camera → GPS/EXIF → Conflicts → Proposal → Save
 */

'use client'

import { useState, useEffect } from 'react'
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
import { AIProposalReviewV2 } from '@/components/capture/AIProposalReview.v2'
import { fileToBase64 } from '@/lib/utils/file'
import { fetchHistoricalWeather, type WeatherData } from '@/lib/weather-capture'

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
  const [vehicleId, setVehicleId] = useState<string | null>(null)

  // Use Captiva Sport LTZ
  useEffect(() => {
    const captivaId = '75bf28ae-b576-4628-abb0-9728dfc01ec0'
    setVehicleId(captivaId)
    console.log('📍 Using vehicle: Captiva Sport LTZ', captivaId)
  }, [])

  const handlePhotoCapture = async (photo: File) => {
    setStep('processing')
    setError(null)
    setLiveData({}) // Reset live data

    try {
      // Step 1: Parallel data collection (GPS, EXIF, Vision)
      console.log('🚀 Starting parallel data collection...')
      
      const [vision, gps, exif] = await Promise.allSettled([
        uploadToVisionAPI(photo, 'fuel_receipt', vehicleId || undefined),
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
      
      // DEBUG: Log ALL extracted fields
      console.log('🔍 ALL Vision Fields:', {
        pump_number: keyFacts.pump_number,
        transaction_number: keyFacts.transaction_number,
        tax_amount: keyFacts.tax_amount,
        time: keyFacts.time,
        payment_method: keyFacts.payment_method,
      })
      
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

      // Step 3.5: Fetch historical weather (NEW!)
      let weatherData: WeatherData | null = null
      console.log('🌤️ Weather fetch check:', {
        hasAddressCoordinates: !!addressCoordinates,
        hasActualGPS: !!actualGPS,
        date: keyFacts.date,
        time: keyFacts.time,
        coords: addressCoordinates || actualGPS
      })
      
      if (addressCoordinates || actualGPS) {
        const coords = addressCoordinates || actualGPS
        if (coords && keyFacts.date) {
          try {
            console.log('🌤️ Calling fetchHistoricalWeather with:', {
              lat: coords.latitude,
              lng: coords.longitude,
              date: keyFacts.date,
              time: keyFacts.time
            })
            
            weatherData = await fetchHistoricalWeather(
              coords.latitude,
              coords.longitude,
              keyFacts.date,
              keyFacts.time // Optional, defaults to noon if missing
            )
            
            if (weatherData) {
              console.log('🌤️ Weather captured:', {
                temperature: `${weatherData.temperature_f}°F`,
                condition: weatherData.condition,
                precipitation: `${weatherData.precipitation_mm}mm`
              })
            } else {
              console.log('⚠️ Weather fetch returned null')
            }
          } catch (weatherError) {
            console.log('⚠️ Weather fetch failed (non-critical):', weatherError)
          }
        } else {
          console.log('⚠️ Missing coords or date:', { hasCoords: !!coords, date: keyFacts.date })
        }
      } else {
        console.log('⚠️ No GPS coordinates available for weather')
      }

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
          // Store all vision extracted fields for saving
          pump_number: keyFacts.pump_number,
          transaction_number: keyFacts.transaction_number,
          tax_amount: keyFacts.tax_amount,
          payment_method: keyFacts.payment_method,
          time: keyFacts.time,
                  // Weather data (NEW!)
                  weather: weatherData ? {
                    temperature_f: weatherData.temperature_f,
                    condition: weatherData.condition,
                    precipitation_mm: weatherData.precipitation_mm,
                    windspeed_mph: weatherData.windspeed_mph,
                    humidity_percent: weatherData.humidity_percent,
                    pressure_inhg: weatherData.pressure_inhg,
                    source: weatherData.source,
                  } : null,
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
      console.log('💾 Saving fuel fill-up...', validatedData)

      if (!vehicleId) {
        throw new Error('No vehicle selected')
      }

      // Get supplemental data
      const supplemental = proposalData?.supplementalData || {}
      const coordinates = supplemental.address_coordinates || supplemental.gps

      // The imageUrl from vision API is already a permanent Supabase URL!
      // It was uploaded during vision processing
      const imageUrl = proposalData?.imageUrl

      console.log('📸 Receipt image URL:', imageUrl)
      console.log('📸 Full proposalData:', proposalData)
      
      if (!imageUrl) {
        console.warn('⚠️ WARNING: No image URL found in proposalData!')
      }

      // Prepare save payload (tenant_id will be injected by middleware)
      const savePayload = {
        vehicle_id: vehicleId,
        total_cost: validatedData.cost,
        gallons: validatedData.gallons,
        price_per_gallon: validatedData.cost / validatedData.gallons,
        station_name: validatedData.station || supplemental.station_name,
        station_address: supplemental.station_address,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
        fuel_type: validatedData.fuel_type,
        odometer_reading: validatedData.odometer || null,
        fillup_date: validatedData.date,
        notes: validatedData.notes,
        receipt_image_url: imageUrl, // Permanent Supabase URL
        // Additional receipt details from vision extraction
        pump_number: supplemental.pump_number,
        transaction_number: supplemental.transaction_number,
        tax_amount: supplemental.tax_amount,
        payment_method: supplemental.payment_method,
        time: supplemental.time,
        // Weather data (NEW!)
        weather_temperature_f: supplemental.weather?.temperature_f,
        weather_condition: supplemental.weather?.condition,
        weather_precipitation_mm: supplemental.weather?.precipitation_mm,
        weather_windspeed_mph: supplemental.weather?.windspeed_mph,
        weather_humidity_percent: supplemental.weather?.humidity_percent,
        weather_pressure_inhg: supplemental.weather?.pressure_inhg,
        raw_vision_data: {
          ...validatedData,
          supplemental: supplemental,
          processing_metadata: proposalData?.processingMetadata,
          image_url: imageUrl,
          weather: supplemental.weather, // Include in raw data
        },
      }

      console.log('📤 Sending to API:', savePayload)

      const response = await fetch('/api/fuel-fillups/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save fuel fill-up')
      }

      console.log('✅ Saved successfully:', result.fillup)

      setStep('success')
      setIsSaving(false)

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('❌ Save failed:', error)
      setError(error.message || 'Failed to save event. Please try again.')
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

      {/* Proposal Review Step - Using Unified DataSection Pattern */}
      {step === 'proposal' && proposalData && (
        <AIProposalReviewV2
          fields={proposalData.fields}
          imageUrl={proposalData.imageUrl}
          location={
            proposalData.supplementalData?.gps
              ? {
                  lat: proposalData.supplementalData.gps.latitude,
                  lng: proposalData.supplementalData.gps.longitude,
                  address: proposalData.supplementalData.gps.address,
                  stationName: proposalData.supplementalData.station_name,
                }
              : undefined
          }
          weather={
            proposalData.supplementalData?.weather
              ? {
                  temperature_f: proposalData.supplementalData.weather.temperature_f,
                  condition: proposalData.supplementalData.weather.condition,
                  precipitation_mm: proposalData.supplementalData.weather.precipitation_mm,
                  windspeed_mph: proposalData.supplementalData.weather.windspeed_mph,
                  humidity_percent: proposalData.supplementalData.weather.humidity_percent,
                  pressure_inhg: proposalData.supplementalData.weather.pressure_inhg,
                }
              : undefined
          }
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
  
  // DEBUG: Log what we actually have
  console.log('🔍 buildFieldsFromVision - keyFacts:', {
    time: keyFacts.time,
    transaction_number: keyFacts.transaction_number,
    tax_amount: keyFacts.tax_amount,
    pump_number: keyFacts.pump_number,
    payment_method: keyFacts.payment_method,
  })

  // ============================================================================
  // 💵 SECTION 1: What You Paid
  // ============================================================================
  
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

  // Tax amount
  fields.push({
    name: 'tax_amount',
    label: 'Tax',
    value: keyFacts.tax_amount || null,
    confidence: keyFacts.tax_amount ? 'high' : 'none',
    source: keyFacts.tax_amount ? 'vision_ai' : undefined,
    inputType: 'number',
  })

  // ============================================================================
  // 📅 SECTION 2: When & Where
  // ============================================================================

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

  // Time
  fields.push({
    name: 'time',
    label: 'Time',
    value: keyFacts.time || null,
    confidence: keyFacts.time ? 'high' : 'none',
    source: keyFacts.time ? 'vision_ai' : undefined,
    inputType: 'text',
  })

  // Location - Triggers the LocationSection component with map
  if (keyFacts.station_name) {
    fields.push({
      name: 'location',
      label: '📍 Location',
      value: keyFacts.station_name,
      confidence: 'high',
      source: 'vision_ai',
      inputType: 'text',
    })
  }

  // ============================================================================
  // 🧾 SECTION 3: Receipt Details
  // ============================================================================

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

  // Pump number
  fields.push({
    name: 'pump_number',
    label: 'Pump #',
    value: keyFacts.pump_number || null,
    confidence: keyFacts.pump_number ? 'high' : 'none',
    source: keyFacts.pump_number ? 'vision_ai' : undefined,
    inputType: 'text',
  })

  // Transaction number
  fields.push({
    name: 'transaction_number',
    label: 'Transaction #',
    value: keyFacts.transaction_number || null,
    confidence: keyFacts.transaction_number ? 'high' : 'none',
    source: keyFacts.transaction_number ? 'vision_ai' : undefined,
    inputType: 'text',
  })

  // Payment method
  fields.push({
    name: 'payment_method',
    label: 'Payment Method',
    value: keyFacts.payment_method || null,
    confidence: keyFacts.payment_method ? 'high' : 'none',
    source: keyFacts.payment_method ? 'vision_ai' : undefined,
    inputType: 'text',
  })

  // ============================================================================
  // 🚗 SECTION 4: Your Vehicle (end of form)
  // ============================================================================

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
