import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VehicleStatusDashboard } from '@/components/vehicle/VehicleStatusDashboard'
import { ArrowLeft, Car } from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  garage_id?: string
  garage?: {
    id: string
    name: string
    address: string
  }
}

export default function VehicleDashboard() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock data
  const mockData = {
    currentOdometer: 54120,
    odometerDate: 'Sep 21, 2024'
  }

  useEffect(() => {
    if (!id) return
    loadVehicle()
  }, [id])

  const loadVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`)
      if (response.ok) {
        const data = await response.json()
        setVehicle(data.vehicle)
      }
    } catch (error) {
      console.error('Failed to load vehicle:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-16">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
            <p className="text-gray-500 mb-6">The vehicle you're looking for doesn't exist.</p>
            <Button onClick={() => router.push("/vehicles")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fleet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Navigation */}
        <div className="max-w-4xl mx-auto mb-6">
          <button 
            onClick={() => router.push("/vehicles")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Fleet</span>
          </button>
        </div>

        {/* New Story-Driven Dashboard */}
        <VehicleStatusDashboard
          vehicle={{
            id: vehicle.id,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            nickname: vehicle.display_name
          }}
          mileage={{
            current: mockData.currentOdometer,
            lastUpdated: mockData.odometerDate
          }}
          garage={vehicle.garage ? {
            name: vehicle.garage.name,
            location: vehicle.garage.address
          } : undefined}
        />
      </div>
    </div>
  )
}
