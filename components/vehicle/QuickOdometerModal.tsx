/**
 * Quick Odometer Update Modal
 * 
 * Simple modal for logging current mileage from AI chat
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { BaseModalShell } from '@/components/design-system/feedback/ModalSystem'
import { ModalContent } from '@/components/design-system/feedback/ModalInternals'
import { Gauge, Loader, Check } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleName: string
  suggestedMileage?: number
  serviceType?: string  // If provided, creates a service event
  eventType?: string    // Explicit event type override
  extractedData?: any   // Full extracted data from AI
  onSuccess?: (mileage: number) => void
}

export function QuickOdometerModal({ 
  isOpen, 
  onClose, 
  vehicleId, 
  vehicleName,
  suggestedMileage,
  serviceType,
  eventType,
  extractedData,
  onSuccess 
}: Props) {
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill suggested mileage
  useEffect(() => {
    if (isOpen && suggestedMileage) {
      setMileage(suggestedMileage.toString())
    }
  }, [isOpen, suggestedMileage])

  const handleSubmit = async () => {
    const mileageNum = parseInt(mileage)
    
    if (!mileageNum || mileageNum < 0) {
      setError('Please enter a valid mileage')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Use smart-log endpoint for flexible event creation
      const response = await fetch(`/api/vehicles/${vehicleId}/events/smart-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType || extractedData?.event_type || (serviceType ? 'service' : 'odometer'),
          mileage: mileageNum,
          notes: notes || undefined,
          source: 'ai_chat_approval',
          // Service-specific
          service_type: serviceType || extractedData?.service_type,
          vendor_name: extractedData?.vendor_name,
          cost: extractedData?.cost,
          // Fuel-specific
          gallons: extractedData?.gallons,
          station_name: extractedData?.station_name,
          trip_miles: extractedData?.trip_miles,
          // Damage-specific
          damage_type: extractedData?.damage_type,
          severity: extractedData?.severity,
          // Warning-specific
          warning_type: extractedData?.warning_type,
          error_codes: extractedData?.error_codes,
          // Generic payload (includes dashboard snapshot data)
          payload: {
            fuel_level: fuelLevel || extractedData?.fuel_level || undefined,
            engine_temp: extractedData?.engine_temp || undefined,
            outside_temp: extractedData?.outside_temp || undefined,
            warning_lights: extractedData?.warning_lights || undefined,
            ...extractedData?.payload
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update odometer')
      }

      console.log('✅ Odometer updated:', data)
      
      // Call success callback
      if (onSuccess) {
        onSuccess(mileageNum)
      }

      // Reset form
      setMileage('')
      setFuelLevel('')
      setNotes('')
      
      onClose()
    } catch (err: any) {
      console.error('❌ Failed to update odometer:', err)
      setError(err.message || 'Failed to update odometer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setMileage('')
      setFuelLevel('')
      setNotes('')
      setError(null)
      onClose()
    }
  }

  return (
    <BaseModalShell isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        <Stack spacing="lg">
          {/* Header */}
          <Flex align="center" gap="sm">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Heading level="subtitle" className="text-lg font-semibold">
                {serviceType ? `Log ${serviceType}` : 'Log Current Mileage'}
              </Heading>
              <Text className="text-sm text-gray-600">{vehicleName}</Text>
            </div>
          </Flex>

          {/* Mileage Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Odometer Reading *
            </label>
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Enter mileage..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
              autoFocus
            />
            <Text className="text-xs text-gray-500 mt-1">
              Miles shown on your vehicle's odometer
            </Text>
          </div>

          {/* Fuel Level (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Level (Optional)
            </label>
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="">Not specified</option>
              <option value="8">Full (8/8)</option>
              <option value="7">7/8</option>
              <option value="6">3/4</option>
              <option value="5">5/8</option>
              <option value="4">1/2</option>
              <option value="3">3/8</option>
              <option value="2">1/4</option>
              <option value="1">1/8</option>
              <option value="0">Empty</option>
            </select>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <Text className="text-sm text-red-700">{error}</Text>
            </div>
          )}

          {/* Actions */}
          <Flex justify="end" gap="sm">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !mileage}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Mileage</span>
                </>
              )}
            </Button>
          </Flex>
        </Stack>
      </div>
    </BaseModalShell>
  )
}
