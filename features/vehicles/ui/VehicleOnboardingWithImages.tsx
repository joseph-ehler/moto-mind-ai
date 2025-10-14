import React, { useState, useCallback, useEffect } from 'react'
import { VINInputEnhanced } from './VINInputEnhanced'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
  lat: number
  lng: number
  timezone: string
}

interface CanonicalImage {
  id: string
  canonicalKey: string
  url: string
  angle: string
  verified: boolean
  createdAt: string
}

type OnboardingStep = 'vin-validation' | 'final-confirmation' | 'complete'

interface VehicleOnboardingProps {
  onComplete: (vehicleId: string) => void
  onCancel: () => void
}

export function VehicleOnboardingWithImages({ onComplete, onCancel }: VehicleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('vin-validation')
  const [startTime] = useState(Date.now())
  const [stepTimes, setStepTimes] = useState<Record<string, number>>({})
  
  // State for each step
  const [vehicleSpecs, setVehicleSpecs] = useState<VehicleSpecs | null>(null)
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null)
  const [vehicleNickname, setVehicleNickname] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Canonical image state
  const [canonicalImage, setCanonicalImage] = useState<CanonicalImage | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // Fetch canonical image for vehicle
  const fetchCanonicalImage = useCallback(async (specs: VehicleSpecs) => {
    if (!specs) return

    setImageLoading(true)
    setImageError(null)
    
    try {
      console.log('🖼️ Fetching canonical image for:', specs.year, specs.make, specs.model)
      
      const params = new URLSearchParams({
        year: specs.year.toString(),
        make: specs.make,
        model: specs.model,
        bodyStyle: specs.body_class.toLowerCase(),
        angle: 'front_3q'
      })
      
      const response = await fetch(`/api/canonical-image?${params}`)
      const data = await response.json()
      
      if (response.ok && data.success && data.image) {
        console.log('✅ Canonical image found:', data.image.url)
        setCanonicalImage(data.image)
      } else if (response.status === 202) {
        // Image not cached, generation queued
        console.log('⏳ Image generation queued, will use placeholder')
        setCanonicalImage(null)
      } else {
        console.log('❌ No canonical image available')
        setImageError('No image available')
      }
    } catch (error) {
      console.error('❌ Error fetching canonical image:', error)
      setImageError('Failed to load image')
    } finally {
      setImageLoading(false)
    }
  }, [])

  // Step 1: VIN Confirmed - Decode and show results
  const handleVINConfirmed = useCallback(async (vin: string) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🔍 Decoding VIN:', vin)
      
      // Decode VIN with NHTSA
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vin })
      })

      if (!response.ok) {
        throw new Error(`VIN decode failed: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log('✅ VIN decoded successfully:', data.specs)
        setVehicleSpecs(data.specs)
        setSmartDefaults(data.smart_defaults)
        
        // Generate default nickname
        setVehicleNickname(`${data.specs.year} ${data.specs.make} ${data.specs.model}`)
        
        // Fetch canonical image
        await fetchCanonicalImage(data.specs)
        
        setCurrentStep('final-confirmation')
      } else {
        setError(data.error || 'Failed to decode VIN')
        setVehicleSpecs({
          vin: vin,
          year: 0,
          make: 'Unknown',
          model: 'Unknown',
          body_class: 'Unknown',
          engine: { fuel_type: 'Unknown' },
          drivetrain: 'Unknown',
          transmission: 'Unknown',
          manufactured: { country: 'Unknown' },
          recalls: [],
          decoded_at: new Date().toISOString(),
          source: 'nhtsa'
        })
        setSmartDefaults({
          service_intervals: {
            oil_change_miles: 5000,
            tire_rotation_miles: 7500,
            brake_inspection_miles: 15000
          },
          baseline_mpg: null,
          maintenance_schedule: []
        })
        
        // Generate default nickname
        setVehicleNickname(`Vehicle ${vin}`)
        
        setCurrentStep('final-confirmation')
      }
    } catch (err) {
      console.error('VIN decode error:', err)
      setError('Failed to decode VIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchCanonicalImage])

  // Step 2: Save Vehicle
  const handleSaveVehicle = useCallback(async () => {
    if (!vehicleSpecs) return

    setIsLoading(true)
    
    try {
      const payload = {
        nickname: vehicleNickname || `${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}`,
        vin: vehicleSpecs.vin,
        make: vehicleSpecs.make,
        model: vehicleSpecs.model,
        year: vehicleSpecs.year,
        enrichment: vehicleSpecs,
        smart_defaults: smartDefaults,
        garage_id: selectedGarage?.id || null,
        onboarding_time_ms: Date.now() - startTime
      }

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        setCurrentStep('complete')
        onComplete(data.vehicle_id)
      } else {
        setError(data.error || 'Failed to save vehicle')
      }
    } catch (err) {
      console.error('Save vehicle error:', err)
      setError('Failed to save vehicle. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [vehicleSpecs, vehicleNickname, smartDefaults, selectedGarage, startTime, onComplete])

  // Progress calculation
  const getStepProgress = () => {
    switch (currentStep) {
      case 'vin-validation': return vehicleSpecs ? 50 : 25
      case 'final-confirmation': return 75
      case 'complete': return 100
      default: return 0
    }
  }

  // Render Final Confirmation with Canonical Image
  const renderFinalConfirmation = () => {
    if (!vehicleSpecs) return null

    return (
      <div className="space-y-6">
        {/* Vehicle Header with Canonical Image */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
              
              {/* Vehicle Image Section */}
              <div className="flex-shrink-0">
                <div className="relative w-80 h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {imageLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-gray-600">Generating studio image...</p>
                        <p className="text-xs text-gray-400 mt-1">Creating professional vehicle photo</p>
                      </div>
                    </div>
                  ) : canonicalImage ? (
                    <div className="relative">
                      <img
                        src={canonicalImage.url}
                        alt={`${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}`}
                        className="w-full h-full object-cover"
                        onError={() => setImageError('Failed to load image')}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Studio Image
                        </Badge>
                      </div>
                      {canonicalImage.verified && (
                        <div className="absolute bottom-2 right-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : imageError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <Car className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                        <p className="text-sm text-gray-600">Image not available</p>
                        <p className="text-xs text-gray-400 mt-1">Using default placeholder</p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Car className="text-blue-600" size={32} />
                        </div>
                        <p className="text-sm text-gray-600">Professional image</p>
                        <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Info Section */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicleSpecs.year} {vehicleSpecs.make} {vehicleSpecs.model}
                </h1>
                {vehicleSpecs.trim && (
                  <p className="text-lg text-gray-600 mt-1">{vehicleSpecs.trim}</p>
                )}
                <p className="text-sm text-gray-500 font-mono mt-2">{vehicleSpecs.vin}</p>
                
                {/* Quick specs */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-4">
                  <Badge variant="outline">{vehicleSpecs.body_class}</Badge>
                  <Badge variant="outline">{vehicleSpecs.engine.fuel_type}</Badge>
                  <Badge variant="outline">{vehicleSpecs.drivetrain}</Badge>
                  {vehicleSpecs.epa_mpg?.combined && (
                    <Badge variant="outline">{vehicleSpecs.epa_mpg.combined} MPG</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Engine & Performance */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Engine & Performance</h3>
                <div className="space-y-3">
                  {vehicleSpecs.engine.model && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Engine</Label>
                      <p className="text-gray-900">{vehicleSpecs.engine.model}</p>
                    </div>
                  )}
                  {vehicleSpecs.engine.cylinders && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Cylinders</Label>
                      <p className="text-gray-900">{vehicleSpecs.engine.cylinders}</p>
                    </div>
                  )}
                  {vehicleSpecs.engine.horsepower && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Horsepower</Label>
                      <p className="text-gray-900">{vehicleSpecs.engine.horsepower} HP</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fuel Type</Label>
                    <p className="text-gray-900">{vehicleSpecs.engine.fuel_type}</p>
                  </div>
                </div>
              </div>

              {/* Drivetrain & Manufacturing */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b pb-2">Drivetrain & Manufacturing</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Drivetrain</Label>
                    <p className="text-gray-900">{vehicleSpecs.drivetrain}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Transmission</Label>
                    <p className="text-gray-900">{vehicleSpecs.transmission}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Manufactured</Label>
                    <p className="text-gray-900">
                      {vehicleSpecs.manufactured.country}
                      {vehicleSpecs.manufactured.state && `, ${vehicleSpecs.manufactured.state}`}
                    </p>
                  </div>
                  {vehicleSpecs.epa_mpg && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">EPA MPG</Label>
                      <p className="text-gray-900">
                        {vehicleSpecs.epa_mpg.city && `${vehicleSpecs.epa_mpg.city} city`}
                        {vehicleSpecs.epa_mpg.highway && ` / ${vehicleSpecs.epa_mpg.highway} hwy`}
                        {vehicleSpecs.epa_mpg.combined && ` / ${vehicleSpecs.epa_mpg.combined} combined`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Nickname */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Nickname</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname">Give your vehicle a friendly name</Label>
                <Input
                  id="nickname"
                  value={vehicleNickname}
                  onChange={(e) => setVehicleNickname(e.target.value)}
                  placeholder={`${vehicleSpecs.year} ${vehicleSpecs.make} ${vehicleSpecs.model}`}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps you identify your vehicle in the fleet dashboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep('vin-validation')}
            disabled={isLoading}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to VIN
          </Button>
          
          <Button
            onClick={handleSaveVehicle}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="mr-2" />
                Add Vehicle to Fleet
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Add Vehicle to Fleet</h1>
          <Button variant="ghost" onClick={onCancel}>
            <X size={16} className="mr-2" />
            Cancel
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{getStepProgress()}%</span>
          </div>
          <Progress value={getStepProgress()} className="w-full" />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      {currentStep === 'vin-validation' && (
        <VINInputEnhanced
          onVINConfirmed={handleVINConfirmed}
          onError={setError}
        />
      )}

      {currentStep === 'final-confirmation' && renderFinalConfirmation()}

      {currentStep === 'complete' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vehicle Added Successfully!</h2>
                <p className="text-gray-600 mt-2">
                  {vehicleNickname} has been added to your fleet and is ready for tracking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
