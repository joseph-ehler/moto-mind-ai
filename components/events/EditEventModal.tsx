import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit3, Gauge, DollarSign, Fuel, Thermometer, Droplets, AlertTriangle } from 'lucide-react'
import { BlockFormModal, ModalSection } from '@/components/modals'

interface Event {
  id: string
  type: string
  miles?: number | null
  notes?: string | null
  total_amount?: number | null
  gallons?: number | null
  vendor?: string | null
  payload?: any
}

interface EditEventModalProps {
  event: Event
  vehicleId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditEventModal({ event, vehicleId, isOpen, onClose, onSuccess }: EditEventModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [editReason, setEditReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditReason('')
      setError('')
      setIsLoading(false)
    }
  }, [isOpen])

  // Initialize form data based on event type
  useEffect(() => {
    if (!event) return

    const baseData = {
      type: event.type,
      notes: event.notes || event.payload?.notes || '',
    }

    // Add type-specific fields
    switch (event.type) {
      case 'odometer':
        setFormData({
          ...baseData,
          miles: event.miles || '',
        })
        break
        
      case 'fuel':
      case 'fuel_purchase':
        setFormData({
          ...baseData,
          miles: event.miles || '',
          total_amount: event.total_amount || event.payload?.total_amount || '',
          gallons: event.gallons || event.payload?.gallons || '',
          price_per_gallon: event.payload?.price_per_gallon || '',
          vendor: event.vendor || event.payload?.vendor || '',
        })
        break
        
      case 'service':
      case 'maintenance':
      case 'repair':
        setFormData({
          ...baseData,
          miles: event.miles || '',
          total_amount: event.total_amount || event.payload?.total_amount || '',
          vendor: event.vendor || event.payload?.vendor || '',
        })
        break
        
      case 'dashboard_snapshot':
        setFormData({
          ...baseData,
          miles: event.miles || '',
          // V2 Dashboard fields
          odometer_original_value: event.payload?.key_facts?.odometer_original_value || '',
          odometer_original_unit: event.payload?.key_facts?.odometer_original_unit || 'mi',
          fuel_eighths: event.payload?.key_facts?.fuel_eighths ?? '',
          coolant_temp: event.payload?.key_facts?.coolant_temp || '',
          outside_temp_value: event.payload?.key_facts?.outside_temp_value ?? '',
          outside_temp_unit: event.payload?.key_facts?.outside_temp_unit || 'F',
          oil_life_percent: event.payload?.key_facts?.oil_life_percent ?? '',
          service_message: event.payload?.key_facts?.service_message || '',
        })
        break
        
      default:
        setFormData({
          ...baseData,
          miles: event.miles || '',
        })
    }
  }, [event])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle unit conversion when switching between km/mi
  const handleUnitChange = (newUnit: string) => {
    const currentValue = formData.odometer_original_value
    const currentUnit = formData.odometer_original_unit
    
    if (!currentValue || currentUnit === newUnit) {
      // Just update the unit if no value or same unit
      handleInputChange('odometer_original_unit', newUnit)
      return
    }
    
    const numValue = parseFloat(currentValue)
    let convertedValue: number
    
    if (newUnit === 'mi' && currentUnit === 'km') {
      // km → mi
      convertedValue = Math.round(numValue / 1.609)
    } else if (newUnit === 'km' && currentUnit === 'mi') {
      // mi → km
      convertedValue = Math.round(numValue * 1.609)
    } else {
      convertedValue = numValue
    }
    
    // Update both value and unit
    setFormData((prev: any) => ({
      ...prev,
      odometer_original_value: convertedValue.toString(),
      odometer_original_unit: newUnit
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔧 Edit form submitted:', { formData, editReason })
    setIsLoading(true)
    setError('')

    try {
      // Build base payload
      const basePayload = {
        miles: formData.miles ? parseInt(formData.miles) : null,
        notes: formData.notes || null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        gallons: formData.gallons ? parseFloat(formData.gallons) : null,
        vendor: formData.vendor || null,
        edit_reason: editReason.trim() || 'Manual edit via UI',
        payload: {
          ...event.payload,
          notes: formData.notes || null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
          gallons: formData.gallons ? parseFloat(formData.gallons) : null,
          price_per_gallon: formData.price_per_gallon ? parseFloat(formData.price_per_gallon) : null,
          vendor: formData.vendor || null,
        }
      }

      // Add dashboard-specific fields if this is a dashboard_snapshot
      if (event.type === 'dashboard_snapshot') {
        const originalValue = formData.odometer_original_value ? parseInt(formData.odometer_original_value) : null
        const originalUnit = formData.odometer_original_unit || 'mi'
        
        // Recalculate normalized miles if original value changed
        let normalizedMiles = basePayload.miles
        if (originalValue && originalUnit === 'km') {
          normalizedMiles = Math.round(originalValue / 1.609)
        } else if (originalValue) {
          normalizedMiles = originalValue
        }
        
        basePayload.miles = normalizedMiles
        basePayload.payload.key_facts = {
          ...event.payload.key_facts,
          // Normalized values
          odometer_miles: normalizedMiles,
          odometer_unit: 'mi',
          // Source of truth
          odometer_original_value: originalValue,
          odometer_original_unit: originalUnit,
          // Other dashboard fields
          fuel_eighths: formData.fuel_eighths !== '' ? parseInt(formData.fuel_eighths) : null,
          coolant_temp: formData.coolant_temp && formData.coolant_temp !== '' ? formData.coolant_temp : null,
          outside_temp_value: formData.outside_temp_value !== '' ? parseFloat(formData.outside_temp_value) : null,
          outside_temp_unit: formData.outside_temp_unit || null,
          oil_life_percent: formData.oil_life_percent !== '' ? parseInt(formData.oil_life_percent) : null,
          service_message: formData.service_message || null,
        }
      }

      const response = await fetch(`/api/vehicles/${vehicleId}/timeline/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ API Error:', response.status, errorData)
        throw new Error(`Failed to update event: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Edit successful:', result)
      
      onSuccess()
      
      // Small delay to ensure state updates complete before closing
      setTimeout(() => {
        onClose()
      }, 100)
    } catch (error) {
      console.error('❌ Failed to save event:', error)
      setError(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'odometer': 'Odometer Reading',
      'fuel': 'Fuel Record',
      'fuel_purchase': 'Fuel Purchase',
      'service': 'Service Record',
      'maintenance': 'Maintenance',
      'repair': 'Repair',
      'dashboard_snapshot': 'Dashboard Snapshot',
    }
    return labels[type] || type
  }

  // Build sections dynamically based on event type
  const sections: ModalSection[] = [
    // Event Information Section
    {
      id: 'event-info',
      title: 'Event Information',
      description: 'Basic event details and measurements',
      content: (
        <>
          {/* Event Type - Read Only */}
          <div>
            <Label htmlFor="eventType" className="text-sm font-medium text-gray-700">Event Type</Label>
            <Input
              id="eventType"
              value={getEventTypeLabel(formData.type)}
              disabled
              className="mt-2 h-12 rounded-xl border-gray-200 bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-2">Event type cannot be changed</p>
          </div>

          {/* Miles - Show for NON-dashboard event types only */}
          {formData.hasOwnProperty('miles') && formData.type !== 'dashboard_snapshot' && (
            <div>
              <Label htmlFor="miles" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Odometer Reading (miles)
              </Label>
              <Input
                id="miles"
                type="number"
                min="0"
                max="999999"
                value={formData.miles}
                onChange={(e) => handleInputChange('miles', e.target.value)}
                placeholder="Current mileage"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Notes - Always show */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Additional notes about this event..."
              className="mt-2 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </>
      ),
    },
    // Dashboard Data Section - Only for dashboard_snapshot events
    {
      id: 'dashboard-data',
      title: 'Dashboard Readings',
      description: 'Odometer, fuel level, and sensor readings from the dashboard',
      show: formData.type === 'dashboard_snapshot',
      content: (
        <>
          {/* Odometer Original (Source of Truth) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="odometerOriginalValue" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Dashboard Reading
              </Label>
              <Input
                id="odometerOriginalValue"
                type="number"
                min="0"
                max="999999"
                value={formData.odometer_original_value}
                onChange={(e) => handleInputChange('odometer_original_value', e.target.value)}
                placeholder="What's shown on dash"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Value converts when unit changes</p>
            </div>
            <div>
              <Label htmlFor="odometerOriginalUnit" className="text-sm font-medium text-gray-700">Unit</Label>
              <Select
                value={formData.odometer_original_unit}
                onValueChange={handleUnitChange}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mi">Miles (mi)</SelectItem>
                  <SelectItem value="km">Kilometers (km)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Converts value when changed</p>
            </div>
          </div>

          {/* Fuel Level */}
          <div>
            <Label htmlFor="fuelEighths" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Fuel Level (eighths)
            </Label>
            <Select
              value={formData.fuel_eighths?.toString() || ''}
              onValueChange={(value) => handleInputChange('fuel_eighths', value)}
            >
              <SelectTrigger className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select fuel level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">E (Empty - 0/8)</SelectItem>
                <SelectItem value="1">1/8</SelectItem>
                <SelectItem value="2">1/4 (2/8)</SelectItem>
                <SelectItem value="3">3/8</SelectItem>
                <SelectItem value="4">1/2 (4/8)</SelectItem>
                <SelectItem value="5">5/8</SelectItem>
                <SelectItem value="6">3/4 (6/8)</SelectItem>
                <SelectItem value="7">7/8</SelectItem>
                <SelectItem value="8">F (Full - 8/8)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Fuel gauge needle position</p>
          </div>

          {/* Coolant Temperature */}
          <div>
            <Label htmlFor="coolantTemp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              Coolant Temperature
            </Label>
            <Select
              value={formData.coolant_temp || 'not_visible'}
              onValueChange={(value) => handleInputChange('coolant_temp', value === 'not_visible' ? '' : value)}
            >
              <SelectTrigger className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Select temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_visible">Not visible</SelectItem>
                <SelectItem value="cold">Cold (C)</SelectItem>
                <SelectItem value="normal">Normal (Center)</SelectItem>
                <SelectItem value="hot">Hot (H)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">Engine temperature gauge reading</p>
          </div>

          {/* Outside Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="outsideTempValue" className="text-sm font-medium text-gray-700">Outside Temperature</Label>
              <Input
                id="outsideTempValue"
                type="number"
                min="-50"
                max="150"
                value={formData.outside_temp_value}
                onChange={(e) => handleInputChange('outside_temp_value', e.target.value)}
                placeholder="Temperature"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="outsideTempUnit" className="text-sm font-medium text-gray-700">Unit</Label>
              <Select
                value={formData.outside_temp_unit}
                onValueChange={(value) => handleInputChange('outside_temp_unit', value)}
              >
                <SelectTrigger className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                  <SelectItem value="C">Celsius (°C)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Oil Life Percentage */}
          {formData.oil_life_percent !== undefined && (
            <div>
              <Label htmlFor="oilLifePercent" className="text-sm font-medium text-gray-700">Oil Life Remaining (%)</Label>
              <Input
                id="oilLifePercent"
                type="number"
                min="0"
                max="100"
                value={formData.oil_life_percent}
                onChange={(e) => handleInputChange('oil_life_percent', e.target.value)}
                placeholder="Oil life percentage"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">If displayed on dashboard</p>
            </div>
          )}

          {/* Service Message */}
          {formData.service_message !== undefined && (
            <div>
              <Label htmlFor="serviceMessage" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Service Message
              </Label>
              <Input
                id="serviceMessage"
                value={formData.service_message}
                onChange={(e) => handleInputChange('service_message', e.target.value)}
                placeholder="e.g., Service due soon, Oil change required"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Warning or maintenance message displayed</p>
            </div>
          )}
        </>
      ),
    },
    // Financial Details Section - Only show for events with financial data
    {
      id: 'financial-details',
      title: (formData.type === 'fuel' || formData.type === 'fuel_purchase') ? 'Fuel Details' : 'Financial Details',
      description: (formData.type === 'fuel' || formData.type === 'fuel_purchase') 
        ? 'Fuel purchase information and costs' 
        : 'Service costs and vendor information',
      show: formData.hasOwnProperty('total_amount') || formData.hasOwnProperty('gallons') || formData.hasOwnProperty('vendor'),
      content: (
        <>
          {/* Gallons and Total Amount in grid for fuel events */}
          {(formData.hasOwnProperty('gallons') && formData.hasOwnProperty('total_amount')) ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gallons" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Gallons
                </Label>
                <Input
                  id="gallons"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.gallons}
                  onChange={(e) => handleInputChange('gallons', e.target.value)}
                  placeholder="0.000"
                  className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="totalAmount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Amount ($)
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => handleInputChange('total_amount', e.target.value)}
                  placeholder="0.00"
                  className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            /* Single column for non-fuel events */
            <>
              {formData.hasOwnProperty('total_amount') && (
                <div>
                  <Label htmlFor="totalAmount" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Total Amount ($)
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', e.target.value)}
                    placeholder="0.00"
                    className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {/* Price per Gallon - Only for fuel events */}
          {formData.hasOwnProperty('price_per_gallon') && (
            <div>
              <Label htmlFor="pricePerGallon" className="text-sm font-medium text-gray-700">Price per Gallon ($)</Label>
              <Input
                id="pricePerGallon"
                type="number"
                step="0.001"
                min="0"
                value={formData.price_per_gallon}
                onChange={(e) => handleInputChange('price_per_gallon', e.target.value)}
                placeholder="0.000"
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Vendor */}
          {formData.hasOwnProperty('vendor') && (
            <div>
              <Label htmlFor="vendor" className="text-sm font-medium text-gray-700">
                {(formData.type === 'fuel' || formData.type === 'fuel_purchase') ? 'Gas Station/Vendor' : 'Service Provider/Vendor'}
              </Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
                placeholder={(formData.type === 'fuel' || formData.type === 'fuel_purchase') ? 'Shell, Chevron, etc.' : 'Service center, shop name, etc.'}
                className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}
        </>
      ),
    },
    // Edit Tracking Section
    {
      id: 'edit-tracking',
      title: 'Edit Tracking',
      description: 'Help others understand why this event was modified',
      content: (
        <div>
          <Label htmlFor="editReason" className="text-sm font-medium text-gray-700">Reason for Edit</Label>
          <Input
            id="editReason"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="e.g., Corrected OCR error, Updated mileage, Fixed vendor name"
            className="mt-2 h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">This will be recorded in the event's change log</p>
        </div>
      ),
    },
  ]

  return (
    <BlockFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Edit Event Details"
      description={`Update the details for this ${getEventTypeLabel(event?.type)} event`}
      icon={<Edit3 className="h-6 w-6 text-blue-600" />}
      sections={sections}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
      isLoading={isLoading}
      error={error}
    />
  )
}
