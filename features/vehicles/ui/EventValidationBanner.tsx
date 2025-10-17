/**
 * Event Validation Banner
 * 
 * Shows warnings for duplicate events, mileage issues, etc.
 */

'use client'

import React from 'react'
import { Stack, Flex, Text } from '@/components/design-system'
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import { ValidationWarning } from '@/lib/validation/event-validation'

interface Props {
  warnings: ValidationWarning[]
  onDismiss?: () => void
  onProceed?: () => void
}

export function EventValidationBanner({ warnings, onDismiss, onProceed }: Props) {
  if (warnings.length === 0) return null

  // Group by severity
  const errors = warnings.filter(w => w.severity === 'error')
  const warnings_filtered = warnings.filter(w => w.severity === 'warning')
  const infos = warnings.filter(w => w.severity === 'info')

  return (
    <Stack spacing="sm">
      {/* Errors */}
      {errors.map((warning, idx) => (
        <div
          key={`error-${idx}`}
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Text className="font-semibold text-red-900 text-sm">{warning.message}</Text>
            {warning.details && (
              <Text className="text-red-700 text-xs mt-1">{warning.details}</Text>
            )}
          </div>
        </div>
      ))}

      {/* Warnings */}
      {warnings_filtered.map((warning, idx) => (
        <div
          key={`warning-${idx}`}
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Text className="font-semibold text-amber-900 text-sm">{warning.message}</Text>
            {warning.details && (
              <Text className="text-amber-700 text-xs mt-1">{warning.details}</Text>
            )}
          </div>
        </div>
      ))}

      {/* Info */}
      {infos.map((warning, idx) => (
        <div
          key={`info-${idx}`}
          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <Text className="font-semibold text-blue-900 text-sm">{warning.message}</Text>
            {warning.details && (
              <Text className="text-blue-700 text-xs mt-1">{warning.details}</Text>
            )}
          </div>
        </div>
      ))}

      {/* Actions */}
      {errors.length > 0 ? (
        <Flex gap="sm" className="pt-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Save Anyway
          </button>
        </Flex>
      ) : warnings_filtered.length > 0 ? (
        <Flex gap="sm" className="pt-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Continue
          </button>
        </Flex>
      ) : null}
    </Stack>
  )
}
