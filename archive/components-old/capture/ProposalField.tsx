/**
 * ProposalField
 * Displays an extracted field with confidence indicator, inline editing, and data source
 */

'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, HelpCircle, Edit2 } from 'lucide-react'
import { DataSourceBadge, type DataSource } from './DataSourceBadge'

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none'

interface ProposalFieldProps {
  label: string
  value: string | number | null | undefined
  confidence: ConfidenceLevel
  source?: DataSource
  warning?: string
  prompt?: string
  editable?: boolean
  onEdit?: (newValue: string) => void
  inputType?: 'text' | 'number' | 'date'
  fieldId?: string  // Add ID for scroll-to-field
}

export function ProposalField({
  label,
  value,
  confidence,
  source = 'vision_ai',
  warning,
  prompt,
  editable = true,
  onEdit,
  inputType = 'text',
  fieldId,
}: ProposalFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value || ''))

  const handleSave = () => {
    onEdit?.(editValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(String(value || ''))
    setIsEditing(false)
  }

  // Confidence styling
  const confidenceConfig = {
    high: {
      border: 'border-green-200',
      bg: 'bg-green-50',
      icon: <CheckCircle className="w-4 h-4 text-green-600" />,
      iconLabel: 'High confidence',
    },
    medium: {
      border: 'border-orange-200',
      bg: 'bg-orange-50',
      icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
      iconLabel: 'Medium confidence',
    },
    low: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      icon: <XCircle className="w-4 h-4 text-red-600" />,
      iconLabel: 'Low confidence',
    },
    none: {
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      icon: <HelpCircle className="w-4 h-4 text-gray-600" />,
      iconLabel: 'Not found',
    },
  }

  const config = confidenceConfig[confidence]

  // Simplify colors - only show if there's a warning
  const hasWarning = warning || (confidence === 'low')
  const borderColor = hasWarning ? 'border-orange-200' : 'border-gray-200'
  const bgColor = hasWarning ? 'bg-orange-50' : 'bg-white'

  return (
    <div
      id={fieldId}
      className={`
        p-4 rounded-lg border transition-all scroll-mt-4
        ${borderColor} ${bgColor}
      `}
    >
      {/* Header: Label + Edit button (no confidence icons) */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{label}</span>

        {editable && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        )}
      </div>

      {/* Editing mode */}
      {isEditing ? (
        <div className="flex items-center gap-2 mt-2">
          <input
            type={inputType}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Display mode - Simplified */}
          <div className="text-lg font-semibold text-gray-900">
            {value || <span className="text-gray-400 italic">Not found</span>}
          </div>

          {/* Show contextual info only when helpful */}
          {value && source === 'exif' && (
            <div className="mt-1 text-xs text-gray-500">
              ⓘ From photo location
            </div>
          )}
          
          {value && source === 'gps' && (
            <div className="mt-1 text-xs text-gray-500">
              ⓘ From current location
            </div>
          )}

          {/* Warning message (only for low confidence) */}
          {warning && (
            <div className="mt-2 flex items-start gap-2 p-2 bg-orange-100 rounded-md">
              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-orange-700">{warning}</span>
            </div>
          )}

          {/* Helpful prompt for missing fields */}
          {prompt && !value && (
            <div className="mt-2 text-sm text-gray-600">
              💡 {prompt}
            </div>
          )}
        </>
      )}
    </div>
  )
}
