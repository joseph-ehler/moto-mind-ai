import React, { useState, useCallback } from 'react'
import { VinScanStep } from '../components/vehicle/onboarding/steps/VinScanStep'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function TestSimpleApiPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [vehicleSpecs, setVehicleSpecs] = useState<any>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageResponse, setImageResponse] = useState<any>(null)

  const fetchCanonicalImage = useCallback(async (specs: any) => {
    if (!specs) return

    console.log('🖼️ Starting simple canonical image fetch for:', specs.year, specs.make, specs.model)
    setImageLoading(true)
    setImageResponse(null)
    
    try {
      const params = new URLSearchParams({
        year: specs.year.toString(),
        make: specs.make,
        model: specs.model,
        bodyStyle: specs.body_class?.toLowerCase() || 'sedan',
        angle: 'front_3q'
      })
      
      console.log('📤 Calling simple canonical-image API with params:', params.toString())
      
      // Use the simple API instead
      const response = await fetch(`/api/canonical-image-simple?${params}`)
      console.log('📥 Simple canonical image response status:', response.status)
      
      const data = await response.json()
      console.log('📊 Simple canonical image data:', data)
      
      setImageResponse(data)
      
    } catch (error) {
      console.error('💥 Error fetching simple canonical image:', error)
      setImageResponse({ error: 'Failed to load image' })
    } finally {
      console.log('🏁 Simple canonical image fetch complete')
      setImageLoading(false)
    }
  }, [])

  const handleVINConfirmed = useCallback(async (vin: string) => {
    console.log('🔍 Starting VIN decode for:', vin)
    setIsLoading(true)
    setError(null)

    try {
      // VIN decode
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
        console.log('✅ VIN decoded successfully')
        setVehicleSpecs(data.specs)
        
        // Fetch canonical image using simple API
        console.log('🖼️ Now fetching simple canonical image...')
        try {
          await fetchCanonicalImage(data.specs)
        } catch (imageError) {
          console.warn('⚠️ Simple canonical image fetch failed:', imageError)
        }
      } else {
        setError(data.error || 'Failed to decode VIN')
      }
    } catch (err) {
      console.error('💥 VIN decode error:', err)
      setError('Failed to decode VIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchCanonicalImage])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test Simple Canonical API</h1>
      <p className="text-gray-600">Testing with simplified canonical image API</p>
      
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

      {imageLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-purple-600">🖼️ Fetching simple canonical image...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {vehicleSpecs && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Decoded Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p><strong>Year:</strong> {vehicleSpecs.year}</p>
              <p><strong>Make:</strong> {vehicleSpecs.make}</p>
              <p><strong>Model:</strong> {vehicleSpecs.model}</p>
              <p><strong>VIN:</strong> {vehicleSpecs.vin}</p>
            </div>
            
            {imageResponse && (
              <div>
                <h3 className="font-semibold mb-2">Canonical Image Response:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(imageResponse, null, 2)}
                </pre>
              </div>
            )}
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
