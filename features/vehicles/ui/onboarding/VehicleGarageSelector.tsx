import React, { useState, useEffect } from 'react'
import { MapPin, Plus, Navigation, Building2 } from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  timezone: string
}

interface GaragePickerProps {
  selectedGarageId?: string
  onGarageSelected: (garage: Garage | null) => void
  onCreateNew: (location: { lat: number; lng: number; address: string }) => void
  allowCurrentLocation?: boolean
}

export function GaragePicker({ 
  selectedGarageId, 
  onGarageSelected, 
  onCreateNew,
  allowCurrentLocation = true 
}: GaragePickerProps) {
  const [garages, setGarages] = useState<Garage[]>([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [showAddressSearch, setShowAddressSearch] = useState(false)
  const [searchAddress, setSearchAddress] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Load existing garages
  useEffect(() => {
    loadGarages()
  }, [])

  const loadGarages = async () => {
    try {
      const response = await fetch('/api/garages')
      if (response.ok) {
        const data = await response.json()
        setGarages(data.garages || [])
      }
    } catch (error) {
      console.error('Failed to load garages:', error)
    }
  }

  // Get current location
  const getCurrentLocation = async () => {
    if (!allowCurrentLocation) return
    
    setIsLoadingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      
      // Reverse geocode to get address
      const address = await reverseGeocode(latitude, longitude)
      
      setCurrentLocation({
        lat: latitude,
        lng: longitude,
        address
      })
      
    } catch (error) {
      console.error('Location access error:', error)
      alert('Unable to access location. Please select an existing garage or enter an address manually.')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a simple geocoding service - in production, use Google Maps or Mapbox
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
      
      if (response.ok) {
        const data = await response.json()
        return `${data.locality}, ${data.principalSubdivision}, ${data.countryCode}`
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  // Search for addresses
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    try {
      // Using a simple geocoding service - in production, use Google Places API
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address,poi&limit=5`
      )
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.features || [])
      }
    } catch (error) {
      console.error('Address search error:', error)
      setSearchResults([])
    }
  }

  // Handle address search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchAddress) {
        searchAddresses(searchAddress)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchAddress])

  const handleGarageSelect = (garage: Garage) => {
    onGarageSelected(garage)
  }

  const handleCreateFromCurrentLocation = () => {
    if (currentLocation) {
      onCreateNew(currentLocation)
    }
  }

  const handleCreateFromSearch = (result: any) => {
    const [lng, lat] = result.center
    onCreateNew({
      lat,
      lng,
      address: result.place_name
    })
    setShowAddressSearch(false)
    setSearchAddress('')
    setSearchResults([])
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Garage Location
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose where this vehicle is primarily located
        </p>
      </div>

      {/* Existing Garages */}
      {garages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Existing Garages</h4>
          {garages.map((garage) => (
            <button
              key={garage.id}
              onClick={() => handleGarageSelect(garage)}
              className={`w-full p-3 text-left border rounded-lg transition-colors ${
                selectedGarageId === garage.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Building2 size={20} className="text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{garage.name}</p>
                  <p className="text-sm text-gray-500 truncate">{garage.address}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Current Location Option */}
      {allowCurrentLocation && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Create New Garage</h4>
          
          {!currentLocation ? (
            <button
              onClick={getCurrentLocation}
              disabled={isLoadingLocation}
              className="w-full p-3 border border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <Navigation size={20} className="text-blue-600" />
                <span className="text-blue-600 font-medium">
                  {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={handleCreateFromCurrentLocation}
              className="w-full p-3 border border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin size={20} className="text-blue-600 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-blue-900">New Garage</p>
                  <p className="text-sm text-blue-700">{currentLocation.address}</p>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Manual Address Entry */}
      <div className="border-t pt-4">
        {!showAddressSearch ? (
          <button
            onClick={() => setShowAddressSearch(true)}
            className="w-full p-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="flex items-center justify-center space-x-2">
              <Plus size={20} className="text-gray-600" />
              <span className="text-gray-600 font-medium">Enter Address Manually</span>
            </div>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Enter garage address..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleCreateFromSearch(result)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin size={16} className="text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.text}
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.place_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowAddressSearch(false)
                  setSearchAddress('')
                  setSearchResults([])
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Permission Note */}
      {allowCurrentLocation && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Privacy:</strong> Location is only used to set your garage address. 
            You can skip location access and enter addresses manually.
          </p>
        </div>
      )}
    </div>
  )
}
