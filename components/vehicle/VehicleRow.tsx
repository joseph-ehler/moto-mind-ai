import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Car, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin?: string | null // VIN should be required but making optional for compatibility
  trim?: string | null
  nickname?: string | null
  license_plate?: string | null
  display_name?: string | null
  hero_image_url?: string
  currentMileage?: number | null
  manufacturer_mpg?: number | null
  manufacturer_service_interval_miles?: number | null
}

interface VehicleRowProps {
  vehicle: Vehicle
  onAction?: (vehicleId: string, action: string) => void
  onEdit?: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
  showGarage?: boolean
  density?: 'comfortable' | 'compact'
}

export function VehicleRow({ vehicle, onAction, onEdit, onDelete, showGarage, density = 'comfortable' }: VehicleRowProps) {
  const isCompact = density === 'compact'
  
  // Create display name logic - handle null values properly
  const displayName = vehicle.nickname || vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const baseVehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const hasCustomName = vehicle.nickname && vehicle.nickname.trim() !== ''
  
  // Collect available details - handle null values safely
  const details = []
  if (vehicle.vin && vehicle.vin.trim()) details.push(`VIN: ${vehicle.vin}`)
  if (vehicle.license_plate && vehicle.license_plate.trim()) details.push(`Plate: ${vehicle.license_plate}`)
  if (vehicle.currentMileage) details.push(`${vehicle.currentMileage.toLocaleString()} miles`)
  if (vehicle.manufacturer_mpg) details.push(`${vehicle.manufacturer_mpg} MPG`)
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${isCompact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-4">
        {/* Vehicle Icon */}
        <div className={`flex-shrink-0 ${isCompact ? 'w-12 h-12' : 'w-14 h-14'} bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center`}>
          {vehicle.hero_image_url ? (
            <img 
              src={vehicle.hero_image_url} 
              alt={displayName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Car className={`${isCompact ? 'w-6 h-6' : 'w-7 h-7'} text-blue-600`} />
          )}
        </div>

        {/* Vehicle Info */}
        <div className="flex-1 min-w-0">
          {/* Primary Display Name */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-gray-900 truncate ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {displayName}
            </h3>
            {hasCustomName && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Custom
              </span>
            )}
          </div>
          
          {/* Vehicle Base Info - only show if different from display name */}
          {hasCustomName && (
            <div className={`text-gray-600 mb-1 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              <span className="font-medium">{baseVehicleName}</span>
              {vehicle.trim && (
                <span className="text-gray-500 ml-1">({vehicle.trim})</span>
              )}
            </div>
          )}

          {/* Additional Details */}
          {details.length > 0 && (
            <div className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                {details.map((detail, index) => (
                  <span key={index} className="font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/vehicles/${vehicle.id}`}>
            <Button variant="outline" size={isCompact ? "sm" : "default"} className="font-medium">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          </Link>
          
          {(onEdit || onDelete || onAction) && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={isCompact ? "sm" : "default"}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem 
                    onClick={() => onEdit(vehicle)}
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(vehicle)}
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
