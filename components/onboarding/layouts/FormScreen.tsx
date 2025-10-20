/**
 * FormScreen Layout
 * 
 * Beautiful, reusable layout for any form/question screen.
 * 100% driven by JSON configuration.
 * 
 * JSON Example:
 * {
 *   "type": "form",
 *   "title": "What's your vehicle's VIN?",
 *   "description": "We'll use this to pull accurate specs...",
 *   "icon": "car",
 *   "fields": [
 *     {
 *       "id": "vin",
 *       "type": "text",
 *       "label": "VIN",
 *       "placeholder": "Enter 17-character VIN",
 *       "validation": { "required": true, "length": 17 }
 *     }
 *   ],
 *   "help": {
 *     "title": "Where to find your VIN",
 *     "items": ["Dashboard", "Door jamb", "Registration"]
 *   }
 * }
 */

'use client'

import * as React from 'react'
import { FormSection, FormHelper } from '@/components/ui/form-section'
import { FormInput, AutoComplete, type InputType, type InputMode, type EnterKeyHint } from '@/components/ui/form-input'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// JSON-driven field configuration
export interface FieldConfig {
  id: string
  type: InputType
  label: string
  description?: string
  placeholder?: string
  
  // Validation
  validation?: {
    required?: boolean
    length?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    format?: 'uppercase' | 'lowercase' | 'capitalize'
    excludeChars?: string[]
  }
  
  // Mobile optimization
  inputMode?: InputMode
  enterKeyHint?: EnterKeyHint
  autoComplete?: string
  
  // Custom component (for special cases like VIN)
  customComponent?: React.ReactNode
}

export interface HelpConfig {
  title?: string
  items: string[]
}

export interface HelperConfig {
  type: 'info' | 'tip' | 'warning'
  content: string
}

export interface FormScreenConfig {
  // Header
  title: string
  description?: string
  icon?: React.ReactNode
  
  // Fields
  fields: FieldConfig[]
  
  // Help (popover)
  help?: HelpConfig
  
  // Helpers (inline tips)
  helpers?: HelperConfig[]
  
  // Callbacks
  values: Record<string, string>
  onChange: (fieldId: string, value: string) => void
  errors?: Record<string, string>
  
  // Styling
  className?: string
}

export function FormScreen({
  title,
  description,
  icon,
  fields,
  help,
  helpers,
  values,
  onChange,
  errors = {},
  className,
}: FormScreenConfig) {
  return (
    <div className={cn('w-full max-w-2xl mx-auto px-6 py-8', className)}>
      <FormSection
        title={title}
        description={description}
        icon={icon}
        spacing="relaxed"
      >
        {/* Fields */}
        <div className="space-y-6">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {/* Custom component or standard FormInput */}
              {field.customComponent ? (
                field.customComponent
              ) : (
                <>
                  {/* Label with Help */}
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor={field.id}
                      className="block text-sm font-medium text-gray-900"
                    >
                      {field.label}
                      {field.validation?.required && (
                        <span className="text-red-500 ml-1" aria-label="required">*</span>
                      )}
                    </label>
                    
                    {/* Help Popover */}
                    {help && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-gray-500 hover:text-gray-700 touch-manipulation"
                            aria-label={help.title || 'Help'}
                          >
                            <HelpCircle className="w-5 h-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-3">
                            {help.title && (
                              <h4 className="font-semibold text-sm">{help.title}</h4>
                            )}
                            <ul className="space-y-2 text-sm text-gray-600">
                              {help.items.map((item, index) => (
                                <li key={index}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  
                  {/* Field Description */}
                  {field.description && (
                    <p className="text-sm text-gray-600">
                      {field.description}
                    </p>
                  )}
                  
                  {/* Input */}
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    inputMode={field.inputMode || getInputMode(field.type)}
                    enterKeyHint={field.enterKeyHint || 'done'}
                    value={values[field.id] || ''}
                    onChange={(e) => {
                      let value = e.target.value
                      
                      // Apply format
                      if (field.validation?.format === 'uppercase') {
                        value = value.toUpperCase()
                      } else if (field.validation?.format === 'lowercase') {
                        value = value.toLowerCase()
                      }
                      
                      // Exclude chars
                      if (field.validation?.excludeChars) {
                        const excludePattern = new RegExp(`[${field.validation.excludeChars.join('')}]`, 'gi')
                        value = value.replace(excludePattern, '')
                      }
                      
                      // Max length
                      if (field.validation?.maxLength) {
                        value = value.slice(0, field.validation.maxLength)
                      }
                      
                      onChange(field.id, value)
                    }}
                    placeholder={field.placeholder}
                    required={field.validation?.required}
                    maxLength={field.validation?.maxLength || field.validation?.length}
                    pattern={field.validation?.pattern}
                    autoComplete={field.autoComplete}
                    aria-label={field.label}
                    aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
                    aria-invalid={!!errors[field.id]}
                    className={cn(
                      'block w-full rounded-lg border px-4 py-3',
                      'text-base font-normal text-gray-900 placeholder:text-gray-400',
                      'transition-colors duration-200',
                      'min-h-[44px] touch-manipulation',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      errors[field.id]
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                      field.validation?.format === 'uppercase' && 'uppercase font-mono tracking-wide'
                    )}
                  />
                  
                  {/* Error */}
                  {errors[field.id] && (
                    <p
                      id={`${field.id}-error`}
                      className="text-sm text-red-600 flex items-start gap-1"
                      role="alert"
                    >
                      <span className="text-base">⚠️</span>
                      <span>{errors[field.id]}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Helpers */}
        {helpers && helpers.length > 0 && (
          <div className="space-y-3 mt-6">
            {helpers.map((helper, index) => (
              <FormHelper key={index} type={helper.type}>
                {helper.content}
              </FormHelper>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  )
}

/**
 * Get input mode from type
 */
function getInputMode(type: InputType): InputMode {
  switch (type) {
    case 'email': return 'email'
    case 'tel': return 'tel'
    case 'number': return 'numeric'
    case 'url': return 'url'
    case 'search': return 'search'
    default: return 'text'
  }
}

/**
 * Validate field value
 */
export function validateField(field: FieldConfig, value: string): string | null {
  const val = field.validation
  if (!val) return null
  
  // Required
  if (val.required && !value) {
    return `${field.label} is required`
  }
  
  // Exact length
  if (val.length && value.length !== val.length) {
    return `${field.label} must be ${val.length} characters`
  }
  
  // Min length
  if (val.minLength && value.length < val.minLength) {
    return `${field.label} must be at least ${val.minLength} characters`
  }
  
  // Max length
  if (val.maxLength && value.length > val.maxLength) {
    return `${field.label} must be no more than ${val.maxLength} characters`
  }
  
  // Pattern
  if (val.pattern && !new RegExp(val.pattern).test(value)) {
    return `${field.label} format is invalid`
  }
  
  return null
}
