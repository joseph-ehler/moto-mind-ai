import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
}

interface VehicleWithImage extends Vehicle {
  primaryImage?: any
}

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<VehicleWithImage[]>([])
  const [loading, setLoading] = useState(true)

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚗 Fetching vehicles from garage page...')
        const response = await fetch('/api/vehicles')
        const data = await response.json()
        console.log('🔍 Full API response:', data)
        // Our new API structure returns data in data.data.vehicles
        const vehiclesList = data.data?.vehicles || data.vehicles || []
        console.log('🚗 Found vehicles:', vehiclesList.length)

        // Fetch images for each vehicle
        const vehiclesWithImages = await Promise.all(
          vehiclesList.map(async (vehicle: Vehicle) => {
            try {
              console.log(`🖼️ Fetching images for vehicle ${vehicle.id}`)
              const imgResponse = await fetch(`/api/vehicles/${vehicle.id}/images`)
              if (imgResponse.ok) {
                const imgData = await imgResponse.json()
                const images = imgData.images || []
                const primaryImage = images.find((img: any) => img.is_primary) || images[0]
                return { ...vehicle, primaryImage }
              }
            } catch (imgError) {
              console.warn(`Failed to fetch images for vehicle ${vehicle.id}:`, imgError)
            }
            return vehicle
          })
        )

        setVehicles(vehiclesWithImages)
        console.log('🎉 Vehicles with images loaded:', vehiclesWithImages)
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {vehicles.length === 0 ? 'Your Garage' : 
             vehicles.length === 1 ? 'Your Vehicle' : 
             `Your Garage (${vehicles.length})`}
          </h1>
          <p className="text-muted-foreground mt-1">
            {vehicles.length === 0 
              ? 'Add your first vehicle to get started'
              : `Manage and track your ${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <Button asChild>
          <a href="/onboard" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </a>
        </Button>
      </div>

      {/* Vehicle Grid */}
      {vehicles.length === 0 ? (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Car className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No vehicles yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Add your first vehicle to start tracking maintenance, recalls, and get AI-powered insights.
            </p>
            <Button asChild>
              <a href="/onboard" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Vehicle
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${getGridClass(vehicles.length)}`}>
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Vehicle Image */}
              <div className="aspect-video bg-muted relative overflow-hidden">
                {vehicle.hero_image_url || vehicle.primaryImage?.public_url ? (
                  <img
                    src={vehicle.hero_image_url || vehicle.primaryImage.public_url}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    {vehicle.year}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Vehicle Title */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold leading-tight">
                    {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  </h3>
                  {vehicle.nickname && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                      {vehicle.trim && ` ${vehicle.trim}`}
                    </p>
                  )}
                </div>

                {/* Vehicle Specs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {vehicle.enrichment?.body_class && (
                    <Badge variant="outline" className="text-xs">
                      {vehicle.enrichment.body_class.split(' ')[0]}
                    </Badge>
                  )}
                  {vehicle.enrichment?.engine?.fuel_type && (
                    <Badge variant="outline" className="text-xs">
                      {vehicle.enrichment.engine.fuel_type}
                    </Badge>
                  )}
                  {vehicle.enrichment?.drivetrain && (
                    <Badge variant="outline" className="text-xs">
                      {vehicle.enrichment.drivetrain}
                    </Badge>
                  )}
                </div>

                {/* VIN */}
                {vehicle.vin && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Hash className="h-3 w-3" />
                    <span className="font-mono">{vehicle.vin}</span>
                  </div>
                )}

                <Separator className="mb-4" />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="default" size="sm" asChild className="flex-1">
                    <a href={`/vehicles/${vehicle.id}`} className="flex items-center justify-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Details
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/vehicles/${vehicle.id}/photos`}>
                      <ImageIcon className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
