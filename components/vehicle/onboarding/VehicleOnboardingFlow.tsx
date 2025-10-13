import React, { useState, useCallback, useEffect, useRef } from 'react'
import { VinScanStep } from './steps/VinScanStep'
import { MagicalProcessingStep } from './MagicalProcessingStep'
import { VehicleSavingStep } from './VehicleSavingStep'
import { StreamlinedGarageSelector } from './StreamlinedGarageSelector'
import { Confetti } from '@/components/ui/confetti'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/PageContainer'
import { CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, Edit3, Car, MapPin, Image as ImageIcon, Sparkles, Loader2, X } from 'lucide-react'

interface VINResult {
  vin: string
  confidence: number
  source: 'tesseract' | 'openai_vision' | 'manual'
  validated: boolean
}

interface VehicleSpecs {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  body_class: string
  engine: {
    model?: string
    cylinders?: number
    horsepower?: number
    fuel_type: string
  }
  drivetrain: string
  transmission: string
  manufactured: {
    country: string
    state?: string
  }
  recalls: any[]
  epa_mpg?: {
    city?: number
    highway?: number
    combined?: number
  }
  decoded_at: string
  source: 'nhtsa'
}

interface SmartDefaults {
  service_intervals: {
    oil_change_miles: number
    tire_rotation_miles: number
    brake_inspection_miles: number
  }
  baseline_mpg: number | null
  maintenance_schedule: Array<{
    type: string
    due_miles: number
    priority: 'high' | 'medium' | 'low'
  }>
}

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
}

interface CanonicalImage {
  id: string
  canonicalKey: string
  url: string
  angle: string
  verified: boolean
  createdAt: string
}

type OnboardingStep = 'vin-validation' | 'magical-processing' | 'final-confirmation' | 'vehicle-saving' | 'complete'

interface VehicleOnboardingProps {
  onComplete: (vehicleId: string) => void
  onCancel: () => void
}

