import React, { useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VINScanner } from '@/components/vision/VINScanner'
import { OdometerReader } from '@/components/vision/OdometerReader'
import { ArrowLeft, Camera, CheckCircle, Loader2, Car, Gauge } from 'lucide-react'
import Link from 'next/link'

interface VehicleData {
  vin?: string
  year?: number
  make?: string
  model?: string
  trim?: string
  current_mileage: number
  nickname?: string
  color?: string
  license_plate?: string
}

type Step = 'method' | 'vin_scan' | 'manual_entry' | 'mileage' | 'mileage_scan' | 'optional' | 'success'

export default function VehicleOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('method')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDecodingVin, setIsDecodingVin] = useState(false)
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    current_mileage: 0
  })

  // VIN Auto-decode function (same as EditVehicleModal)
  const handleVinDecode = async (vin: string) => {
    if (vin.length !== 17) return
    
    console.log('🔍 Starting VIN decode for onboard:', vin)
    setIsDecodingVin(true)
    try {
      const response = await fetch('/api/vehicles/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })
      
      console.log('🔍 VIN decode response status:', response.status)
      
      if (response.ok) {
        const decoded = await response.json()
        console.log('🔍 VIN decode response:', decoded)
        
        setVehicleData(prev => ({
          ...prev,
          year: decoded.year ? parseInt(decoded.year.toString()) : prev.year,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          trim: decoded.trim || prev.trim,
          vin: vin
        }))
      } else {
        console.error('🔍 VIN decode failed with status:', response.status)
      }
    } catch (error) {
      console.error('🔍 VIN decode error:', error)
    } finally {
      setIsDecodingVin(false)
    }
  }

  // Handle VIN input changes
  const handleVinChange = (value: string) => {
    console.log('🔍 VIN input change:', value, 'Length:', value.length)
    setVehicleData(prev => ({ ...prev, vin: value }))
    
    // Auto-decode VIN when it's 17 characters
    if (value.length === 17) {
      console.log('🔍 VIN is 17 characters, triggering decode')
      handleVinDecode(value)
    }
  }

  // Step 1: VIN Scanner Success
  const handleVINDetected = async (vinData: any) => {
    setLoading(true)
    setError(null)

    console.log('🔍 VIN detected from scanner:', vinData)

    try {
      // Clean and validate VIN format - handle multiple possible locations
      let rawVin = vinData.VIN || vinData.vin || vinData.data?.VIN || vinData.data?.vin || vinData.data?.extracted_text
      console.log('🔍 Raw VIN from scanner:', rawVin)
      console.log('🔍 Full vinData structure:', JSON.stringify(vinData, null, 2))
      
      let cleanVin = rawVin
      if (cleanVin) {
        // Remove spaces, dashes, and other common OCR artifacts
        cleanVin = cleanVin.replace(/[\s\-_]/g, '').toUpperCase()
        // Remove characters that don't belong in VINs (I, O, Q are not used)
        cleanVin = cleanVin.replace(/[IOQ]/g, (match: string) => {
          switch(match) {
            case 'I': return '1'
            case 'O': return '0'
            case 'Q': return '0'
            default: return match
          }
        })
      }

      console.log('🔍 Cleaned VIN:', cleanVin, 'Length:', cleanVin?.length)

      if (!cleanVin || cleanVin.length !== 17) {
        console.error('❌ Invalid VIN format from scanner:', { 
          original: rawVin, 
          cleaned: cleanVin, 
          length: cleanVin?.length 
        })
        setError(`Invalid VIN format. Expected 17 characters, got ${cleanVin?.length || 0}. You can enter vehicle details manually.`)
        setVehicleData(prev => ({ ...prev, vin: rawVin }))
        setStep('manual_entry')
        setLoading(false)
        return
      }

      // Decode VIN immediately
      console.log('📡 Sending cleaned VIN to decode API:', { original: rawVin, cleaned: cleanVin })
      const response = await fetch('/api/vehicles/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: cleanVin })
      })

      const result = await response.json()
      console.log('📋 VIN decode API response:', result)

      if (response.ok && result.success) {
        console.log('✅ VIN decode successful, updating vehicle data')
        setVehicleData(prev => ({
          ...prev,
          vin: cleanVin, // Use cleaned VIN
          year: result.year,
          make: result.make,
          model: result.model,
          trim: result.trim
        }))
        setStep('mileage')
      } else {
        // VIN scan worked but decode failed - show error and go to manual entry
        console.error('❌ VIN decode failed:', result)
        setError(`VIN decode failed: ${result.error || 'Unknown error'}. You can enter vehicle details manually.`)
        setVehicleData(prev => ({ ...prev, vin: cleanVin })) // Use cleaned VIN
        setStep('manual_entry')
      }
    } catch (err) {
      setError('Failed to decode VIN. You can enter vehicle details manually.')
      setVehicleData(prev => ({ ...prev, vin: vinData.vin }))
      setStep('manual_entry')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Manual Entry Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (vehicleData.year && vehicleData.make && vehicleData.model) {
      setStep('mileage')
    }
  }

  // Step 3: Odometer Scanner Success
  const handleOdometerRead = (odometerData: any) => {
    setVehicleData(prev => ({
      ...prev,
      current_mileage: odometerData.current_mileage
    }))
    setStep('optional')
  }

  // Step 3: Mileage Submit
  const handleMileageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (vehicleData.current_mileage >= 0) {
      setStep('optional')
    }
  }

  // Final: Complete Onboarding
  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vehicles/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      })

      const result = await response.json()

      if (result.success) {
        setStep('success')
        // Redirect after showing success
        setTimeout(() => {
          router.push(result.redirect_to)
        }, 2000)
      } else {
        setError(result.error || 'Failed to add vehicle')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDisplayName = () => {
    if (vehicleData.nickname) return vehicleData.nickname
    if (vehicleData.year && vehicleData.make && vehicleData.model) {
      return `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`
    }
    return 'Your Vehicle'
  }

  return (
    <>
      <Head>
        <title>Add Vehicle - MotoMind</title>
        <meta name="description" content="Add a new vehicle to your fleet" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/vehicles" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fleet
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">Add Vehicle</h1>
            <p className="text-gray-600 mt-1">Get your vehicle set up in 30 seconds</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Method Selection */}
          {step === 'method' && (
            <Card>
              <CardHeader>
                <CardTitle>How would you like to add your vehicle?</CardTitle>
                <CardDescription>Choose the fastest method for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setStep('vin_scan')}
                  className="w-full h-16 text-left flex items-center gap-4"
                  size="lg"
                >
                  <Camera className="w-6 h-6" />
                  <div>
                    <div className="font-medium">Scan VIN (Recommended)</div>
                    <div className="text-sm opacity-80">Auto-fills year, make, model, trim</div>
                  </div>
                </Button>
                
                <Button 
                  onClick={() => setStep('manual_entry')}
                  variant="outline"
                  className="w-full h-16 text-left flex items-center gap-4"
                  size="lg"
                >
                  <Car className="w-6 h-6" />
                  <div>
                    <div className="font-medium">Enter Manually</div>
                    <div className="text-sm opacity-60">Type year, make, and model</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: VIN Scanner */}
          {step === 'vin_scan' && (
            <div>
              <VINScanner
                onVINDetected={handleVINDetected}
                onCancel={() => setStep('method')}
                title="Scan Your VIN"
              />
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('manual_entry')}
                  disabled={loading}
                >
                  Can't scan? Enter manually
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Manual Entry */}
          {step === 'manual_entry' && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details</CardTitle>
                <CardDescription>Enter your vehicle information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="space-y-5">
                    {/* Vehicle Information Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Vehicle Information</h3>
                      
                      {/* VIN Field with Auto-decode */}
                      <div>
                        <Label htmlFor="vin" className="text-sm font-medium flex items-center gap-2">
                          VIN (Vehicle Identification Number) *
                          {isDecodingVin && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                        </Label>
                        <Input
                          id="vin"
                          value={vehicleData.vin || ''}
                          onChange={(e) => handleVinChange(e.target.value.toUpperCase())}
                          placeholder="17-character VIN (auto-decodes vehicle info)"
                          maxLength={17}
                          required
                          className="mt-1 font-mono"
                          disabled={isDecodingVin}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the 17-character VIN to automatically populate vehicle details
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor="year" className="text-sm font-medium">Year *</Label>
                          <Input
                            id="year"
                            type="number"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            value={vehicleData.year || ''}
                            onChange={(e) => setVehicleData(prev => ({ 
                              ...prev, 
                              year: parseInt(e.target.value) || undefined 
                            }))}
                            required
                            className="mt-1"
                            placeholder="2019"
                          />
                        </div>
                        <div>
                          <Label htmlFor="make" className="text-sm font-medium">Make *</Label>
                          <Input
                            id="make"
                            value={vehicleData.make || ''}
                            onChange={(e) => setVehicleData(prev => ({ 
                              ...prev, 
                              make: e.target.value 
                            }))}
                            required
                            className="mt-1"
                            placeholder="Honda"
                          />
                        </div>
                        <div>
                          <Label htmlFor="model" className="text-sm font-medium">Model *</Label>
                          <Input
                            id="model"
                            value={vehicleData.model || ''}
                            onChange={(e) => setVehicleData(prev => ({ 
                              ...prev, 
                              model: e.target.value 
                            }))}
                            required
                            className="mt-1"
                            placeholder="Civic"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Personal Details Section */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Personal Details</h3>
                      
                      <div>
                        <Label htmlFor="nickname" className="text-sm font-medium">Nickname</Label>
                        <Input
                          id="nickname"
                          value={vehicleData.nickname || ''}
                          onChange={(e) => setVehicleData(prev => ({ 
                            ...prev, 
                            nickname: e.target.value 
                          }))}
                          className="mt-1"
                          placeholder="My Car, Work Truck, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="trim" className="text-sm font-medium">Trim Level</Label>
                          <Input
                            id="trim"
                            value={vehicleData.trim || ''}
                            onChange={(e) => setVehicleData(prev => ({ 
                              ...prev, 
                              trim: e.target.value 
                            }))}
                            className="mt-1"
                            placeholder="EX, LX, Sport, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="license_plate" className="text-sm font-medium">License Plate</Label>
                          <Input
                            id="license_plate"
                            value={vehicleData.license_plate || ''}
                            onChange={(e) => setVehicleData(prev => ({ 
                              ...prev, 
                              license_plate: e.target.value 
                            }))}
                            className="mt-1"
                            placeholder="ABC123"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep('method')}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Current Mileage */}
          {step === 'mileage' && (
            <Card>
              <CardHeader>
                <CardTitle>Current Mileage</CardTitle>
                <CardDescription>
                  What's on your odometer right now? This starts your timeline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMileageSubmit} className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="text-lg font-medium text-gray-900 mb-2">
                      {getDisplayName()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicleData.vin && `VIN: ${vehicleData.vin}`}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center">
                      <Button
                        type="button"
                        onClick={() => setStep('mileage_scan')}
                        className="w-full h-16 mb-4"
                        size="lg"
                      >
                        <Gauge className="w-6 h-6 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Snap Your Odometer</div>
                          <div className="text-sm opacity-80">Auto-read mileage from photo</div>
                        </div>
                      </Button>
                      
                      <div className="text-sm text-gray-500 mb-4">or enter manually:</div>
                    </div>

                    <div>
                      <Label htmlFor="mileage">Current Mileage *</Label>
                      <Input
                        id="mileage"
                        type="number"
                        min="0"
                        max="999999"
                        value={vehicleData.current_mileage || ''}
                        onChange={(e) => setVehicleData(prev => ({ 
                          ...prev, 
                          current_mileage: parseInt(e.target.value) || 0 
                        }))}
                        required
                        placeholder="125432"
                        className="text-lg text-center"
                      />
                      <div className="text-sm text-gray-500 mt-1 text-center">
                        miles
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(vehicleData.vin ? 'method' : 'manual_entry')}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 4.5: Odometer Scanner */}
          {step === 'mileage_scan' && (
            <div>
              <OdometerReader
                onMileageRead={handleOdometerRead}
                onCancel={() => setStep('mileage')}
                title="Snap Your Odometer"
              />
              <div className="mt-4 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('mileage')}
                >
                  Enter manually instead
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Optional Details */}
          {step === 'optional' && (
            <Card>
              <CardHeader>
                <CardTitle>Almost Done!</CardTitle>
                <CardDescription>Add a nickname or other details (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleComplete} className="space-y-4">
                  <div className="text-center mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="text-lg font-medium text-gray-900">
                      {getDisplayName()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Current mileage: {vehicleData.current_mileage?.toLocaleString()} miles
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nickname">Nickname (Optional)</Label>
                    <Input
                      id="nickname"
                      value={vehicleData.nickname || ''}
                      onChange={(e) => setVehicleData(prev => ({ 
                        ...prev, 
                        nickname: e.target.value 
                      }))}
                      placeholder="My Civic, Work Truck, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="color">Color (Optional)</Label>
                      <Input
                        id="color"
                        value={vehicleData.color || ''}
                        onChange={(e) => setVehicleData(prev => ({ 
                          ...prev, 
                          color: e.target.value 
                        }))}
                        placeholder="Silver"
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_plate">License Plate (Optional)</Label>
                      <Input
                        id="license_plate"
                        value={vehicleData.license_plate || ''}
                        onChange={(e) => setVehicleData(prev => ({ 
                          ...prev, 
                          license_plate: e.target.value 
                        }))}
                        placeholder="ABC-1234"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setStep('mileage')}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Vehicle
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Success */}
          {step === 'success' && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Vehicle Added Successfully!
                </h2>
                <p className="text-gray-600 mb-4">
                  {getDisplayName()} is now in your fleet
                </p>
                <div className="text-sm text-gray-500">
                  Redirecting to vehicle dashboard...
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
