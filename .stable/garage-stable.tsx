import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Car, 
  Plus, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Settings
} from 'lucide-react'
import { VehicleRow } from '@/components/vehicle/VehicleRow'

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

export default function GaragePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNeedsAttention, setShowNeedsAttention] = useState(false)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')

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

        setVehicles(vehiclesList)
        console.log('🎉 Vehicles with images loaded:', vehiclesList)
      } catch (error) {
        console.error('Error fetching vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter vehicles based on search and attention filter
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchQuery || 
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // For now, show all vehicles (attention filtering can be added later)
    const matchesAttention = !showNeedsAttention
    
    return matchesSearch && matchesAttention
  })

  const count = filteredVehicles.length
  
  // Dynamic title based on count
  const getTitle = () => {
    if (count === 0) return 'Your Garage'
    if (count === 1) return 'Your Vehicle'
    if (count > 6) return `Garage (${count})`
    return 'Your Garage'
  }

  const getSubtitle = () => {
    if (count === 0) return 'Add your first vehicle to get recalls, EPA, and maintenance insights.'
    if (count === 1) return 'Everything you need to keep it running perfectly.'
    return 'Quickly scan specs, status, and what needs attention.'
  }

  // Mock summary for attention items (can be computed from actual vehicle data later)
  const needsAttentionCount = Math.floor(count * 0.3) // Mock: 30% need attention
  const overdueCount = Math.floor(needsAttentionCount * 0.4) // Mock: 40% of those are overdue
  const dueSoonCount = needsAttentionCount - overdueCount

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 bg-muted rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{getTitle()}</h1>
        <p className="text-sm text-muted-foreground mt-1">{getSubtitle()}</p>
      </header>

      {/* Summary Bar (if vehicles need attention) */}
      {count > 0 && needsAttentionCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">
                  {needsAttentionCount} vehicle{needsAttentionCount !== 1 ? 's' : ''} need attention: 
                  {overdueCount > 0 && <span className="ml-1">{overdueCount} overdue</span>}
                  {overdueCount > 0 && dueSoonCount > 0 && <span>, </span>}
                  {dueSoonCount > 0 && <span className={overdueCount > 0 ? '' : 'ml-1'}>{dueSoonCount} due soon</span>}
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowNeedsAttention(!showNeedsAttention)}
                >
                  {showNeedsAttention ? 'Show All' : 'View Only These'}
                </Button>
                <Button size="sm">Fix All</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search VIN, name, or model…" 
              className="pl-8 w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> 
            Filters
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <Link href="/onboard">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        </Link>
      </div>

      {/* Vehicle List */}
      {filteredVehicles.length === 0 ? (
        <EmptyState hasVehicles={count > 0} />
      ) : (
        <div className="space-y-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleRow 
              key={vehicle.id} 
              vehicle={vehicle} 
              density={density}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasVehicles }: { hasVehicles: boolean }) {
  if (hasVehicles) {
    // No vehicles match current filters
    return (
      <Card className="border-dashed">
        <CardContent className="text-center p-12">
          <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="text-lg font-medium">No vehicles found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search or filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No vehicles at all
  return (
    <Card className="border-dashed">
      <CardContent className="text-center p-12">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Car className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-medium">Your Garage is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add a vehicle to unlock recalls, EPA data, and maintenance reminders.
        </p>
        <Link href="/onboard">
          <Button className="mt-4">Add Vehicle</Button>
        </Link>
      </CardContent>
    </Card>
  )
}
