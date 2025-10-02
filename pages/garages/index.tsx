import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AppNavigation } from '@/components/layout/AppNavigation'
import { garageEvents, refreshGarageData } from '@/utils/garageSync'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Car,
  Star,
  Settings
} from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  vehicleCount?: number
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
}

export default function GaragesPage() {
  const router = useRouter()
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(true)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  useEffect(() => {
    fetchGarages()

    // Listen for vehicle move events to refresh garage data
    const unsubscribe = garageEvents.subscribe(async (event) => {
      if (event.type === 'vehicle_moved') {
        console.log('🔄 Vehicle moved, refreshing garage data...')
        const updatedGarages = await refreshGarageData()
        if (updatedGarages.length > 0) {
          setGarages(updatedGarages)
        }
      }
    })

    return unsubscribe
  }, [])

  const fetchGarages = async () => {
    try {
      // Fetch garages and vehicles in parallel
      const [garagesResponse, vehiclesResponse] = await Promise.all([
        fetch('/api/garages'),
        fetch('/api/vehicles')
      ])

      const garagesData = await garagesResponse.json()
      const vehiclesData = await vehiclesResponse.json()
      
      const garagesList = garagesData.garages || []
      const vehiclesList = vehiclesData.data?.vehicles || vehiclesData.vehicles || []

      // Calculate vehicle counts for each garage
      const garagesWithCounts = garagesList.map((garage: Garage) => ({
        ...garage,
        vehicleCount: vehiclesList.filter((v: Vehicle) => v.garage_id === garage.id).length
      }))

      setGarages(garagesWithCounts)
      console.log('🏠 Loaded garages with vehicle counts:', garagesWithCounts)
    } catch (error) {
      console.error('Error fetching garages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (garageId: string) => {
    setSettingDefault(garageId)
    
    try {
      const response = await fetch(`/api/garages/${garageId}/set-default`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const data = await response.json()
        // Update the garages list to reflect the new default
        setGarages(prev => prev.map(garage => ({
          ...garage,
          is_default: garage.id === garageId
        })))
        
        // Show success message
        console.log(data.message)
      } else {
        const error = await response.json()
        alert(`Failed to set default garage: ${error.error}`)
      }
    } catch (error) {
      console.error('Error setting default garage:', error)
      alert('Failed to set default garage')
    } finally {
      setSettingDefault(null)
    }
  }

  const handleDeleteGarage = async (garage: Garage) => {
    if (garage.vehicleCount && garage.vehicleCount > 0) {
      alert(`Cannot delete garage with ${garage.vehicleCount} vehicles. Please move vehicles to another garage first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${garage.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/garages/${garage.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchGarages() // Refresh the list
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
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Garage Locations</h1>
            <p className="text-gray-600 mt-1">
              Manage where your vehicles are located
            </p>
          </div>
          <Button 
            onClick={() => router.push('/garages/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Garage
          </Button>
        </div>

        {/* Garages Grid */}
        {garages.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No garages yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first garage location to organize your vehicles.
            </p>
            <Button 
              onClick={() => router.push('/garages/new')}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Garage
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {garages.map((garage) => (
              <Card 
                key={garage.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/garages/${garage.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        {garage.name}
                        {garage.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {garage.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/garages/${garage.id}`)
                        }}
                        title="Edit garage"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGarage(garage)
                        }}
                        title="Delete garage"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="h-4 w-4" />
                      <span>
                        {garage.vehicleCount || 0} vehicle{garage.vehicleCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {garage.timezone && (
                      <span className="text-xs text-gray-500">
                        {garage.timezone}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!garage.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(garage.id)}
                        disabled={settingDefault === garage.id}
                        className="flex-1"
                      >
                        {settingDefault === garage.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                            Setting...
                          </>
                        ) : (
                          'Set as Default'
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/garages/${garage.id}`)
                      }}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
