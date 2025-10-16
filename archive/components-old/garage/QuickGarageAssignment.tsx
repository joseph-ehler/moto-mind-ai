import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Check, Loader2 } from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  vehicleCount?: number
}

interface Vehicle {
  id: string
  garage_id?: string
}

interface QuickGarageAssignmentProps {
  vehicle: Vehicle
  onAssign: (garageId: string) => Promise<void>
  onCancel: () => void
  className?: string
}

export function QuickGarageAssignment({ 
  vehicle, 
  onAssign, 
  onCancel, 
  className = "" 
}: QuickGarageAssignmentProps) {
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    fetchGarages()
  }, [])

  const fetchGarages = async () => {
    try {
      const response = await fetch('/api/garages')
      const data = await response.json()
      setGarages(data.garages || [])
    } catch (error) {
      console.error('Failed to load garages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (garageId: string) => {
    setAssigning(garageId)
    
    try {
      await onAssign(garageId)
    } catch (error) {
      console.error('Failed to assign garage:', error)
    } finally {
      setAssigning(null)
    }
  }

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-600">Loading garages...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-3">
        <h3 className="font-medium text-gray-900 text-sm">Move to Garage</h3>
        <p className="text-xs text-gray-600">Select a new location for this vehicle</p>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {garages.map((garage) => (
          <button
            key={garage.id}
            onClick={() => handleAssign(garage.id)}
            disabled={assigning !== null || garage.id === vehicle.garage_id}
            className={`w-full p-3 text-left border rounded-lg transition-colors text-sm ${
              garage.id === vehicle.garage_id
                ? 'border-green-200 bg-green-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            } ${assigning === garage.id ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{garage.name}</span>
                  {garage.id === vehicle.garage_id && (
                    <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                  {assigning === garage.id && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{garage.address}</p>
              </div>
              {garage.vehicleCount !== undefined && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {garage.vehicleCount} vehicles
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="border-t pt-3 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={assigning !== null}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
