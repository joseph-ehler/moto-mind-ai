/**
 * DataSection v2 - Redesigned with per-field inline editing
 * 
 * Replaces bulk edit mode with seamless per-field editing.
 * Uses MotoMind Design System and shadcn/ui components.
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Stack } from '@/components/design-system'
import { InlineField } from '@/components/ui/InlineField'

interface DataField {
  label: string
  value: string | number | null
  name?: string
  editable?: boolean
  inputType?: 'text' | 'number' | 'date' | 'textarea' | 'currency' | 'time' | 'address'
  aiGenerated?: boolean
  aiType?: 'generated' | 'enhanced' | 'detected' | 'calculated'
  confidence?: number
  aiDetails?: string
  helpText?: {
    title: string
    description: string
    examples?: string[]
    tips?: string[]
  }
  calculatedFrom?: {
    formula: string
    steps: Array<{ label: string; value: string | number; formula?: string }>
  }
  rawValue?: any
  format?: (value: any) => string
  validate?: (value: any) => string | null
}

interface DataSectionProps {
  title: string
  fields: DataField[]
  map?: React.ReactNode
  weather?: React.ReactNode
  defaultExpanded?: boolean
  isEditable?: boolean
  onSave?: (updates: Record<string, any>) => Promise<void>
  mode?: 'view' | 'review'
  showFieldIcons?: boolean
  badge?: React.ReactNode
}

export function DataSectionV2({
  title,
  fields,
  map,
  weather,
  defaultExpanded = false,
  isEditable = false,
  onSave,
  mode = 'view',
  showFieldIcons = false,
  badge
}: DataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(mode === 'review' ? true : defaultExpanded)

  const handleFieldSave = async (fieldName: string, newValue: any, additionalUpdates?: Record<string, any>) => {
    if (!onSave) return
    
    // Save the field + any additional updates (e.g., coordinates with address)
    const updates = { [fieldName]: newValue, ...additionalUpdates }
    await onSave(updates)
  }

  if (fields.length === 0 && !map && !weather) {
    return null
  }

  const showAccordion = mode === 'view'

  return (
    <Card className="bg-white/95 backdrop-blur-md border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
      {/* Header */}
      {showAccordion ? (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {fields.length} {fields.length === 1 ? 'field' : 'fields'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
      ) : (
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
      )}

      {/* Content */}
      {(isExpanded || mode === 'review') && (
        <div>
          {/* Map */}
          {map && (
            <div className="border-b border-gray-100">
              {map}
            </div>
          )}

          {/* Weather */}
          {weather && (
            <div className="p-4 border-b border-gray-100">
              {weather}
            </div>
          )}

          {/* Fields - Per-field inline editing */}
          <div className="p-4">
            <Stack spacing="xs">
              {fields.map((field, index) => (
                <InlineField
                  key={field.name || index}
                  label={field.label}
                  value={field.value}
                  fieldName={field.name || ''}
                  inputType={field.inputType}
                  editable={isEditable && field.editable !== false}
                  onSave={handleFieldSave}
                  validate={field.validate}
                  format={field.format}
                  aiGenerated={field.aiGenerated}
                  aiType={field.aiType}
                  confidence={field.confidence}
                  aiDetails={field.aiDetails}
                  helpText={field.helpText}
                  calculatedFrom={field.calculatedFrom}
                  className={index < fields.length - 1 ? 'border-b border-gray-100' : ''}
                />
              ))}
            </Stack>
          </div>
        </div>
      )}
    </Card>
  )
}
