/**
 * InlineField - Per-field inline editing component
 * 
 * Provides seamless, mobile-friendly inline editing for individual fields.
 * Replaces the bulk edit mode with focused, per-field interactions.
 */

'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Flex, Text } from '@/components/design-system'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker, TimePicker, AddressAutocomplete } from '@/components/ui/smart-inputs'
import { AIBadgeWithPopover } from '@/components/ui/AIBadgeWithPopover'
import { FieldHelp } from '@/components/ui/FieldHelp'
import { CalculatedFieldPopover } from '@/components/ui/CalculatedFieldPopover'
import { cn } from '@/lib/utils/cn'

interface InlineFieldProps {
  label: string
  value: string | number | null
  fieldName: string
  inputType?: 'text' | 'number' | 'textarea' | 'currency' | 'date' | 'time' | 'address'
  editable?: boolean
  onSave: (fieldName: string, newValue: any, additionalUpdates?: Record<string, any>) => Promise<void>
  validate?: (value: any) => string | null
  placeholder?: string
  format?: (value: any) => string
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
  className?: string
}

export function InlineField({
  label,
  value,
  fieldName,
  inputType = 'text',
  editable = true,
  onSave,
  validate,
  placeholder,
  format,
  aiGenerated,
  aiType,
  confidence,
  aiDetails,
  helpText,
  calculatedFrom,
  className
}: InlineFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<any>(value)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const displayValue = format && value !== null && value !== undefined 
    ? format(value) 
    : value !== null && value !== undefined 
    ? String(value) 
    : 'Not found'

  const handleStartEdit = () => {
    setEditValue(value)
    setError(null)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditValue(value)
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    // Validate
    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Don't save if unchanged
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(fieldName, editValue)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBlur = () => {
    // On mobile/touch devices, don't auto-save - too risky with accidental taps
    // Instead, keep edit mode open and show explicit save button
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    
    if (isTouchDevice) {
      // On mobile: stay in edit mode, user must press Enter or tap save button
      return
    }
    
    // On desktop: auto-save on blur (clicking away)
    if (editValue !== value && !error) {
      handleSave()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleChange = (newValue: any) => {
    setEditValue(newValue)
    setError(null) // Clear error on change
  }

  if (!editable) {
    // Non-editable field (usually calculated)
    return (
      <Flex justify="between" align="center" className={cn("py-2", className)}>
        <Flex gap="xs" align="center">
          <Text className="text-sm font-medium text-gray-700">
            {label}
          </Text>
          {helpText && (
            <FieldHelp
              title={helpText.title}
              description={helpText.description}
              examples={helpText.examples}
              tips={helpText.tips}
            />
          )}
        </Flex>
        <Flex gap="xs" align="center">
          <Text className="text-sm font-semibold text-gray-900">
            {displayValue}
          </Text>
          {calculatedFrom && (
            <CalculatedFieldPopover
              title={label}
              result={displayValue}
              formula={calculatedFrom.formula}
              steps={calculatedFrom.steps}
            />
          )}
          {aiGenerated && aiType && (
            <AIBadgeWithPopover
              confidence={confidence}
              aiType={aiType}
              fieldName={fieldName}
              detectionDetails={aiDetails}
            />
          )}
        </Flex>
      </Flex>
    )
  }

  if (!isEditing) {
    // View mode - click value to edit (no edit button needed)
    return (
      <Flex 
        justify="between" 
        align="center" 
        className={cn("py-2", className)}
      >
        <Flex gap="xs" align="center">
          <Text className="text-sm font-medium text-gray-700">
            {label}
          </Text>
          {helpText && (
            <FieldHelp
              title={helpText.title}
              description={helpText.description}
              examples={helpText.examples}
              tips={helpText.tips}
            />
          )}
        </Flex>
        <Flex gap="xs" align="center">
          {editable ? (
            <button
              onClick={handleStartEdit}
              className={cn(
                "text-sm font-semibold text-gray-900 hover:text-blue-600",
                "px-2 py-1 -mx-2 -my-1 rounded hover:bg-blue-50",
                "transition-colors cursor-pointer text-right"
              )}
            >
              {displayValue}
            </button>
          ) : (
            <Text className="text-sm font-semibold text-gray-900">
              {displayValue}
            </Text>
          )}
          {aiGenerated && aiType && (
            <AIBadgeWithPopover
              confidence={confidence}
              aiType={aiType}
              fieldName={fieldName}
              detectionDetails={aiDetails}
            />
          )}
        </Flex>
      </Flex>
    )
  }

  // Edit mode
  return (
    <Flex 
      justify="between" 
      align="center" 
      className={cn("py-2", className)}
    >
      <Text className="text-sm font-medium text-gray-700">
        {label}
      </Text>
      
      <div className="flex-1 max-w-xs">
        {/* Input field */}
        {inputType === 'textarea' ? (
            <Textarea
              value={editValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              className={cn(
                "text-sm w-full",
                error && "border-red-500 focus-visible:ring-red-500"
              )}
              rows={3}
              autoFocus
              disabled={isSaving}
            />
        ) : inputType === 'date' ? (
          <DatePicker
            value={editValue || ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn("w-full", error && "border-red-500")}
          />
        ) : inputType === 'time' ? (
          <TimePicker
            value={editValue || ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={isSaving}
            className={cn("w-full", error && "border-red-500")}
          />
        ) : inputType === 'address' ? (
          <AddressAutocomplete
            value={editValue || ''}
            onChange={(address, coords) => {
              // Update the value
              setEditValue(address)
              setError(null)
              
              // Auto-save after selecting from dropdown
              // Use setTimeout to ensure state update completes
              setTimeout(async () => {
                if (address && address !== value) {
                  setIsSaving(true)
                  try {
                    // Save address and coordinates together if available from Mapbox
                    const additionalUpdates: Record<string, any> = {}
                    if (coords && fieldName === 'geocoded_address') {
                      additionalUpdates.geocoded_lat = coords.lat
                      additionalUpdates.geocoded_lng = coords.lng
                      console.log('📍 Saving coordinates with address:', coords)
                    }
                    
                    await onSave(fieldName, address, additionalUpdates)
                    setIsEditing(false)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to save')
                  } finally {
                    setIsSaving(false)
                  }
                }
              }, 150)
            }}
            onBlur={handleBlur}
            placeholder={placeholder || 'Search for an address...'}
            disabled={isSaving}
            className={cn("w-full", error && "border-red-500")}
          />
        ) : inputType === 'currency' ? (
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm z-10">
              $
            </span>
            <Input
              type="number"
              step="0.01"
              value={editValue || ''}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className={cn(
                "text-sm pl-7 w-full",
                error && "border-red-500 focus-visible:ring-red-500"
              )}
              autoFocus
              disabled={isSaving}
            />
          </div>
        ) : (
          <Input
            type={inputType}
            step={inputType === 'number' ? '0.1' : undefined}
            value={editValue || ''}
            onChange={(e) => handleChange(
              inputType === 'number' ? parseFloat(e.target.value) : e.target.value
            )}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            className={cn(
              "text-sm w-full",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            autoFocus
            disabled={isSaving}
          />
        )}
        
        {/* Error message or save hint */}
        {error ? (
          <div className="flex items-center gap-1 mt-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">{error}</span>
          </div>
        ) : isSaving ? (
          <div className="text-xs text-gray-500 mt-1">Saving...</div>
        ) : (
          <div className="text-xs text-gray-400 mt-1 hidden sm:block">Press Enter or click away to save, Esc to cancel</div>
        )}
      </div>

      {/* Mobile-only action buttons */}
      <div className="flex sm:hidden gap-2 ml-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !!error}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </Flex>
  )
}
