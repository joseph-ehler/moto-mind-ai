import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Navigation, Plus, Building2, Loader2, X } from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  vehicle_count?: number
  last_used?: string
  created_at?: string
}

interface StreamlinedGarageSelectorProps {
  selectedGarage: Garage | null
  onGarageSelected: (garage: Garage) => void
  onCreateGarage: (garageData: { name: string; address: string; lat?: number; lng?: number; timezone?: string }) => Promise<Garage>
}

export function StreamlinedGarageSelector({ 
  selectedGarage, 
  onGarageSelected, 
  onCreateGarage 
}: StreamlinedGarageSelectorProps) {
  const [garages, setGarages] = useState<Garage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingGarage, setCreatingGarage] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [showAllGarages, setShowAllGarages] = useState(false)

  const [newGarageData, setNewGarageData] = useState({
    name: '',
    address: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    timezone: 'UTC'
  })

  useEffect(() => {
    loadGarages()
  }, [])

  const loadGarages = async () => {
    try {
      const response = await fetch('/api/garages')
      if (response.ok) {
        const data = await response.json()
        const garageList = data.garages || []
        setGarages(garageList)
        
        if (garageList.length === 0) {
          // No garages: auto-open modal for first garage creation
          setIsFirstTime(true)
          setShowCreateModal(true)
          setNewGarageData(prev => ({ 
            ...prev, 
            name: 'My Garage',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }))
          
          // Try to get GPS location automatically
          if (navigator.geolocation) {
            handleUseCurrentLocation()
          }
        } else if (garageList.length === 1 && !selectedGarage) {
          // Exactly one garage: auto-select with option to change
          const defaultGarage = garageList[0]
          onGarageSelected(defaultGarage)
          console.log(`✅ Auto-selected garage: ${defaultGarage.name}`)
        } else if (garageList.length > 1 && !selectedGarage) {
          // Multiple garages: auto-select default if exists
          const defaultGarage = garageList.find((g: any) => g.is_default)
          if (defaultGarage) {
            onGarageSelected(defaultGarage)
            console.log(`✅ Auto-selected default garage: ${defaultGarage.name}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load garages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setGettingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const { latitude, longitude } = position.coords
      
      // Try to reverse geocode
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        
        if (response.ok) {
          const data = await response.json()
          const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryCode}`
          
          setNewGarageData(prev => ({
            ...prev,
            address,
            lat: latitude,
            lng: longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }))
        }
      } catch (error) {
        console.warn('Failed to reverse geocode:', error)
        setNewGarageData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }))
      }
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Failed to get your location. Please enter the address manually.')
    } finally {
      setGettingLocation(false)
    }
  }

  const handleCreateGarage = async () => {
    if (!newGarageData.name.trim() || !newGarageData.address.trim()) {
      alert('Please enter both garage name and address.')
      return
    }

    setCreatingGarage(true)
    
    try {
      const garage = await onCreateGarage({
        name: newGarageData.name.trim(),
        address: newGarageData.address.trim(),
        lat: newGarageData.lat,
        lng: newGarageData.lng,
        timezone: newGarageData.timezone
      })
      
      setGarages(prev => [...prev, garage])
      onGarageSelected(garage)
      setShowCreateForm(false)
      setShowCreateModal(false)
      setIsFirstTime(false)
      
      // Reset form
      setNewGarageData({
        name: '',
        address: '',
        lat: undefined,
        lng: undefined,
        timezone: 'UTC'
      })
    } catch (error) {
      console.error('Failed to create garage:', error)
      alert('Failed to create garage. Please try again.')
    } finally {
      setCreatingGarage(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading garages...</span>
      </div>
    )
  }

  // Show create form for first-time users or when explicitly requested
  if (showCreateForm) {
    return (
      <div className="space-y-4">
        {isFirstTime && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-1">Welcome! Let's set up your first garage</h4>
            <p className="text-sm text-blue-700">
              This helps organize your vehicles and provides location-specific maintenance reminders.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="garageName">Garage Name</Label>
            <Input
              id="garageName"
              value={newGarageData.name}
              onChange={(e) => setNewGarageData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Garage, Home, Office, etc."
            />
          </div>

          <div>
            <Label htmlFor="garageAddress">Address</Label>
            <div className="flex gap-2">
              <Input
                id="garageAddress"
                value={newGarageData.address}
                onChange={(e) => setNewGarageData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, State"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={gettingLocation}
                title="Use current location"
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!isFirstTime && (
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creatingGarage}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleCreateGarage}
              disabled={creatingGarage || !newGarageData.name.trim() || !newGarageData.address.trim()}
              className="flex-1"
            >
              {creatingGarage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Garage
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Privacy:</strong> Location is only used for organizing vehicles and maintenance reminders. 
            GPS coordinates are optional.
          </p>
        </div>
      </div>
    )
  }

  // Show garage selection for users with existing garages
  const MAX_VISIBLE_GARAGES = 5
  
  // Sort garages: default first, then by last_used (most recent), then by name
  const sortedGarages = [...garages].sort((a, b) => {
    // Default garage always first
    if (a.is_default && !b.is_default) return -1
    if (!a.is_default && b.is_default) return 1
    
    // Then by last used (most recent first)
    if (a.last_used && b.last_used) {
      return new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
    }
    if (a.last_used && !b.last_used) return -1
    if (!a.last_used && b.last_used) return 1
    
    // Finally by name
    return a.name.localeCompare(b.name)
  })
  
  const visibleGarages = showAllGarages ? sortedGarages : sortedGarages.slice(0, MAX_VISIBLE_GARAGES)
  const hasMoreGarages = sortedGarages.length > MAX_VISIBLE_GARAGES

  return (
    <div className="space-y-4">
      {garages.length > 0 && (
        <div className="space-y-2">
          {visibleGarages.map((garage) => (
            <button
              key={garage.id}
              onClick={() => onGarageSelected(garage)}
              className={`w-full p-4 text-left border rounded-lg transition-colors ${
                selectedGarage?.id === garage.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{garage.name}</h4>
                    {garage.is_default && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                    {garage.vehicle_count !== undefined && garage.vehicle_count > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {garage.vehicle_count} vehicle{garage.vehicle_count !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{garage.address}</p>
                  {garage.lat && garage.lng && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {garage.lat.toFixed(4)}, {garage.lng.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Show More/Less Button */}
      {hasMoreGarages && (
        <Button
          variant="ghost"
          onClick={() => setShowAllGarages(!showAllGarages)}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          {showAllGarages ? (
            <>Show Less ({MAX_VISIBLE_GARAGES} most recent)</>
          ) : (
            <>Show All Garages ({sortedGarages.length})</>
          )}
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => setShowCreateModal(true)}
        className="w-full h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Garage
      </Button>

      {/* Create Garage Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">Add New Garage</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setIsFirstTime(false)
                  // Reset form data
                  setNewGarageData({
                    name: '',
                    address: '',
                    lat: undefined,
                    lng: undefined,
                    timezone: 'UTC'
                  })
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {isFirstTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-1">Welcome! Let's set up your first garage</h4>
                  <p className="text-sm text-blue-700">
                    This helps organize your vehicles and provides location-specific maintenance reminders.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="modal-garage-name" className="text-sm font-medium text-black mb-2 block">
                  Garage Name
                </Label>
                <Input
                  id="modal-garage-name"
                  value={newGarageData.name}
                  onChange={(e) => setNewGarageData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Garage, Home, Office, etc."
                  className="h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="modal-garage-address" className="text-sm font-medium text-black mb-2 block">
                  Address
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="modal-garage-address"
                    value={newGarageData.address}
                    onChange={(e) => setNewGarageData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    className="flex-1 h-12 px-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={gettingLocation}
                    className="h-12 px-4 border-gray-300 hover:bg-gray-50"
                    title="Use current location"
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {newGarageData.lat && newGarageData.lng && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Location: {newGarageData.lat.toFixed(4)}, {newGarageData.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Privacy:</strong> Location is only used for organizing vehicles and maintenance reminders. 
                  GPS coordinates are optional.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              {!isFirstTime && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setIsFirstTime(false)
                    // Reset form data
                    setNewGarageData({
                      name: '',
                      address: '',
                      lat: undefined,
                      lng: undefined,
                      timezone: 'UTC'
                    })
                  }}
                  disabled={creatingGarage}
                  className="flex-1 h-12 px-6 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleCreateGarage}
                disabled={creatingGarage || !newGarageData.name.trim() || !newGarageData.address.trim()}
                className={`h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 ${
                  isFirstTime ? 'w-full' : 'flex-1'
                }`}
              >
                {creatingGarage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Garage
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
