'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, X, Check, AlertCircle } from 'lucide-react'
import { Card, AIBadge } from '@/components/design-system'
import { validateField } from '@/lib/validation/event-validation'

interface DataField {
  label: string
  value: string | number | null
  name?: string
  editable?: boolean
  inputType?: 'text' | 'number' | 'date' | 'textarea'
  aiGenerated?: boolean  // Was this field AI-generated?
  aiType?: 'generated' | 'enhanced' | 'detected' | 'calculated'
  confidence?: number    // AI confidence score (0-1)
  rawValue?: any         // Raw value for editing (e.g., YYYY-MM-DD for dates)
}

interface DataSectionProps {
  title: string
  fields: DataField[]
  map?: React.ReactNode
  weather?: React.ReactNode // Weather display component
  defaultExpanded?: boolean
  isEditable?: boolean
  onSave?: (updates: Record<string, any>) => void
  mode?: 'view' | 'review' // 'view' = event details (collapsible), 'review' = capture flow (expanded)
  showFieldIcons?: boolean // Show confidence/source indicators
  badge?: React.ReactNode // Optional badge/indicator in header
}

export function DataSection({ 
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
  // In review mode, always start expanded and don't allow collapsing
  const [isExpanded, setIsExpanded] = useState(mode === 'review' ? true : defaultExpanded)
  const [isEditing, setIsEditing] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, any>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})

  const handleEdit = () => {
    // Initialize edited values with current values (use rawValue for editing if available)
    const initial = fields.reduce((acc, field) => {
      if (field.name) {
        // Use rawValue for editing (for dates, etc.), fallback to display value
        acc[field.name] = field.rawValue !== undefined ? field.rawValue : field.value
      }
      return acc
    }, {} as Record<string, any>)
    setEditedValues(initial)
    setIsEditing(true)
    setIsExpanded(true) // Auto-expand when editing
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedValues({})
    setFieldErrors({})
  }

  const handleSave = () => {
    // Don't save if there are validation errors
    const hasErrors = Object.values(fieldErrors).some(error => error !== null)
    if (hasErrors) return
    
    if (onSave) {
      onSave(editedValues)
    }
    setIsEditing(false)
    setFieldErrors({})
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    // Update value
    setEditedValues(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Validate field in real-time
    const error = validateField(fieldName, value)
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }))
  }

  if (fields.length === 0 && !map) {
    return null
  }

  const showAccordion = mode === 'view'

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-200
      ${isEditing 
        ? 'shadow-2xl shadow-blue-200/60 ring-4 ring-blue-100 border-2 border-blue-400' 
        : 'border border-gray-200'
      }
    `}>
      {/* Editing Badge */}
      {isEditing && (
        <div className="absolute -top-2.5 left-4 z-10 px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg border-2 border-white animate-pulse">
          ✏️ EDITING
        </div>
      )}
      
      {/* Header */}
      {showAccordion ? (
        // Collapsible header for 'view' mode (event details)
        <button
          onClick={() => !isEditing && setIsExpanded(!isExpanded)}
          className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isExpanded ? 'border-b border-gray-100' : ''}`}
          disabled={isEditing}
        >
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                Editing
              </span>
            )}
            <span className="text-sm text-gray-500">{fields.length} {fields.length === 1 ? 'field' : 'fields'}</span>
            {!isEditing && (isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ))}
          </div>
        </button>
      ) : (
        // Simple header for 'review' mode (capture flow) - always visible
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {badge && <div className="ml-2">{badge}</div>}
        </div>
      )}

      {/* Content (Always visible in review mode, expandable in view mode) */}
      {(isExpanded || mode === 'review') && (
        <div>
          {/* Map (if provided) */}
          {map && (
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              {map}
            </div>
          )}

          {/* Weather (if provided) */}
          {weather && (
            <div className="p-4 border-b border-gray-100">
              {weather}
            </div>
          )}

          {/* Fields */}
          <div className="p-4 space-y-4">
            {fields.map((field, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{field.label}</label>
                  {!isEditing && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        {field.value !== null && field.value !== undefined ? field.value : 'Not found'}
                      </span>
                      {field.aiGenerated && (
                        <AIBadge
                          type={field.aiType || 'detected'}
                          confidence={field.confidence}
                          fieldName={field.label}
                          size="sm"
                          variant="inline"
                        />
                      )}
                    </div>
                  )}
                </div>
                
                {isEditing && field.editable !== false && field.name ? (
                  // Edit mode - show before/after comparison
                  <div className={`space-y-2 p-3 rounded-lg border ${fieldErrors[field.name] ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">Current:</span>
                      <span className="text-gray-900">{field.value}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${fieldErrors[field.name] ? 'text-red-700' : 'text-blue-700'}`}>
                          New value:
                        </span>
                        {field.inputType === 'textarea' ? (
                          <textarea
                            value={editedValues[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name!, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 bg-white ${
                              fieldErrors[field.name]
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            rows={3}
                          />
                        ) : (
                          <input
                            type={field.inputType || 'text'}
                            value={editedValues[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name!, field.inputType === 'number' ? parseFloat(e.target.value) : e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 bg-white ${
                              fieldErrors[field.name]
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-blue-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          />
                        )}
                      </div>
                      
                      {/* Validation Error Message */}
                      {fieldErrors[field.name] && (
                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          <span>{fieldErrors[field.name]}</span>
                        </div>
                      )}
                    </div>
                    
                    {!fieldErrors[field.name] && editedValues[field.name] !== undefined && editedValues[field.name] !== field.value && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-700 font-medium">→ Will change to:</span>
                        <span className="text-green-900 font-semibold">{editedValues[field.name]}</span>
                      </div>
                    )}
                  </div>
                ) : isEditing && field.editable === false ? (
                  // Read-only field in edit mode
                  <div className="text-sm text-gray-500 italic">
                    {field.value} (read-only)
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          
          {/* Edit Actions - Bottom of Section */}
          {isEditable && (isExpanded || mode === 'review') && (
            <div className={`px-4 py-3 border-t border-gray-200 flex items-center justify-between ${
              mode === 'review' ? 'bg-white' : 'bg-gray-50'
            }`}>
              {!isEditing ? (
                <>
                  <span className="text-xs text-gray-500">
                    {mode === 'review' ? 'Tap any field to edit' : 'Click to edit this section'}
                  </span>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  {(() => {
                    const hasErrors = Object.values(fieldErrors).some(error => error !== null)
                    const hasChanges = Object.keys(editedValues).some(
                      key => editedValues[key] !== fields.find(f => f.name === key)?.value
                    )
                    
                    return (
                      <>
                        <span className={`text-xs font-medium ${hasErrors ? 'text-red-700' : 'text-blue-700'}`}>
                          {hasErrors ? 'Fix errors to save' : 'Make your changes above'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={hasErrors || !hasChanges}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              hasErrors
                                ? 'bg-red-500 text-white cursor-not-allowed opacity-60'
                                : !hasChanges
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'text-white bg-blue-600 hover:bg-blue-700'
                            }`}
                          >
                            {hasErrors ? (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                Fix Errors
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Save Changes
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
