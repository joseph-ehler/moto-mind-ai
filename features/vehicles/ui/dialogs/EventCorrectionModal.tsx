/**
 * Event Correction Modal
 * 
 * Modal for correcting event data from AI chat
 * Focuses on dashboard snapshot corrections (warning lights, etc.)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { BaseModalShell } from '@/components/design-system/feedback/ModalSystem'
import { Edit, Loader, Check, AlertTriangle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleName: string
  eventData: {
    event_id: string
    event_type: string
    event_date: string
  } | null
  onSuccess?: () => void
}

export function EventCorrectionModal({ 
  isOpen, 
  onClose, 
  vehicleId, 
  vehicleName,
  eventData,
  onSuccess 
}: Props) {
  const [warningLights, setWarningLights] = useState({
    check_engine: false,
    oil_pressure: false,
    brake_system: false,
    airbag: false,
    battery: false,
    tire_pressure: false
  })
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!eventData) return

    setIsSubmitting(true)
    setError(null)

    try {
      const corrections = {
        'payload.warning_lamps': warningLights
      }

      const response = await fetch(
        `/api/vehicles/${vehicleId}/events/${eventData.event_id}/correct`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            corrections,
            reason: reason || 'Warning lights correction from AI chat',
            source: 'ai_chat_correction'
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to correct event')
      }

      console.log('✅ Event corrected:', data)
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setReason('')
      
      onClose()
    } catch (err: any) {
      console.error('❌ Failed to correct event:', err)
      setError(err.message || 'Failed to correct event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      setError(null)
      onClose()
    }
  }

  const toggleWarningLight = (light: keyof typeof warningLights) => {
    setWarningLights(prev => ({
      ...prev,
      [light]: !prev[light]
    }))
  }

  const eventDate = eventData?.event_date 
    ? new Date(eventData.event_date).toLocaleDateString()
    : ''

  return (
    <BaseModalShell isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <Stack spacing="lg">
          {/* Header */}
          <Flex align="center" gap="sm">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Edit className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <Heading level="subtitle" className="text-lg font-semibold">
                Correct Dashboard Data
              </Heading>
              <Text className="text-sm text-gray-600">
                {vehicleName} • {eventDate}
              </Text>
            </div>
          </Flex>

          {/* Warning Lights Section */}
          <div>
            <Flex align="center" gap="xs" className="mb-3">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
              <Text className="text-sm font-medium text-gray-700">
                Warning Lights Status
              </Text>
            </Flex>
            
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(warningLights).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => toggleWarningLight(key as keyof typeof warningLights)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <Flex align="center" justify="between">
                    <Text className={`text-sm font-medium ${
                      value ? 'text-red-700' : 'text-gray-700'
                    }`}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      value 
                        ? 'bg-red-500 border-red-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {value && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </Flex>
                </button>
              ))}
            </div>
            
            <Text className="text-xs text-gray-500 mt-2">
              Click to toggle each warning light on/off
            </Text>
          </div>

          {/* Reason for Correction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Correction (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this correction is needed..."
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

          {/* Info Box */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Text className="text-xs text-blue-700">
              ℹ️ This correction will be saved to the audit trail. The original data will be preserved for reference.
            </Text>
          </div>

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Correction</span>
                </>
              )}
            </Button>
          </Flex>
        </Stack>
      </div>
    </BaseModalShell>
  )
}
