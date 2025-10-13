import React, { useState, useCallback } from 'react'
import { VINCapture } from './VINCapture'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, Input, Label, Progress } from '@/components/ui'
import { CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight, Edit3, Car, MapPin } from 'lucide-react'

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

type OnboardingStep = 'vin-validation' | 'final-confirmation' | 'complete'

interface VehicleOnboardingProps {
  onComplete: (vehicleId: string) => void
  onCancel: () => void
}

export function VehicleOnboarding({ onComplete, onCancel }: VehicleOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('capture')
  const [startTime] = useState(Date.now())
  const [stepTimes, setStepTimes] = useState<Record<string, number>>({})
  
  // State for each step
  const [vinResult, setVINResult] = useState<VINResult | null>(null)
  const [vehicleSpecs, setVehicleSpecs] = useState<VehicleSpecs | null>(null)
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null)
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track time spent on each step
  const trackStepTime = useCallback((step: string) => {
    setStepTimes(prev => ({
      ...prev,
      [step]: Date.now() - startTime
    }))
  }, [startTime])

  // Step 1: VIN Capture (just store the result, don't auto-advance)
  const handleVINDetected = useCallback((result: VINResult) => {
    setVINResult(result)
    // Don't auto-advance - wait for user to click Continue
  }, [])

  // Step 1.5: VIN Confirmed (user clicked Continue)
  const handleVINConfirmed = useCallback(async (vin: string) => {
    setIsLoading(true)
    setError(null)
    trackStepTime('capture')

    try {
      console.log('🔍 Decoding VIN:', vin)
      
      // Decode VIN with NHTSA
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vin })
      })

      const data = await response.json()

      if (data.success) {
        setVehicleSpecs(data.specs)
        setSmartDefaults(data.smart_defaults)
        setCurrentStep('garage')
        trackStepTime('decode')
      } else {
        // Partial decode - still allow user to continue
        setError(data.error || 'VIN decode failed')
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
            brake_inspection_miles: 10000
          },
          baseline_mpg: null,
          maintenance_schedule: []
        })
        setCurrentStep('garage')
      }
    } catch (err) {
      console.error('VIN decode error:', err)
      setError('Failed to decode VIN. You can still add the vehicle manually.')
      // Allow continuation with minimal data
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
          brake_inspection_miles: 10000
        },
        baseline_mpg: null,
        maintenance_schedule: []
      })
      setCurrentStep('garage')
    } finally {
      setIsLoading(false)
    }
  }, [trackStepTime])

  // Step 2: Garage Selection
  const handleGarageSelected = useCallback((garage: Garage | null) => {
    setSelectedGarage(garage)
    if (garage) {
      setCurrentStep('review')
      trackStepTime('garage')
    }
  }, [trackStepTime])

  const handleCreateNewGarage = useCallback(async (location: { lat: number; lng: number; address: string }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/vehicless', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Garage at ${location.address.split(',')[0]}`,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedGarage(data.garage)
        setCurrentStep('review')
        trackStepTime('garage')
      } else {
        setError('Failed to create garage')
      }
    } catch (err) {
      setError('Failed to create garage')
    } finally {
      setIsLoading(false)
    }
  }, [trackStepTime])

  // Step 3: Move to Final Review
  const handleReviewComplete = useCallback((vehicleData: any) => {
    setCurrentStep('final-review')
    trackStepTime('review')
  }, [trackStepTime])

  // Step 4: Final Save
  const handleSaveVehicle = useCallback(async (vehicleData: any) => {
    setIsLoading(true)
    trackStepTime('review')

    try {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehicleData,
          onboarding_metrics: {
            total_time_seconds: Math.round((Date.now() - startTime) / 1000),
            step_times: stepTimes,
            vin_source: vinResult?.source,
            vin_confidence: vinResult?.confidence,
            decode_success: vehicleSpecs?.make !== 'Unknown'
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentStep('complete')
        
        // Complete after a brief success display
        setTimeout(() => {
          onComplete(data.vehicle.id)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save vehicle')
      }
    } catch (err) {
      setError('Failed to save vehicle')
    } finally {
      setIsLoading(false)
    }
  }, [startTime, stepTimes, vinResult, vehicleSpecs, onComplete])

  // Navigation
  const handleBack = () => {
    switch (currentStep) {
      case 'garage':
        setCurrentStep('capture')
        break
      case 'review':
        setCurrentStep('garage')
        break
      case 'final-review':
        setCurrentStep('review')
        break
      default:
        onCancel()
    }
  }

  const handleVINError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Progress indicator
  const steps = [
    { key: 'capture', label: 'Capture VIN', icon: '📱' },
    { key: 'decode', label: 'Decode', icon: '🔍' },
    { key: 'garage', label: 'Location', icon: '📍' },
    { key: 'review', label: 'Review', icon: '📝' },
    { key: 'final-review', label: 'Confirm', icon: '✅' }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Add Vehicle</h1>
            </div>
            
            {/* Progress Steps */}
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index < currentStepIndex ? 'bg-green-500 text-white' :
                    index === currentStepIndex ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {index < currentStepIndex ? '✓' : step.icon}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle size={20} className="text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && currentStep !== 'complete' && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-800">
                {currentStep === 'capture' ? 'Processing VIN...' :
                 currentStep === 'decode' ? 'Decoding vehicle information...' :
                 'Saving vehicle...'}
              </p>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'capture' && (
          <VINCapture
            onVINDetected={handleVINDetected}
            onVINConfirmed={handleVINConfirmed}
            onError={handleVINError}
          />
        )}

        {currentStep === 'garage' && (
          <div className="max-w-md mx-auto">
            <GaragePicker
              selectedGarageId={selectedGarage?.id}
              onGarageSelected={handleGarageSelected}
              onCreateNew={handleCreateNewGarage}
            />
          </div>
        )}

        {currentStep === 'review' && vehicleSpecs && smartDefaults && (
          <VehicleReviewCard
            specs={vehicleSpecs}
            smartDefaults={smartDefaults}
            selectedGarage={selectedGarage}
            onSave={handleReviewComplete}
            onEdit={() => setCurrentStep('garage')}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'final-review' && vehicleSpecs && smartDefaults && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Review</h2>
                <p className="text-gray-600">
                  Please review all information before adding this vehicle to your fleet.
                </p>
              </div>

              {/* Vehicle Summary */}
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">VIN:</span>
                      <p className="font-mono text-gray-900">{vehicleSpecs.vin}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Year:</span>
                      <p className="text-gray-900">{vehicleSpecs.year || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Make & Model:</span>
                      <p className="text-gray-900">{vehicleSpecs.make} {vehicleSpecs.model}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Body Type:</span>
                      <p className="text-gray-900">{vehicleSpecs.body_class}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                  <div className="text-sm">
                    <span className="text-gray-500">Garage:</span>
                    <p className="text-gray-900">{selectedGarage?.name || 'No garage selected'}</p>
                    {selectedGarage?.address && (
                      <p className="text-gray-600 text-xs mt-1">{selectedGarage.address}</p>
                    )}
                  </div>
                </div>

                {/* Maintenance Defaults */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Maintenance Schedule</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Oil Changes:</span>
                      <p className="text-gray-900">Every {smartDefaults.service_intervals.oil_change_miles.toLocaleString()} miles</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tire Rotation:</span>
                      <p className="text-gray-900">Every {smartDefaults.service_intervals.tire_rotation_miles.toLocaleString()} miles</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Brake Inspection:</span>
                      <p className="text-gray-900">Every {smartDefaults.service_intervals.brake_inspection_miles.toLocaleString()} miles</p>
                    </div>
                  </div>
                </div>

                {/* Data Quality */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Data Quality</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {vehicleSpecs.make !== 'Unknown' 
                      ? 'Vehicle information successfully decoded from VIN' 
                      : 'Limited vehicle data - you can add more details later'
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <button
                  onClick={() => setCurrentStep('review')}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Edit</span>
                </button>
                
                <button
                  onClick={() => handleSaveVehicle({
                    specs: vehicleSpecs,
                    smart_defaults: smartDefaults,
                    garage_id: selectedGarage?.id
                  })}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Add Vehicle to Fleet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="mb-6">
              <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Added!</h2>
              <p className="text-gray-600">
                {vehicleSpecs?.year} {vehicleSpecs?.make} {vehicleSpecs?.model} has been successfully added to your fleet.
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-green-800">
                <Clock size={16} />
                <span className="text-sm">
                  Completed in {Math.round((Date.now() - startTime) / 1000)}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
