import React, { useState } from 'react'
import { VinScanStep } from '../components/vehicle/onboarding/steps/VinScanStep'
import { Card, CardContent } from '@/components/ui/card'

export default function TestOnboardSimplePage() {
  const [error, setError] = useState<string | null>(null)

  const handleVINConfirmed = async (vin: string) => {
    console.log('VIN confirmed:', vin)
    // Just log, don't do any API calls yet
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Test VIN Input Only</h1>
      
      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
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
