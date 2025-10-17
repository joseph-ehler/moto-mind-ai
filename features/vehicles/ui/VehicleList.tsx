import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/router'
import { Confetti } from '@/components/ui/confetti'
import { useState } from 'react'

interface Vehicle {
  id: string
  display_name: string
  make: string
  model: string
  status: 'healthy' | 'warning' | 'flagged'
  lastSeen: Date
  dataQuality: number
  issues: string[]
  recentEvents?: any[] // For calculating real data quality
  vin?: string
  baseline_fuel_mpg?: number
}

interface VehicleListProps {
  vehicles: Vehicle[]
  selectedVehicle: string | null
  onSelectVehicle: (vehicleId: string) => void
}

export function VehicleList({ vehicles, selectedVehicle, onSelectVehicle }: VehicleListProps) {
  const router = useRouter()

  const handleAddData = (vehicleId: string, type: string) => {
    // Navigate to capture page with specific type
    const captureType = type.includes('odometer') ? 'odometer_photo' : 
                       type.includes('fuel') ? 'fuel_receipt' : 
                       'maintenance_doc'
    router.push(`/capture?vehicle=${vehicleId}&type=${captureType}`)
  }
  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-success-100 text-success-800'
      case 'warning':
        return 'bg-warning-100 text-warning-800'
      case 'flagged':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDataQualityColor = (quality: number) => {
    if (quality >= 80) return 'text-success-600'
    if (quality >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          onClick={() => onSelectVehicle(vehicle.id)}
          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
            selectedVehicle === vehicle.id
              ? 'border-primary-500 bg-primary-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">
                  {vehicle.display_name}
                </h3>
                <span className={`badge ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {vehicle.make} {vehicle.model}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  Last seen {formatDistanceToNow(vehicle.lastSeen, { addSuffix: true })}
                </span>
                {/* TODO: Re-implement DataQualityPill component */}
                <div className="text-xs text-gray-500">
                  Data Quality: {Math.round(vehicle.dataQuality)}%
                </div>
              </div>
            </div>
            
            {vehicle.issues.length > 0 && (
              <div className="ml-2">
                <div className="w-2 h-2 bg-error-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {vehicle.issues.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="space-y-1">
                {vehicle.issues.slice(0, 2).map((issue, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <div className="w-1 h-1 bg-error-400 rounded-full mr-2"></div>
                    {issue}
                  </div>
                ))}
                {vehicle.issues.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{vehicle.issues.length - 2} more issues
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="text-sm">No vehicles found</p>
          <p className="text-xs text-gray-400 mt-1">
            Connect your fleet to get started
          </p>
        </div>
      )}
    </div>
  )
}
