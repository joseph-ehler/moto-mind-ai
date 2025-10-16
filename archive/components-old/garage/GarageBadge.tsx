import React from 'react'
import { MapPin } from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
}

interface GarageBadgeProps {
  garage: Garage | null
  variant?: 'default' | 'compact' | 'inline'
  showIcon?: boolean
  className?: string
}

export function GarageBadge({ 
  garage, 
  variant = 'default', 
  showIcon = true, 
  className = '' 
}: GarageBadgeProps) {
  if (!garage) {
    return (
      <span className={`text-gray-400 text-sm ${className}`}>
        No garage assigned
      </span>
    )
  }

  // Extract city and state from address (simple parsing)
  const getLocationFromAddress = (address: string) => {
    const parts = address.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      const city = parts[parts.length - 2]
      const stateCountry = parts[parts.length - 1]
      return `${city}, ${stateCountry.split(' ')[0]}` // Get state code before zip
    }
    return address
  }

  const location = getLocationFromAddress(garage.address)

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 text-xs text-gray-600 ${className}`}>
        {showIcon && <MapPin className="h-3 w-3" />}
        <span>{location}</span>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 text-sm text-gray-700 ${className}`}>
        {showIcon && <MapPin className="h-4 w-4 text-gray-400" />}
        <span className="font-medium">{garage.name}</span>
        <span className="text-gray-500">•</span>
        <span className="text-gray-600">{location}</span>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md text-sm ${className}`}>
      {showIcon && <MapPin className="h-4 w-4 text-gray-500" />}
      <div>
        <div className="font-medium text-gray-900">{garage.name}</div>
        <div className="text-gray-600 text-xs">{location}</div>
      </div>
    </div>
  )
}
