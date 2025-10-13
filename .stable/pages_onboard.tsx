import React from 'react'
import { useRouter } from 'next/router'
import { VehicleOnboardingFlow } from '../components/vehicle/onboarding/VehicleOnboardingFlow'

export default function OnboardPage() {
  const router = useRouter()

  const handleComplete = (vehicleId: string) => {
    router.push(`/vehicles`)
  }

  const handleCancel = () => {
    router.push('/vehicles')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VehicleOnboardingFlow 
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
