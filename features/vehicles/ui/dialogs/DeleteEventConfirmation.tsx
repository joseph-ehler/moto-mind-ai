/**
 * Delete Event Confirmation Dialog
 * 
 * Confirms before permanently deleting an event
 */

'use client'

import React, { useState } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { BaseModalShell } from '@/components/design-system/feedback/ModalSystem'
import { ModalContent } from '@/components/design-system/feedback/ModalInternals'
import { Trash2, AlertTriangle, Loader, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  event: any
  vehicleId: string
  onSuccess?: () => void
}

export function DeleteEventConfirmation({ 
  isOpen, 
  onClose, 
  event,
  vehicleId,
  onSuccess
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/events/${event.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event')
      }

      console.log('✅ Event deleted successfully')
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('❌ Failed to delete event:', err)
      setError(err.message || 'Failed to delete event')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <BaseModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalContent>
        <Stack spacing="lg">
          {/* Header with Warning */}
          <Flex direction="column" align="center" gap="md" className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <Heading level="section">Delete Event?</Heading>
          </Flex>

          {/* Event Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Stack spacing="xs">
              <Text className="font-semibold text-gray-900">
                {event?.display_summary || event?.type}
              </Text>
              <Text className="text-sm text-gray-600">
                {event?.date && new Date(event.date).toLocaleDateString()}
                {event?.miles && ` • ${event.miles.toLocaleString()} miles`}
              </Text>
              {event?.total_amount && (
                <Text className="text-sm text-gray-600">
                  ${event.total_amount.toFixed(2)}
                </Text>
              )}
            </Stack>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The event will be permanently removed from your timeline.
            </Text>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-900">
              {error}
            </div>
          )}

          {/* Actions */}
          <Flex gap="sm">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Event</span>
                </>
              )}
            </Button>
          </Flex>
        </Stack>
      </ModalContent>
    </BaseModalShell>
  )
}
