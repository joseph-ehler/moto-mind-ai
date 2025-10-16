import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Save, X } from 'lucide-react'

interface Garage {
  id?: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
}

interface GarageFormProps {
  garage?: Garage
  onSave: (garage: Garage) => void
  onCancel: () => void
  loading?: boolean
}

export function GarageForm({ garage, onSave, onCancel, loading = false }: GarageFormProps) {
  const [formData, setFormData] = useState({
    name: garage?.name || '',
    address: garage?.address || '',
    lat: garage?.lat?.toString() || '',
    lng: garage?.lng?.toString() || '',
    timezone: garage?.timezone || 'UTC',
    isDefault: garage?.is_default || false
  })
  const [gettingLocation, setGettingLocation] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const garageData: Garage = {
      ...garage,
      name: formData.name.trim(),
      address: formData.address.trim(),
      lat: formData.lat ? parseFloat(formData.lat) : undefined,
      lng: formData.lng ? parseFloat(formData.lng) : undefined,
      timezone: formData.timezone,
      is_default: formData.isDefault
    }

    onSave(garageData)
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    setGettingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        setFormData(prev => ({
          ...prev,
          lat: latitude.toString(),
          lng: longitude.toString()
        }))

        // Try to reverse geocode to get address
        try {
          // This is a simple example - in production you'd use a proper geocoding service
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryCode}`
            
            setFormData(prev => ({
              ...prev,
              address: address,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }))
          }
        } catch (error) {
          console.warn('Failed to reverse geocode:', error)
        }
        
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Failed to get your location. Please enter the address manually.')
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {garage?.id ? 'Edit Garage' : 'Add New Garage'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Garage Name */}
          <div>
            <Label htmlFor="name">Garage Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Garage, Home, Office, etc."
              required
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address *</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State, Country"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={gettingLocation}
                title="Use current location"
              >
                <Navigation className={`h-4 w-4 ${gettingLocation ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Click the location button to use your current location
            </p>
          </div>

          {/* Coordinates (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">Latitude (Optional)</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="40.7128"
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude (Optional)</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="-74.0060"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="America/New_York"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for scheduling and local time calculations
            </p>
          </div>

          {/* Default Garage */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isDefault" className="text-sm">
              Set as default garage for new vehicles
            </Label>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Privacy:</strong> Location information is only used to organize your vehicles 
              and provide location-specific maintenance reminders. GPS coordinates are optional 
              and only stored if you provide them.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : garage?.id ? 'Update Garage' : 'Create Garage'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
