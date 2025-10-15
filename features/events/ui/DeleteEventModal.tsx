'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Stack, Button, Text } from '@/components/design-system'

interface DeleteEventModalProps {
  event: {
    id: string
    type: string
    vendor?: string | null
    display_vendor?: string | null
    total_amount?: number | null
    gallons?: number | null
    date: string
    geocoded_address?: string | null
  }
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function DeleteEventModal({ event, isOpen, onClose, onConfirm }: DeleteEventModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (reason.trim().length >= 5) {
      onConfirm(reason.trim())
      setReason('')
    }
  }

  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const typeLabels: Record<string, string> = {
    fuel: '⛽ Fuel Fill-Up',
    service: '🔧 Service',
    dashboard_snapshot: '📊 Dashboard Snapshot',
    damage: '⚠️ Damage Report'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Delete Event?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Event Summary */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              This will delete:
            </Text>
            <div className="space-y-1 text-sm text-gray-900">
              <div className="font-semibold">
                {typeLabels[event.type] || 'Event'} at {event.display_vendor || event.vendor || 'Unknown'}
              </div>
              {event.total_amount && event.gallons && (
                <div className="text-gray-700">
                  ${event.total_amount.toFixed(2)} • {event.gallons.toFixed(2)} gal
                </div>
              )}
              <div className="text-gray-600">
                {formattedDate}
                {event.geocoded_address && ` • ${event.geocoded_address.split(',')[0]}`}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <Text className="text-xs text-amber-800">
              This event will be soft-deleted and can be restored within <strong>30 days</strong>. 
              After 30 days, it will be permanently removed.
            </Text>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you deleting this? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Duplicate entry, Wrong vehicle, Test data, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              autoFocus
            />
            <Text className="text-xs text-gray-500 mt-1">
              Minimum 5 characters. This helps track data quality.
            </Text>
            {reason.trim().length > 0 && reason.trim().length < 5 && (
              <Text className="text-xs text-red-600 mt-1">
                Please enter at least 5 characters
              </Text>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={reason.trim().length < 5}
            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Delete Event
          </Button>
        </div>
      </div>
    </div>
  )
}
