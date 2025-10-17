import React from 'react'

interface Garage {
  id: string
  name: string
  address: string
  vehicleCount?: number
}

interface GarageFilterPillsProps {
  garages: Garage[]
  selectedGarageId: string | null // null means "All"
  onGarageSelect: (garageId: string | null) => void
  className?: string
}

export function GarageFilterPills({ 
  garages, 
  selectedGarageId, 
  onGarageSelect, 
  className = '' 
}: GarageFilterPillsProps) {
  if (garages.length <= 1) {
    return null // Don't show filters if only one or no garages
  }

  const totalVehicles = garages.reduce((sum, garage) => sum + (garage.vehicleCount || 0), 0)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600 mr-2">Filter by location:</span>
      
      {/* All garages pill */}
      <button
        onClick={() => onGarageSelect(null)}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selectedGarageId === null
            ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
        }`}
      >
        All ({totalVehicles})
      </button>

      {/* Individual garage pills */}
      {garages.map((garage) => (
        <button
          key={garage.id}
          onClick={() => onGarageSelect(garage.id)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedGarageId === garage.id
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
        >
          {garage.name} ({garage.vehicleCount || 0})
        </button>
      ))}
    </div>
  )
}
