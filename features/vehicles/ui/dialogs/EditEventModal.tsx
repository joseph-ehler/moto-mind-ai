/**
 * Edit Event Modal
 * 
 * Allows users to edit existing timeline events
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { BaseModalShell } from '@/components/design-system/feedback/ModalSystem'
import { ModalContent } from '@/components/design-system/feedback/ModalInternals'
import { EventValidationBanner } from './EventValidationBanner'
import { validateEvent, ValidationWarning } from '@/lib/validation/event-validation'
import { Edit, Loader, Check, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  event: any
  vehicleId: string
  onSuccess?: () => void
}

export function EditEventModal({ 
  isOpen, 
  onClose, 
  event,
  vehicleId,
  onSuccess
}: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([])
  const [ignoreWarnings, setIgnoreWarnings] = useState(false)
  
  // Form state
  const [miles, setMiles] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  
  // Type-specific fields
  const [serviceType, setServiceType] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [gallons, setGallons] = useState('')
  const [damageType, setDamageType] = useState('')
  const [severity, setSeverity] = useState('')

  useEffect(() => {
    if (event && isOpen) {
      // Pre-fill form with existing event data
      setMiles(event.miles?.toString() || '')
      setDate(event.date ? new Date(event.date).toISOString().split('T')[0] : '')
      setNotes(event.notes || '')
      setTotalAmount(event.total_amount?.toString() || '')
      
      // Type-specific
      setServiceType(event.payload?.service_type || event.display_summary || '')
      setVendorName(event.vendor_name || '')
      setGallons(event.payload?.gallons?.toString() || '')
      setDamageType(event.payload?.damage_type || '')
      setSeverity(event.payload?.severity || '')
    }
  }, [event, isOpen])

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const updates: any = {
        miles: miles ? parseInt(miles) : null,
        date: date || null,
        notes: notes || null,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        payload: {
          ...event.payload
        }
      }

      // Add type-specific updates
      if (event.type === 'service' || event.type === 'maintenance') {
        updates.payload.service_type = serviceType
        updates.display_summary = serviceType || event.display_summary
        if (vendorName) updates.vendor_name = vendorName
      }

      if (event.type === 'fuel') {
        if (gallons) updates.payload.gallons = parseFloat(gallons)
      }

      if (event.type === 'damage') {
        if (damageType) updates.payload.damage_type = damageType
        if (severity) updates.payload.severity = severity
      }

      const response = await fetch(`/api/vehicles/${vehicleId}/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      console.log('✅ Event updated successfully')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('❌ Failed to update event:', err)
      setError(err.message || 'Failed to update event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BaseModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <ModalContent>
        <Stack spacing="lg">
          {/* Header */}
          <Flex justify="between" align="center">
            <Heading level="title">
              <Edit className="w-5 h-5 inline mr-2" />
              Edit Event
            </Heading>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </Flex>

          {/* Event Type Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm w-fit">
            <span className="font-medium text-gray-700">{event?.type?.replace('_', ' ')}</span>
          </div>

          {/* Form Fields */}
          <Stack spacing="md">
            {/* Mileage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mileage
              </label>
              <input
                type="number"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                placeholder="77000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Type-specific fields */}
            {(event?.type === 'service' || event?.type === 'maintenance') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    placeholder="Oil Change"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Jiffy Lube"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}

            {event?.type === 'fuel' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallons
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={gallons}
                  onChange={(e) => setGallons(e.target.value)}
                  placeholder="12.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {event?.type === 'damage' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Damage Type
                  </label>
                  <input
                    type="text"
                    value={damageType}
                    onChange={(e) => setDamageType(e.target.value)}
                    placeholder="Door ding"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select severity</option>
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                  </select>
                </div>
              </>
            )}

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="45.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </Stack>

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && !ignoreWarnings && (
            <EventValidationBanner
              warnings={validationWarnings}
              onDismiss={onClose}
              onProceed={() => setIgnoreWarnings(true)}
            />
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <Flex gap="sm">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </Flex>
        </Stack>
      </ModalContent>
    </BaseModalShell>
  )
}
