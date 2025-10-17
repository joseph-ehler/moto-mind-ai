import React, { useState, useCallback } from 'react'
import { VinScanStep } from '../components/vehicle/onboarding/steps/VinScanStep'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function TestOnboardDebugPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [vehicleSpecs, setVehicleSpecs] = useState<any>(null)

  const handleVINConfirmed = useCallback(async (vin: string) => {
    console.log('🔍 Starting VIN decode for:', vin)
    setIsLoading(true)
    setError(null)

    try {
      // Test just the VIN decode API call
      console.log('📤 Calling decode-vin API...')
      const response = await fetch('/api/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: vin })
      })

      console.log('📥 VIN decode response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`VIN decode failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 VIN decode data:', data)
      
      if (data.success) {
        console.log('✅ VIN decoded successfully')
        setVehicleSpecs(data.specs)
      } else {
        console.log('❌ VIN decode failed:', data.error)
        setError(data.error || 'Failed to decode VIN')
      }
    } catch (err) {
      console.error('💥 VIN decode error:', err)
      setError('Failed to decode VIN. Please try again.')
    } finally {
      console.log('🏁 VIN decode complete')
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug VIN Decode</h1>
      <p className="text-gray-600">Testing VIN decode API call only (no canonical images)</p>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-blue-600">🔄 Decoding VIN...</p>
          </CardContent>
        </Card>
      )}

      {vehicleSpecs && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Decoded Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Year:</strong> {vehicleSpecs.year}</p>
            <p><strong>Make:</strong> {vehicleSpecs.make}</p>
            <p><strong>Model:</strong> {vehicleSpecs.model}</p>
            <p><strong>VIN:</strong> {vehicleSpecs.vin}</p>
          </CardContent>
        </Card>
      )}

      <VinScanStep
        onVINConfirmed={handleVINConfirmed}
        onError={setError}
      />
    </div>
  )
}
