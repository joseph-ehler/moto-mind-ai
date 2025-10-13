'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Stack, Button, Text } from '@/components/design-system'

interface EditReasonModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
  changes: Array<{ field: string; oldValue: any; newValue: any }>
}

export function EditReasonModal({ isOpen, onClose, onConfirm, changes }: EditReasonModalProps) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (reason.trim().length >= 5) {
      onConfirm(reason)
      setReason('')
    }
  }

  const isValidReason = reason.trim().length >= 5
  const characterCount = reason.trim().length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Changes</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Changes Summary */}
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              You're changing:
            </Text>
            <div className="space-y-2 p-3 bg-gray-50 rounded border border-gray-200">
              {changes.map((change, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium text-gray-900">{change.field}</span>
                  <div className="mt-1 space-y-1">
                    <div className="text-gray-500">
                      From: <span className="line-through">{String(change.oldValue)}</span>
                    </div>
                    <div className="text-green-700">
                      To: <span className="font-medium">{String(change.newValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you changing this? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Entered wrong value initially, Found receipt with correct info, etc."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                characterCount > 0 && !isValidReason
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
              rows={3}
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <Text className="text-xs text-gray-500">
                This helps track data quality and changes over time.
              </Text>
              <Text className={`text-xs font-medium ${
                isValidReason 
                  ? 'text-green-600' 
                  : characterCount > 0 
                  ? 'text-red-600' 
                  : 'text-gray-400'
              }`}>
                {isValidReason ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Min 5 characters
                  </span>
                ) : (
                  `${characterCount}/5 characters`
                )}
              </Text>
            </div>
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
            disabled={!isValidReason}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
