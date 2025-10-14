// Admin page for managing archived vehicles (for testing adaptive layouts)
// Access via: http://localhost:3005/admin/vehicles

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  RotateCcw,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  label?: string
  deleted_at: string | null
  created_at: string
}

export default function AdminVehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showArchived, setShowArchived] = useState(true)
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetchAllVehicles()
  }, [])

  const fetchAllVehicles = async () => {
    try {
      // We'll need to create a special admin endpoint that shows all vehicles
      const response = await fetch('/api/admin/vehicles')
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      
      const data = await response.json()
      setVehicles(data.vehicles || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      // Fallback: fetch active vehicles and show message
      const activeResponse = await fetch('/api/vehicles')
      if (activeResponse.ok) {
        const activeData = await activeResponse.json()
        setVehicles(activeData.vehicles?.map((v: any) => ({ ...v, deleted_at: null })) || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreVehicle = async (vehicleId: string) => {
    setRestoring(vehicleId)
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to restore vehicle')
      }

      console.log('✅ Vehicle restored successfully')
      // Refresh the list
      await fetchAllVehicles()
    } catch (error) {
      console.error('Error restoring vehicle:', error)
      alert('Failed to restore vehicle. Please try again.')
    } finally {
      setRestoring(null)
    }
  }

  const activeVehicles = vehicles.filter(v => !v.deleted_at)
  const archivedVehicles = vehicles.filter(v => v.deleted_at)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/vehicles')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Vehicle Management
            </h1>
            <p className="text-slate-600 mt-1">
              Admin panel for testing adaptive layouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button onClick={() => router.push('/vehicles')}>
            View Garage
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{activeVehicles.length}</div>
            <p className="text-slate-600">Active Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-orange-600">{archivedVehicles.length}</div>
            <p className="text-slate-600">Archived Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
            <p className="text-slate-600">Total Vehicles</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Vehicles */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Active Vehicles ({activeVehicles.length})
        </h2>
        {activeVehicles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">No active vehicles</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeVehicles.map(vehicle => (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">
                        {vehicle.display_name || vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    Added {new Date(vehicle.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Archived Vehicles */}
      {showArchived && (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Archived Vehicles ({archivedVehicles.length})
          </h2>
          {archivedVehicles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No archived vehicles</p>
                <p className="text-sm text-slate-500 mt-2">
                  Archive vehicles from their detail pages to test adaptive layouts
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedVehicles.map(vehicle => (
                <Card key={vehicle.id} className="hover:shadow-md transition-shadow border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-slate-700">
                          {vehicle.display_name || vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Archived
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Archived {vehicle.deleted_at ? new Date(vehicle.deleted_at).toLocaleDateString() : 'Unknown'}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreVehicle(vehicle.id)}
                      disabled={restoring === vehicle.id}
                      className="w-full"
                    >
                      {restoring === vehicle.id ? (
                        'Restoring...'
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restore
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Testing Instructions */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Adaptive Layouts</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>Hero Mode (1 vehicle):</strong> Archive vehicles until only 1 remains</p>
            <p>• <strong>Comfortable Mode (2-6 vehicles):</strong> Keep 2-6 active vehicles</p>
            <p>• <strong>Compact Mode (7+ vehicles):</strong> Restore vehicles to have 7 or more</p>
            <p>• Use the "View Garage" button to see how the layout adapts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
