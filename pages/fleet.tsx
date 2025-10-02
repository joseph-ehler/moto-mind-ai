import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { GarageBadge } from '@/components/garage/GarageBadge'
import { GarageFilterPills } from '@/components/garage/GarageFilterPills'
import { AppNavigation } from '@/components/layout/AppNavigation'
import { VehicleContextMenu } from '@/components/vehicle/VehicleContextMenu'
import { garageEvents, notifyVehicleMoved } from '@/utils/garageSync'
import { 
  Car, 
  Plus, 
  Calendar,
  Hash,
  Image as ImageIcon,
  Eye,
  Settings,
  FileText
} from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  nickname?: string
  vin?: string
  hero_image_url?: string
  enrichment?: any
  garage_id?: string
  created_at: string
  updated_at: string
  garage?: Garage
}

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  vehicleCount?: number
}

interface VehicleWithImage extends Vehicle {
  primaryImage?: any
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<VehicleWithImage[]>([])
  const [garages, setGarages] = useState<Garage[]>([])
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚗 Fetching vehicles and garages from fleet page...')
        
        // Fetch vehicles and garages in parallel
        const [vehiclesResponse, garagesResponse] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/garages')
        ])
        
        const vehiclesData = await vehiclesResponse.json()
        const garagesData = await garagesResponse.json()
        
        const vehiclesList = vehiclesData.data?.vehicles || vehiclesData.vehicles || []
        const garagesList = garagesData.garages || []
        
        console.log('🚗 Found vehicles:', vehiclesList.length)
        console.log('🏠 Found garages:', garagesList.length)

        // Create garage lookup map
        const garageMap = new Map(garagesList.map((garage: Garage) => [garage.id, garage]))

        // Fetch images for each vehicle and attach garage info
        const vehiclesWithImagesAndGarages = await Promise.all(
          vehiclesList.map(async (vehicle: Vehicle) => {
            try {
              console.log(`🖼️ Fetching images for vehicle ${vehicle.id}`)
              const imgResponse = await fetch(`/api/vehicles/${vehicle.id}/images`)
              let primaryImage = null
              if (imgResponse.ok) {
                const imgData = await imgResponse.json()
                const images = imgData.images || []
                primaryImage = images.find((img: any) => img.is_primary) || images[0]
              }
              
              // Attach garage info
              const garage = vehicle.garage_id ? garageMap.get(vehicle.garage_id) : null
              
              return { ...vehicle, primaryImage, garage }
            } catch (imgError) {
              console.warn(`Failed to fetch images for vehicle ${vehicle.id}:`, imgError)
              const garage = vehicle.garage_id ? garageMap.get(vehicle.garage_id) : null
              return { ...vehicle, garage }
            }
          })
        )

        // Calculate vehicle counts for garages
        const garagesWithCounts = garagesList.map((garage: Garage) => ({
          ...garage,
          vehicleCount: vehiclesWithImagesAndGarages.filter(v => v.garage_id === garage.id).length
        }))

        setVehicles(vehiclesWithImagesAndGarages)
        setGarages(garagesWithCounts)
        console.log('🎉 Vehicles with images and garages loaded:', vehiclesWithImagesAndGarages)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter vehicles based on selected garage
  const filteredVehicles = selectedGarageId 
    ? vehicles.filter(vehicle => vehicle.garage_id === selectedGarageId)
    : vehicles

  // Vehicle action handlers
  const handleEditVehicle = (vehicleId: string) => {
    window.location.href = `/vehicles/${vehicleId}/dashboard`
  }

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh the vehicle list
        setVehicles(prev => prev.filter(v => v.id !== vehicleId))
      } else {
        const error = await response.json()
        alert(`Failed to delete vehicle: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Failed to delete vehicle')
    }
  }

  const handleMoveVehicle = (vehicleId: string) => {
    // Navigate to vehicle dashboard where they can use the move dialog
    window.location.href = `/vehicles/${vehicleId}/dashboard`
  }

  const handleDuplicateVehicle = (vehicle: VehicleWithImage) => {
    const params = new URLSearchParams({
      duplicate: 'true',
      year: vehicle.year.toString(),
      make: vehicle.make,
      model: vehicle.model,
      ...(vehicle.trim && { trim: vehicle.trim }),
      ...(vehicle.garage_id && { garage_id: vehicle.garage_id })
    })
    
    window.location.href = `/onboard?${params.toString()}`
  }

  const handleViewPhotos = (vehicleId: string) => {
    window.location.href = `/vehicles/${vehicleId}/photos`
  }

  const handleQuickMove = async (vehicleId: string, garageId: string) => {
    // Find the current garage for notification
    const vehicle = vehicles.find(v => v.id === vehicleId)
    const fromGarageId = vehicle?.garage_id

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ garageId }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update the vehicle in the list
        setVehicles(prev => prev.map(v => 
          v.id === vehicleId 
            ? { ...v, garage_id: garageId, garage: data.vehicle.garage }
            : v
        ))
        
        // Recalculate garage counts based on updated vehicles
        const updatedVehicles = vehicles.map(v => 
          v.id === vehicleId 
            ? { ...v, garage_id: garageId, garage: data.vehicle.garage }
            : v
        )
        
        setGarages(prev => prev.map(garage => ({
          ...garage,
          vehicleCount: updatedVehicles.filter(v => v.garage_id === garage.id).length
        })))

        // Notify other components about the move
        notifyVehicleMoved(vehicleId, fromGarageId, garageId)
        
        console.log(`✅ Vehicle moved successfully: ${data.message}`)
      } else {
        const error = await response.json()
        alert(`Failed to move vehicle: ${error.error}`)
      }
    } catch (error) {
      console.error('Error moving vehicle:', error)
      alert('Failed to move vehicle')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation />
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Garage Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {vehicles.length === 0 ? 'Your Fleet' : 
                 vehicles.length === 1 ? 'Your Vehicle' : 
                 `Your Fleet`}
              </h1>
              <p className="text-gray-600 mt-1">
                {vehicles.length === 0 
                  ? 'Add your first vehicle to get started'
                  : `${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''}`
                }
                {selectedGarageId && ` at ${garages.find(g => g.id === selectedGarageId)?.name}`}
              </p>
            </div>
            <a 
              href="/onboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </a>
          </div>

          {/* Garage Filter Pills */}
          <GarageFilterPills
            garages={garages}
            selectedGarageId={selectedGarageId}
            onGarageSelect={setSelectedGarageId}
          />
        </div>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles yet</h3>
            <p className="text-gray-600 mb-6">
              Add your first vehicle to start tracking maintenance and recalls.
            </p>
            <a 
              href="/onboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Vehicle
            </a>
          </div>
        ) : (
          <div className={`grid gap-6 ${getGridClass(filteredVehicles.length)}`}>
            {filteredVehicles.map((vehicle, index) => (
              <a 
                key={vehicle.id} 
                href={`/vehicles/${vehicle.id}`}
                className="group block"
              >
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Vehicle Image */}
                  <div className="aspect-video bg-gray-100 relative">
                    {vehicle.hero_image_url || vehicle.primaryImage?.public_url ? (
                      <img
                        src={vehicle.hero_image_url || vehicle.primaryImage.public_url}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                        loading={index < 4 ? "eager" : "lazy"}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </h3>
                      {!selectedGarageId && (
                        <GarageBadge garage={vehicle.garage || null} variant="compact" />
                      )}
                    </div>
                    {vehicle.nickname && (
                      <p className="text-gray-600 text-sm mb-3">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        {vehicle.trim && ` ${vehicle.trim}`}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>54,120 mi</span>
                      <div className="flex items-center gap-3">
                        <VehicleContextMenu
                          vehicle={vehicle}
                          onEdit={() => handleEditVehicle(vehicle.id)}
                          onDelete={() => handleDeleteVehicle(vehicle.id)}
                          onMove={() => handleMoveVehicle(vehicle.id)}
                          onQuickMove={(garageId) => handleQuickMove(vehicle.id, garageId)}
                          onDuplicate={() => handleDuplicateVehicle(vehicle)}
                          onViewPhotos={() => handleViewPhotos(vehicle.id)}
                          className="z-10"
                        />
                        <span className="text-blue-600 font-medium">View Details</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
