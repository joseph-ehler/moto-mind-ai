import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { ArrowLeft, Car, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
}

export default function VehicleCostsPage() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchVehicleData = async () => {
      try {
        const vehicleResponse = await fetch(`/api/vehicles/${id}`)
        if (!vehicleResponse.ok) {
          console.error('Vehicle not found:', vehicleResponse.status)
          return
        }
        
        const vehicleData = await vehicleResponse.json()
        setVehicle(vehicleData.vehicle)
        
      } catch (error) {
        console.error('Error fetching vehicle data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicleData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse space-y-6 p-4">
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
          <div className="h-24 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md">
          <Car className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vehicle Not Found</h2>
          <p className="text-slate-500 mb-6">The vehicle you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push("/vehicles")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Fleet
          </button>
        </div>
      </div>
    )
  }

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Costs & Trends</h1>
            <p className="text-sm text-slate-600">{displayName}</p>
          </div>
        </div>
      </header>

      {/* Costs Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Cost Analysis</h2>
          <p className="text-slate-500 mb-6">
            Detailed cost breakdown and spending trends will be available here.
          </p>
          <div className="text-sm text-slate-400">
            Coming soon: Monthly spending, category breakdowns, and predictive budgeting
          </div>
        </div>
      </main>
    </div>
  )
}
