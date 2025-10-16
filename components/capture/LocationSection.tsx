/**
 * LocationSection Component
 * Shows location with map preview, confidence indicators, and warnings
 */

'use client'

import { useState } from 'react'
import { MapPreview } from '@/components/location/MapPreview'
import { Edit2, MapPinOff, AlertCircle, AlertTriangle, CheckCircle, Search } from 'lucide-react'
import { isValidCoordinates } from '@/lib/location-validation'
import type { LocationConfidence, LocationSource } from '@/lib/location-intelligence'
import { getBadgeVariant, getSourceLabel } from '@/lib/location-intelligence'
import { NearbyStationsModal } from './NearbyStationsModal'
import type { GasStation } from '@/lib/location-search'
import { 
  getAddressSourceLabel, 
  getAddressConfidenceBadge,
  type AddressSource,
  type AddressConfidence
} from '@/lib/vision/address-types'

interface LocationData {
  name: string
  address: string
  lat: number
  lng: number
  source?: 'exif' | 'gps' | 'manual'
}

interface LocationSectionProps {
  location: LocationData
  onEdit?: () => void
  showMap?: boolean
  confidence?: LocationConfidence
  warning?: string
  locationSource?: LocationSource
  alternateLocation?: LocationData
  stationName?: string // For nearby search
  onLocationSelect?: (station: GasStation) => void
  addressSource?: AddressSource // NEW: Track address extraction method
  addressConfidence?: AddressConfidence // NEW: Address confidence
  
  // Correction tracking
  sourceType?: 'fuel_receipt' | 'service_receipt' | 'manual_entry'
  sourceId?: string
  onCorrection?: (correctedLocation: { address: string; lat: number; lng: number }) => void
}

export function LocationSection({ 
  location, 
  onEdit,
  showMap = true,
  confidence = 'medium',
  warning,
  locationSource = 'gps',
  alternateLocation,
  stationName,
  onLocationSelect,
  addressSource,
  addressConfidence,
  sourceType,
  sourceId,
  onCorrection
}: LocationSectionProps) {
  
  const [showNearbySearch, setShowNearbySearch] = useState(false)
  
  // Submit correction when user selects different location
  const handleLocationCorrection = async (correctedStation: GasStation) => {
    // Track the correction in database
    if (sourceType) {
      try {
        await fetch('/api/location/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceType,
            sourceId,
            extracted: {
              address: location.address,
              latitude: location.lat,
              longitude: location.lng,
              method: addressSource || 'gps',
              confidence: addressConfidence || confidence
            },
            corrected: {
              address: correctedStation.address,
              latitude: correctedStation.latitude,
              longitude: correctedStation.longitude,
              method: 'nearby_search'
            }
          })
        })
        
        console.log('✅ Location correction tracked')
      } catch (error) {
        console.warn('⚠️ Failed to track location correction:', error)
        // Don't block the user flow
      }
    }
    
    // Call parent callback
    onCorrection?.({
      address: correctedStation.address,
      lat: correctedStation.latitude,
      lng: correctedStation.longitude
    })
    
    onLocationSelect?.(correctedStation)
  }
  
  // Check if we have valid location data
  const hasValidLocation = isValidCoordinates(location.lat, location.lng)
  
  // Get badge variant and label
  const badgeVariant = getBadgeVariant(confidence)
  const sourceLabel = getSourceLabel(locationSource, confidence)
  
  // Get address badge variant and label if address source provided
  const addressBadgeVariant = addressConfidence ? getAddressConfidenceBadge(addressConfidence) : undefined
  const addressLabel = addressSource ? getAddressSourceLabel(addressSource) : undefined
  
  // If no valid location, show fallback UI
  if (!hasValidLocation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MapPinOff className="w-4 h-4 text-gray-400" />
            Location
          </h3>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed border-gray-300">
          <MapPinOff className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-3">
            No location data available
          </p>
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              📍 Enter location manually
            </button>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          📍 Location
        </h3>
        
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>
      
      {/* Warning Banner */}
      {warning && (
        <div className={`mb-3 p-3 rounded-lg flex items-start gap-2 ${
          confidence === 'low' 
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          {confidence === 'low' ? (
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              confidence === 'low' ? 'text-yellow-900' : 'text-blue-900'
            }`}>
              {warning}
            </p>
          </div>
        </div>
      )}
      
      {/* Map Preview */}
      {showMap && (
        <div className="mb-3">
          <MapPreview
            lat={location.lat}
            lng={location.lng}
            marker={{
              position: [location.lat, location.lng],
              label: location.name
            }}
            height={180}
          />
        </div>
      )}
      
      {/* Location Info */}
      <div className="mb-3">
        <div className="text-lg font-semibold text-gray-900">
          {location.name}
        </div>
        
        {location.address && (
          <div className="text-sm text-gray-600 mt-1">
            {location.address}
          </div>
        )}
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {/* Location Source Badge */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
            badgeVariant === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : badgeVariant === 'warning'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : badgeVariant === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-gray-50 text-gray-700 border border-gray-200'
          }`}>
            {confidence === 'high' && <CheckCircle className="w-3 h-3" />}
            {confidence === 'low' && <AlertCircle className="w-3 h-3" />}
            {sourceLabel}
          </div>
          
          {/* Address Source Badge (NEW!) */}
          {addressLabel && addressBadgeVariant && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              addressBadgeVariant === 'success'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : addressBadgeVariant === 'info'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : addressBadgeVariant === 'warning'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              {addressLabel}
            </div>
          )}
        </div>
      </div>
      
      {/* Actions based on confidence */}
      {confidence === 'low' && (
        <div className="flex gap-2">
          {stationName && onLocationSelect && (
            <button
              onClick={() => setShowNearbySearch(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Find {stationName} locations
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Enter manually
          </button>
        </div>
      )}
      
      {/* Nearby Stations Modal */}
      {showNearbySearch && stationName && onLocationSelect && (
        <NearbyStationsModal
          stationName={stationName}
          searchLatitude={location.lat}
          searchLongitude={location.lng}
          onSelect={(station) => {
            handleLocationCorrection(station)
            setShowNearbySearch(false)
          }}
          onCancel={() => setShowNearbySearch(false)}
          onManualEntry={() => {
            setShowNearbySearch(false)
            onEdit?.()
          }}
        />
      )}
    </div>
  )
}
