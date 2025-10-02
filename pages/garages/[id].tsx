import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { GarageForm } from '@/components/garage/GarageForm'
import { GarageFeatures } from '@/components/garage/GarageFeatures'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useGarageJurisdiction } from '@/hooks/useJurisdiction'
import { useGarageWeather } from '@/hooks/useWeather'
import { AppNavigation } from '@/components/layout/AppNavigation'
import { ArrowLeft, Car, Trash2 } from 'lucide-react'

interface Garage {
  id?: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  vehicles?: Vehicle[]
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  hero_image_url?: string
  garage_id?: string
  created_at?: string
}

export default function GarageDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [garage, setGarage] = useState<Garage | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  
  // Jurisdiction and weather data
  const jurisdiction = useGarageJurisdiction(garage?.id || '')
  const weather = useGarageWeather(garage?.id || '')

  useEffect(() => {
    if (!id) return
    fetchGarage()
  }, [id])

  const fetchGarage = async () => {
    try {
      // Fetch garage and vehicles in parallel
      const [garageResponse, vehiclesResponse] = await Promise.all([
        fetch(`/api/garages/${id}`),
        fetch('/api/vehicles')
      ])

      if (garageResponse.ok) {
        const garageData = await garageResponse.json()
        setGarage(garageData.garage)

        // Filter vehicles for this garage
        if (vehiclesResponse.ok) {
          const vehiclesData = await vehiclesResponse.json()
          const allVehicles = vehiclesData.data?.vehicles || vehiclesData.vehicles || []
          const garageVehicles = allVehicles.filter((v: Vehicle) => v.garage_id === id)
          setVehicles(garageVehicles)
        }
      } else {
        console.error('Garage not found')
        router.push('/garages')
      }
    } catch (error) {
      console.error('Error fetching garage:', error)
      router.push('/garages')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (garageData: any) => {
    setSaving(true)
    
    try {
      const response = await fetch(`/api/garages/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: garageData.name,
          address: garageData.address,
          lat: garageData.lat,
          lng: garageData.lng,
          timezone: garageData.timezone,
          isDefault: garageData.is_default
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGarage(data.garage)
        setShowEditForm(false)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating garage:', error)
      alert('Failed to update garage')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!garage) return

    const vehicleCount = garage.vehicles?.length || 0
    if (vehicleCount > 0) {
      alert(`Cannot delete garage with ${vehicleCount} vehicles. Please move vehicles to another garage first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${garage.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/garages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/garages')
      } else {
        const error = await response.json()
        alert(`Failed to delete garage: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting garage:', error)
      alert('Failed to delete garage')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!garage) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-16">
            <h1 className="text-xl font-medium text-gray-900 mb-2">Garage not found</h1>
            <Button onClick={() => router.push('/garages')}>
              Back to Garages
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (showEditForm) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <button 
              onClick={() => setShowEditForm(false)}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Garage Details</span>
            </button>
          </div>

          <GarageForm
            garage={garage}
            onSave={handleSave}
            onCancel={() => setShowEditForm(false)}
            loading={saving}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/garages')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Garages</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{garage.name}</h1>
              <p className="text-gray-600 mt-1">{garage.address}</p>
              
              {/* Jurisdiction Information */}
              {jurisdiction.summaryText && (
                <div className="mt-2 text-sm text-gray-600">
                  📍 {jurisdiction.summaryText}
                </div>
              )}
              
              {/* Weather Alert */}
              {weather.hasAlerts() && weather.getActiveAlert() && (
                <div className={`mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm ${weather.getSeverityColor(weather.getActiveAlert()!.severity)}`}>
                  <span>{weather.getAlertIcon(weather.getActiveAlert()!.kind)}</span>
                  <span className="font-medium">{weather.getActiveAlert()!.dateRange}:</span>
                  <span>{weather.getActiveAlert()!.message}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEditForm(true)}
              >
                Edit Garage
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={garage.vehicles && garage.vehicles.length > 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Garage Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Garage Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{garage.name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{garage.address}</p>
                </div>

                {garage.timezone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timezone</label>
                    <p className="text-gray-900">{garage.timezone}</p>
                  </div>
                )}

                {(garage.lat && garage.lng) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Coordinates</label>
                    <p className="text-gray-900 font-mono text-sm">
                      {garage.lat.toFixed(6)}, {garage.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {garage.is_default && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium">
                      ⭐ Default garage for new vehicles
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Garage Features and Vehicles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicles at this Garage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicles at this Garage ({vehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vehicles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No vehicles at this garage yet</p>
                    <p className="text-sm mt-1">Vehicles can be moved here from the vehicles page or vehicle details</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {vehicle.hero_image_url ? (
                            <img
                              src={vehicle.hero_image_url}
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          </h4>
                          {vehicle.display_name && (
                            <p className="text-sm text-gray-600">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Added {new Date(vehicle.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/vehicles/${vehicle.id}/dashboard`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Garage Features */}
            <GarageFeatures garage={garage as any} vehicles={vehicles} />
          </div>
        </div>
      </div>
    </div>
  )
}
