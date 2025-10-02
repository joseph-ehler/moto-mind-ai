import React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { VehicleOnboardingFlow } from '@/components/vehicle/onboarding/VehicleOnboardingFlow'

export default function AddVehiclePage() {
  const router = useRouter()

  const handleComplete = (vehicleId: string) => {
    // Redirect to the new vehicle's page
    router.push(`/vehicles/${vehicleId}`)
  }

  const handleCancel = () => {
    // Go back to vehicles list
    router.push('/vehicles')
  }

  return (
    <>
      <Head>
        <title>Add Vehicle - MotoMind</title>
        <meta name="description" content="Add a new vehicle to your fleet" />
      </Head>

      <VehicleOnboardingFlow
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </>
  )
}
