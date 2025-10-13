import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, X, ArrowRight } from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  vehicleCount?: number
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  garage_id?: string
}

interface MoveVehicleDialogProps {
  vehicle: Vehicle
  currentGarage?: Garage
  onMove: (newGarageId: string) => void
  onCancel: () => void
  loading?: boolean
}

export function MoveVehicleDialog({ 
  vehicle, 
  currentGarage, 
  onMove, 
  onCancel, 
  loading = false 
}: MoveVehicleDialogProps) {
  const [garages, setGarages] = useState<Garage[]>([])
  const [selectedGarageId, setSelectedGarageId] = useState<string>('')
  const [fetchingGarages, setFetchingGarages] = useState(true)

  useEffect(() => {
    fetchGarages()
  }, [])

  const fetchGarages = async () => {
    try {
      const response = await fetch('/api/vehicless')
      const data = await response.json()
      const allGarages = data.garages || []
      
      // Filter out the current garage
      const availableGarages = allGarages.filter((garage: Garage) => 
        garage.id !== vehicle.garage_id
      )
      
      setGarages(availableGarages)
    } catch (error) {
      console.error('Error fetching garages:', error)
    } finally {
      setFetchingGarages(false)
    }
  }

  const handleMove = () => {
    if (selectedGarageId) {
      onMove(selectedGarageId)
    }
  }

  const vehicleName = (vehicle as any).display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Move Vehicle
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-1">{vehicleName}</h3>
            {currentGarage && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Currently at {currentGarage.name}</span>
              </div>
            )}
          </div>

          {/* Garage Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Move to which garage?
            </label>
            
            {fetchingGarages ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : garages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No other garages available</p>
                <p className="text-sm">Create another garage first</p>
              </div>
            ) : (
              <div className="space-y-2">
                {garages.map((garage) => (
                  <button
                    key={garage.id}
                    onClick={() => setSelectedGarageId(garage.id)}
                    className={`w-full p-4 text-left border rounded-lg transition-colors ${
                      selectedGarageId === garage.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{garage.name}</h4>
                        <p className="text-sm text-gray-600">{garage.address}</p>
                      </div>
                      {garage.vehicleCount !== undefined && (
                        <span className="text-xs text-gray-500">
                          {garage.vehicleCount} vehicles
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={loading || !selectedGarageId || garages.length === 0}
              className="flex-1"
            >
              {loading ? 'Moving...' : 'Move Vehicle'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