export function VehicleOnboardingFlow({ onComplete, onCancel }: VehicleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('vin-validation')
  const [startTime] = useState(Date.now())
  const [stepTimes, setStepTimes] = useState<Record<string, number>>({})
  
  // State for each step
  const [vehicleSpecs, setVehicleSpecs] = useState<VehicleSpecs | null>(null)
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null)
  const [vehicleNickname, setVehicleNickname] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [currentMileage, setCurrentMileage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [scannedVin, setScannedVin] = useState<string>('')
  const [showGarageSelector, setShowGarageSelector] = useState(false)
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null)
  const [enrichmentComplete, setEnrichmentComplete] = useState(false)
  

  // Step 1: VIN Confirmed - Start magical processing
  const handleVINConfirmed = useCallback(async (vin: string) => {
    console.log('🎯 VIN confirmed, setting scannedVin to:', vin)
    setScannedVin(vin)
    setCurrentStep('magical-processing')
  }, [])

  // Handle magical processing completion
  const handleMagicalProcessingComplete = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Use scannedVin from state, but ensure it's available
    const vinToUse = scannedVin
    console.log('🔍 Magical processing complete, scannedVin state:', scannedVin)
    console.log('🔍 VIN to use for decoding:', vinToUse)
    
    if (!vinToUse) {
      console.error('❌ No VIN available for decoding')
      setError('No VIN available for decoding')
      setIsLoading(false)
      return
    }

    try {
      console.log('🔍 Decoding VIN:', vinToUse)
      
      // Decode VIN with NHTSA
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vinToUse })
      })

      if (!response.ok) {
        throw new Error(`VIN decode failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ VIN decoded successfully:', data)
        
        // Create specs object from decoded VIN data
        const specs: VehicleSpecs = {
          vin: data.vin,
          year: data.year,
          make: data.make,
          model: data.model,
          trim: data.trim || undefined,
          body_class: data.bodyClass || 'Unknown',
          engine: {
            fuel_type: 'Unknown'
          },
          drivetrain: 'Unknown',
          transmission: 'Unknown',
          manufactured: {
            country: 'Unknown'
          },
          recalls: [],
          decoded_at: new Date().toISOString(),
          source: 'nhtsa'
        }

        // Set the vehicle specs for the final confirmation
        setVehicleSpecs(specs)
        
        // Prepopulate vehicle nickname with full name including trim
        const fullVehicleName = `${specs.year} ${specs.make} ${specs.model}${specs.trim ? ` ${specs.trim}` : ''}`
        setVehicleNickname(fullVehicleName)
        
        setCurrentStep('final-confirmation')
      } else {
        setError(data.error || 'Failed to decode VIN')
      }
    } catch (err) {
      console.error('VIN decode error:', err)
      setError('Failed to decode VIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [scannedVin])

  // Handle garage creation
  const handleCreateGarage = useCallback(async (garageData: {
    name: string
    address: string
    lat?: number
    lng?: number
    timezone?: string
  }) => {
    try {
      const response = await fetch('/api/vehicless', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: garageData.name,
          address: garageData.address,
          lat: garageData.lat,
          lng: garageData.lng,
          timezone: garageData.timezone,
          isDefault: true // Make first garage default
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.garage
      } else {
        // Get detailed error from response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Garage creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Error creating garage:', error)
      throw error
    }
  }, [])

  // Monitor enrichment completion (background only - doesn't block UI)
  const monitorEnrichmentCompletion = useCallback(async (vehicleId: string) => {
    console.log('🔍 Starting background enrichment monitoring for vehicle:', vehicleId)
    
    // Poll the vehicle endpoint to check enrichment status
    const checkEnrichment = async () => {
      try {
        const response = await fetch(`/api/vehicles/${vehicleId}`)
        if (response.ok) {
          const data = await response.json()
          // Check if enrichment is complete (you may need to adjust this based on your API)
          if (data.vehicle?.enrichment_status === 'completed' || data.vehicle?.ai_enhanced) {
            console.log('✅ Background enrichment completed!')
            return true
          }
        }
      } catch (error) {
        console.log('⚠️ Error checking enrichment status:', error)
      }
      return false
    }

    // Initial check
    if (await checkEnrichment()) return

    // Poll every 5 seconds for up to 2 minutes (background process)
    let attempts = 0
    const maxAttempts = 24 // 2 minutes
    
    const pollInterval = setInterval(async () => {
      attempts++
      
      if (await checkEnrichment()) {
        console.log('🎉 Vehicle enrichment completed in background!')
        clearInterval(pollInterval)
        return
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ Background enrichment monitoring stopped after 2 minutes')
        clearInterval(pollInterval)
      }
    }, 5000)
  }, [])

  // Step 2: Save Vehicle - IMMEDIATE RESPONSE
  const handleSaveVehicle = useCallback(async () => {
    if (!vehicleSpecs) {
      console.error('❌ No vehicle specs available')
      setError('Vehicle specifications are missing. Please try scanning the VIN again.')
      return
    }

    if (!selectedGarage) {
      console.error('❌ No garage selected')
      setError('Please select a garage for your vehicle.')
      return
    }

    // IMMEDIATE RESPONSE - Show animation right away
    console.log('🚀 Starting vehicle save process...')
    console.log('🏠 Selected garage for vehicle:', selectedGarage)
    setCurrentStep('vehicle-saving')
    setError(null) // Clear any previous errors
    
    try {
      const vehicleData = {
        vin: vehicleSpecs.vin,
        year: vehicleSpecs.year,
        make: vehicleSpecs.make,
        model: vehicleSpecs.model,
        trim: vehicleSpecs.trim,
        body_class: vehicleSpecs.body_class,
        engine: vehicleSpecs.engine,
        drivetrain: vehicleSpecs.drivetrain,
        transmission: vehicleSpecs.transmission,
        manufactured: vehicleSpecs.manufactured,
        nickname: vehicleNickname || `${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}`,
        garage_id: selectedGarage.id, // Use selected garage (validated above)
        smart_defaults: smartDefaults,
        onboarding_duration_ms: Date.now() - startTime,
        source: 'onboarding_flow'
      }

      console.log('🚗 Saving vehicle:', vehicleData)
      console.log('🏠 Garage assignment - ID:', selectedGarage.id, 'Name:', selectedGarage.name)
      
      // Save to backend
      const response = await fetch('/api/vehicles/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: vehicleSpecs.vin,
          year: vehicleSpecs.year,
          make: vehicleSpecs.make,
          model: vehicleSpecs.model,
          trim: vehicleSpecs.trim,
          nickname: vehicleNickname || `${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}`,
          license_plate: licensePlate || null,
          current_mileage: parseInt(currentMileage) || 0,
          garage_id: selectedGarage.id // Use validated selected garage
        })
      })

      console.log('📡 API Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || 'Failed to save vehicle')
      }

      const result = await response.json()
      console.log('✅ Full API response:', result)
      
      // API returns vehicle_id at root level
      const vehicleId = result.vehicle_id
      const vehicle = result.vehicle
      
      if (!vehicleId) {
        throw new Error('No vehicle ID returned from API')
      }
      
      console.log('✅ Vehicle saved successfully:', vehicle)
      console.log('🔗 Will redirect to:', `/vehicles/${vehicleId}`)
      
      // Store the created vehicle ID for redirect
      setCreatedVehicleId(vehicleId)
      
      console.log('🎉 SUCCESS! Vehicle created, starting background enrichment...')
      console.log('🔗 Will redirect to vehicle:', vehicleId)
      
      // Start background enrichment monitoring (doesn't block UI)
      monitorEnrichmentCompletion(vehicleId)
      } catch (error) {
        console.error('Failed to save vehicle:', error)
        setError(`Failed to save vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`)
        // Go back to confirmation on error
        setCurrentStep('final-confirmation')
      }
  }, [vehicleSpecs, vehicleNickname, smartDefaults, startTime, selectedGarage, licensePlate, currentMileage, monitorEnrichmentCompletion])

  // Auto-redirect when complete step is reached
  useEffect(() => {
    if (currentStep === 'complete' && createdVehicleId) {
      const redirectTimer = setTimeout(() => {
        console.log('🔄 Auto-redirecting to vehicle page...')
        window.location.href = `/vehicles/${createdVehicleId}`
      }, 3000) // 3 second delay to show success message

      return () => clearTimeout(redirectTimer)
    }
  }, [currentStep, createdVehicleId])

  // Progress calculation
  const getStepProgress = () => {
    switch (currentStep) {
      case 'vin-validation': return 20
      case 'magical-processing': return 40
      case 'final-confirmation': return 60
      case 'vehicle-saving': return 80
      case 'complete': return 100
      default: return 0
    }
  }

  // Render Final Confirmation - Enhanced with Real Specs
  const renderFinalConfirmation = () => {
    if (!vehicleSpecs) return null

    // Build comprehensive specs array from VIN decode + enrichment data
    const buildSpecsArray = () => {
      const specs = []
      
      // Basic vehicle info (always available from VIN)
      specs.push({ label: 'Year', value: vehicleSpecs.year })
      specs.push({ label: 'Make', value: vehicleSpecs.make })
      specs.push({ label: 'Model', value: vehicleSpecs.model })
      
      if (vehicleSpecs.trim) {
        specs.push({ label: 'Trim', value: vehicleSpecs.trim })
      }
      
      specs.push({ label: 'Body Style', value: vehicleSpecs.body_class })
      specs.push({ label: 'VIN', value: vehicleSpecs.vin })
      
      // Engine specifications
      if (vehicleSpecs.engine.fuel_type !== 'Unknown') {
        specs.push({ label: 'Fuel Type', value: vehicleSpecs.engine.fuel_type })
      }
      
      if (vehicleSpecs.engine.cylinders) {
        specs.push({ label: 'Cylinders', value: `${vehicleSpecs.engine.cylinders}-cylinder` })
      }
      
      if (vehicleSpecs.engine.horsepower) {
        specs.push({ label: 'Horsepower', value: `${vehicleSpecs.engine.horsepower} HP` })
      }
      
      if (vehicleSpecs.engine.model && vehicleSpecs.engine.model !== 'Unknown') {
        specs.push({ label: 'Engine', value: vehicleSpecs.engine.model })
      }
      
      // Drivetrain specifications
      if (vehicleSpecs.drivetrain !== 'Unknown') {
        specs.push({ label: 'Drivetrain', value: vehicleSpecs.drivetrain })
      }
      
      if (vehicleSpecs.transmission !== 'Unknown') {
        specs.push({ label: 'Transmission', value: vehicleSpecs.transmission })
      }
      
      // EPA ratings
      if (vehicleSpecs.epa_mpg) {
        if (vehicleSpecs.epa_mpg.city) {
          specs.push({ label: 'City MPG', value: `${vehicleSpecs.epa_mpg.city} mpg` })
        }
        if (vehicleSpecs.epa_mpg.highway) {
          specs.push({ label: 'Highway MPG', value: `${vehicleSpecs.epa_mpg.highway} mpg` })
        }
        if (vehicleSpecs.epa_mpg.combined) {
          specs.push({ label: 'Combined MPG', value: `${vehicleSpecs.epa_mpg.combined} mpg` })
        }
      }
      
      // Manufacturing info
      if (vehicleSpecs.manufactured.country !== 'Unknown') {
        const location = vehicleSpecs.manufactured.state 
          ? `${vehicleSpecs.manufactured.country}, ${vehicleSpecs.manufactured.state}`
          : vehicleSpecs.manufactured.country
        specs.push({ label: 'Manufactured', value: location })
      }
      
      // Data source
      specs.push({ 
        label: 'Data Source', 
        value: vehicleSpecs.source.toUpperCase(),
        isSource: true 
      })
      
      return specs
    }

    const allSpecs = buildSpecsArray()

    return (
      <div className="space-y-6">
        {/* Hero Card - Inspired by Vehicle Details */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl text-white shadow-sm min-h-[200px] relative overflow-hidden">
          {/* Verification Badge - Top Right */}
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-white">VIN Verified</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 pr-24">
            {/* Primary: Year Make Model */}
            <h1 className="text-3xl font-semibold tracking-tight leading-tight">
              {vehicleSpecs.year} {vehicleSpecs.make} {vehicleSpecs.model}
              {vehicleSpecs.trim && <span className="text-white/90"> {vehicleSpecs.trim}</span>}
            </h1>
            
            {/* Secondary: Auto-detected message */}
            <p className="text-lg text-white/80 mt-2 font-medium">
              Auto-detected from VIN scan
            </p>
            
            {/* Tertiary: Key Info Chips */}
            <div className="mt-6 overflow-hidden">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                  {vehicleSpecs.body_class}
                </span>
                {vehicleSpecs.engine.fuel_type !== 'Unknown' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                    {vehicleSpecs.engine.fuel_type}
                  </span>
                )}
                {vehicleSpecs.drivetrain !== 'Unknown' && (
                  <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                    {vehicleSpecs.drivetrain}
                  </span>
                )}
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-sm font-medium whitespace-nowrap">
                  VIN: {vehicleSpecs.vin.slice(-6)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Specifications Card */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5">
            <h2 className="text-xl font-semibold text-black">Vehicle Specifications</h2>
            <p className="text-sm text-gray-600 mt-1">
              {allSpecs.length} specifications detected • More details will be added after enrichment
            </p>
          </div>

          {/* Enhancement Status */}
          <div className="px-8 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-black/5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Enriching specifications in background...</p>
                <p className="text-xs text-blue-700">
                  Feel free to continue setup. Enhanced details (engine specs, safety features, recalls) will appear in your vehicle's specifications page once complete.
                </p>
              </div>
            </div>
          </div>
          
          {/* Specification Rows */}
          <div className="divide-y divide-black/5">
            {allSpecs.map((spec, index) => (
              <div key={spec.label} className="flex items-center justify-between px-8 py-5">
                <span className="text-sm font-medium text-black/60">{spec.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-black">{spec.value}</span>
                  {spec.isSource && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      VIN Decode
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Vehicle Setup Card */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5">
            <h2 className="text-xl font-semibold text-black">Complete Vehicle Setup</h2>
            <p className="text-sm text-gray-600 mt-1">Add the final details to complete your vehicle profile</p>
          </div>
          <div className="p-8 space-y-6">
            {/* Vehicle Name */}
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium text-black mb-2 block">
                Vehicle Name
              </Label>
              <Input
                id="nickname"
                value={vehicleNickname}
                onChange={(e) => setVehicleNickname(e.target.value)}
                placeholder={`${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}${vehicleSpecs.trim ? ` ${vehicleSpecs.trim}` : ''}`}
                className="text-base h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* License Plate */}
            <div>
              <Label htmlFor="license-plate" className="text-sm font-medium text-black mb-2 block">
                License Plate <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="license-plate"
                value={licensePlate}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  // Basic validation: letters, numbers, hyphens, spaces (max 10 chars)
                  if (value === '' || /^[A-Z0-9\s\-]{1,10}$/.test(value)) {
                    setLicensePlate(value)
                  }
                }}
                placeholder="ABC-1234"
                maxLength={10}
                className="text-base h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
              />
              {licensePlate && licensePlate.length < 3 && (
                <p className="text-xs text-amber-600 mt-1">
                  License plates are typically 3+ characters
                </p>
              )}
            </div>

            {/* Current Mileage */}
            <div>
              <Label htmlFor="current-mileage" className="text-sm font-medium text-black mb-2 block">
                Current Mileage
              </Label>
              <div className="relative">
                <Input
                  id="current-mileage"
                  type="number"
                  min="0"
                  max="999999"
                  value={currentMileage}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow numbers and limit to reasonable mileage
                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 999999)) {
                      setCurrentMileage(value)
                    }
                  }}
                  placeholder="85,000"
                  className="text-base h-12 px-4 pr-16 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  miles
                </span>
              </div>
              {currentMileage && parseInt(currentMileage) > 500000 && (
                <p className="text-xs text-amber-600 mt-1">
                  High mileage detected - please verify this is correct
                </p>
              )}
            </div>

            {/* Garage Location */}
            <div>
              <Label className="text-sm font-medium text-black mb-2 block">
                Garage Location
              </Label>
              <StreamlinedGarageSelector
                selectedGarage={selectedGarage}
                onGarageSelected={setSelectedGarage}
                onCreateGarage={handleCreateGarage}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('vin-validation')}
            disabled={isLoading}
            className="order-2 sm:order-1 h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Scan Different VIN
          </Button>
          
          <Button
            onClick={handleSaveVehicle}
            disabled={isLoading}
            className="order-1 sm:order-2 h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Adding to Garage...
              </>
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" />
                Add to {selectedGarage?.name || 'My Garage'}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Confetti active={showConfetti} />
      
      {/* Header - Redesigned to match our design system */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentStep === 'complete' ? '✅ Vehicle Added!' : 'Add New Vehicle'}
              </h1>
              <p className="text-gray-600 mt-1">
                {currentStep === 'complete' ? 'Your vehicle is ready to track' : 'Scan your VIN or enter vehicle details'}
              </p>
            </div>
            {onCancel && currentStep !== 'complete' && (
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Progress Bar - Redesigned */}
          {currentStep !== 'complete' && (
            <div className="mt-6">
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                    style={{ width: `${getStepProgress()}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600 font-medium">
                    Step {['vin-validation', 'magical-processing', 'final-confirmation'].indexOf(currentStep as string) + 1} of 3
                  </span>
                  <span className="text-blue-600 font-semibold">{getStepProgress()}% Complete</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Redesigned */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'vin-validation' && (
          <VinScanStep
            onVINConfirmed={handleVINConfirmed}
            onError={setError}
          />
        )}

        {currentStep === 'magical-processing' && (
          <MagicalProcessingStep
            vin={scannedVin}
            onComplete={handleMagicalProcessingComplete}
          />
        )}

        {currentStep === 'final-confirmation' && renderFinalConfirmation()}

        {currentStep === 'vehicle-saving' && (
          <VehicleSavingStep
            vehicleName={vehicleNickname || `${vehicleSpecs?.year} ${vehicleSpecs?.make} ${vehicleSpecs?.model}`}
            garageName={selectedGarage?.name}
            onComplete={() => {
              // Direct redirect to vehicle page - no intermediate step
              if (createdVehicleId) {
                console.log('🔄 Animation complete, redirecting to vehicle page...')
                window.location.href = `/vehicles/${createdVehicleId}`
              }
            }}
          />
        )}

        {currentStep === 'complete' && (
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Vehicle Added Successfully!</h2>
              <p className="text-gray-600 text-lg mb-6">
                <span className="font-medium">{vehicleNickname}</span> is now in your fleet and ready for tracking.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Redirecting to vehicle details page...
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={() => window.location.href = `/vehicles/${createdVehicleId}`} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                >
                  Continue to Vehicle
                </Button>
                <Button 
                  onClick={() => window.location.href = '/vehicles'} 
                  variant="outline"
                >
                  View All Vehicles
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
