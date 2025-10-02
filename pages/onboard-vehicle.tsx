import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OnboardVehicleRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new URL structure
    router.replace('/vehicles/onboard')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-sm text-gray-600">Taking you to the vehicle onboarding page</p>
      </div>
    </div>
  )
}
