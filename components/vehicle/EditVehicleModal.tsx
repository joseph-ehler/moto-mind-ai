import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil, Building2, MapPin, Plus, Navigation, X } from 'lucide-react'
import { BlockFormModal, ModalSection } from '@/components/modals'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  vin?: string | null
  trim?: string | null
  nickname?: string | null
  license_plate?: string | null
  garage_id?: string | null
  display_name?: string | null
  manufacturer_mpg?: number | null
  manufacturer_service_interval_miles?: number | null
  garage?: {
    id: string
    name: string
    address: string
  }
}

interface EditVehicleModalProps {
  vehicle: Vehicle
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedVehicle: Vehicle) => void
}

export function EditVehicleModal({ vehicle, isOpen, onClose, onSuccess }: EditVehicleModalProps) {
  const [formData, setFormData] = useState({
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim || '',
    nickname: vehicle.nickname || '',
    license_plate: vehicle.license_plate || '',
    garage_id: vehicle.garage_id || '',
    vin: vehicle.vin || ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isDecodingVin, setIsDecodingVin] = useState(false)
  const [error, setError] = useState('')
  const [garages, setGarages] = useState<any[]>([])
  const [loadingGarages, setLoadingGarages] = useState(true)
  const [showCreateGarage, setShowCreateGarage] = useState(false)
  const [creatingGarage, setCreatingGarage] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [newGarageData, setNewGarageData] = useState({
    name: '',
    address: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    timezone: 'UTC'
  })

  const handleClose = () => {
    if (!isLoading) {
      setError('')
      onClose()
    }
  }

  // Reset form when vehicle changes
  useEffect(() => {
    setFormData({
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim || '',
      nickname: vehicle.nickname || '',
      license_plate: vehicle.license_plate || '',
      garage_id: vehicle.garage_id || '',
      vin: vehicle.vin || ''
    })
    setError('')
  }, [vehicle])

  // Load garages
  useEffect(() => {
    const loadGarages = async () => {
      try {
        const response = await fetch('/api/garages')
        if (response.ok) {
          const data = await response.json()
          setGarages(data.garages || [])
        }
      } catch (error) {
        console.error('Failed to load garages:', error)
      } finally {
        setLoadingGarages(false)
      }
    }

    if (isOpen) {
      loadGarages()
    }
  }, [isOpen])

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      })

      const { latitude, longitude } = position.coords
      
      try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address`)
        const data = await response.json()
        
        if (data.features && data.features.length > 0) {
          const address = data.features[0].place_name
          setNewGarageData(prev => ({
            ...prev,
            address,
            lat: latitude,
            lng: longitude
          }))
        }
      } catch (geocodeError) {
        console.error('Geocoding failed:', geocodeError)
        setNewGarageData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }))
      }
    } catch (error) {
      console.error('Location access failed:', error)
      setError('Could not access your location. Please enter address manually.')
    } finally {
      setGettingLocation(false)
    }
  }

  const handleCreateGarage = async () => {
    if (!newGarageData.name.trim()) {
      setError('Garage name is required')
      return
    }

    setCreatingGarage(true)
    try {
      const response = await fetch('/api/garages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGarageData.name.trim(),
          address: newGarageData.address.trim() || null,
          lat: newGarageData.lat || null,
          lng: newGarageData.lng || null,
          timezone: newGarageData.timezone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create garage')
      }

      const result = await response.json()
      const newGarage = result.garage

      setGarages(prev => [...prev, newGarage])
      handleInputChange('garage_id', newGarage.id)
      
      setNewGarageData({
        name: '',
        address: '',
        lat: undefined,
        lng: undefined,
        timezone: 'UTC'
      })
      setShowCreateGarage(false)
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create garage')
    } finally {
      setCreatingGarage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const updateData = {
        year: parseInt(formData.year.toString()),
        make: formData.make.trim(),
        model: formData.model.trim(),
        trim: formData.trim.trim() || null,
        nickname: formData.nickname.trim() || null,
        license_plate: formData.license_plate.trim() || null,
        garage_id: formData.garage_id.trim() || null,
        vin: formData.vin.trim()
      }
      
      const response = await fetch(`/api/vehicles/${vehicle.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update vehicle')
      }

      const result = await response.json()
      onSuccess(result.vehicle)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVinDecode = async (vin: string) => {
    if (vin.length !== 17) return
    
    setIsDecodingVin(true)
    try {
      const response = await fetch('/api/vehicles/decode-vin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin })
      })
      
      if (response.ok) {
        const decoded = await response.json()
        
        setFormData(prev => ({
          ...prev,
          year: decoded.year ? parseInt(decoded.year.toString()) : prev.year,
          make: decoded.make || prev.make,
          model: decoded.model || prev.model,
          trim: decoded.trim || prev.trim
        }))
      }
    } catch (error) {
      console.error('VIN decode error:', error)
    } finally {
      setIsDecodingVin(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (field === 'vin' && typeof value === 'string' && value.length === 17) {
      handleVinDecode(value)
    }
  }

  // Build sections for BlockFormModal
  const sections: ModalSection[] = [
    {
      id: 'vehicle-info',
      title: 'Vehicle Information',
      description: 'Basic vehicle details and identification',
      content: (
        <div className="space-y-6">
          {/* VIN Field */}
          <div>
            <Label htmlFor="vin" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              VIN (Vehicle Identification Number) *
              {isDecodingVin && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
            </Label>
            <Input
              id="vin"
              value={formData.vin}
              onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
              placeholder="17-character VIN (auto-decodes vehicle info)"
              maxLength={17}
              required
              className="mt-2 font-mono h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isDecodingVin}
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the 17-character VIN to automatically populate vehicle details
            </p>
          </div>

          {/* Basic Vehicle Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year" className="text-sm font-medium text-gray-700">Year *</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                required
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="make" className="text-sm font-medium text-gray-700">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                required
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'customization',
      title: 'Vehicle Customization',
      description: 'Personalize your vehicle settings',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="Family Car, Work Truck..."
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="trim" className="text-sm font-medium text-gray-700">Trim Level</Label>
              <Input
                id="trim"
                value={formData.trim}
                onChange={(e) => handleInputChange('trim', e.target.value)}
                placeholder="LE, Sport, Limited..."
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="license_plate" className="text-sm font-medium text-gray-700">License Plate</Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => handleInputChange('license_plate', e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'garage',
      title: 'Garage Assignment',
      description: 'Choose where this vehicle is located',
      content: loadingGarages ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading garages...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unassigned Option */}
          <label className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="radio"
              name="garage"
              value=""
              checked={formData.garage_id === ''}
              onChange={(e) => handleInputChange('garage_id', e.target.value)}
              className="mr-3"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Unassigned</div>
                <div className="text-sm text-gray-500">No specific garage location</div>
              </div>
            </div>
          </label>

          {/* Garage Options */}
          {garages.map((garage) => (
            <label key={garage.id} className="flex items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              <input
                type="radio"
                name="garage"
                value={garage.id}
                checked={formData.garage_id === garage.id}
                onChange={(e) => handleInputChange('garage_id', e.target.value)}
                className="mr-3"
              />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {garage.name}
                    {garage.is_default && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Default</span>
                    )}
                  </div>
                  {garage.address && (
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {garage.address}
                    </div>
                  )}
                </div>
              </div>
            </label>
          ))}

          {/* Add New Garage Button */}
          {!showCreateGarage && (
            <button
              type="button"
              onClick={() => setShowCreateGarage(true)}
              className="w-full flex items-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-blue-600">Add New Garage</div>
                  <div className="text-sm text-gray-500">Create a new garage location</div>
                </div>
              </div>
            </button>
          )}

          {/* Inline Garage Creation Form */}
          {showCreateGarage && (
            <div className="p-4 border border-blue-200 rounded-xl bg-blue-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-blue-900">Create New Garage</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateGarage(false)
                      setNewGarageData({
                        name: '',
                        address: '',
                        lat: undefined,
                        lng: undefined,
                        timezone: 'UTC'
                      })
                    }}
                    className="p-1 hover:bg-blue-200 rounded"
                  >
                    <X className="h-4 w-4 text-blue-600" />
                  </button>
                </div>

                <div>
                  <Label htmlFor="garageName" className="text-sm font-medium text-blue-900">Garage Name *</Label>
                  <Input
                    id="garageName"
                    value={newGarageData.name}
                    onChange={(e) => setNewGarageData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Garage, Home, Office, etc."
                    className="mt-1 bg-white border-blue-200 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="garageAddress" className="text-sm font-medium text-blue-900">Address</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="garageAddress"
                      value={newGarageData.address}
                      onChange={(e) => setNewGarageData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Main St, City, State"
                      className="flex-1 bg-white border-blue-200 focus:border-blue-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUseCurrentLocation}
                      disabled={gettingLocation}
                      className="border-blue-200 hover:bg-blue-100"
                      title="Use current location"
                    >
                      {gettingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateGarage(false)}
                    disabled={creatingGarage}
                    className="flex-1 border-blue-200 hover:bg-blue-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateGarage}
                    disabled={creatingGarage || !newGarageData.name.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {creatingGarage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Garage
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <BlockFormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title="Edit Vehicle Details"
      description="Update your vehicle information and settings"
      icon={<Pencil className="h-6 w-6 text-blue-600" />}
      sections={sections}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
      isLoading={isLoading}
      error={error}
    />
  )
}
