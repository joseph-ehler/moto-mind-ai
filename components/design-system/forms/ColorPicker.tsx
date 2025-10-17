'use client'

import * as React from 'react'
import { Check, Palette } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// ENHANCED COLOR PICKER - MotoMind patterns
// ============================================================================

export interface ColorPickerProps {
  /** Color Picker ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below color picker */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Current color value (hex format) */
  value?: string
  /** Change handler */
  onChange?: (color: string) => void
  /** Preset colors to choose from */
  presets?: string[]
  /** Show hex input */
  showInput?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Additional className */
  className?: string
}

// Common vehicle colors
const DEFAULT_PRESETS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#C0C0C0', // Silver
  '#808080', // Gray
  '#FF0000', // Red
  '#0000FF', // Blue
  '#00FF00', // Green
  '#FFFF00', // Yellow
  '#FFA500', // Orange
  '#800080', // Purple
  '#A52A2A', // Brown
  '#FFD700', // Gold
  '#4B4B4B', // Dark Gray
  '#E8E8E8', // Light Gray
  '#8B0000', // Dark Red
  '#000080', // Navy
]

/**
 * Enhanced ColorPicker - Color selection with MotoMind patterns
 * 
 * Features:
 * - Color swatches with presets
 * - Hex input field
 * - Validation states
 * - Common vehicle colors by default
 * 
 * @example
 * <ColorPicker
 *   label="Vehicle Color"
 *   value={color}
 *   onChange={setColor}
 *   presets={['#FF0000', '#00FF00', '#0000FF']}
 *   showInput
 * />
 */
export function ColorPicker({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  value = '#000000',
  onChange,
  presets = DEFAULT_PRESETS,
  showInput = true,
  disabled,
  required,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)
  const colorPickerId = id || React.useId()

  // Sync input value when value prop changes
  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  const buttonClasses = {
    default: '',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-amber-500'
  }

  const handleSwatchClick = React.useCallback((color: string) => {
    if (!disabled) {
      setInputValue(color)
      onChange?.(color)
      setOpen(false)
    }
  }, [disabled, onChange])

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange?.(newValue.toUpperCase())
    }
  }, [onChange])

  const handleInputBlur = React.useCallback(() => {
    // Ensure valid hex color on blur
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(value)
    }
  }, [inputValue, value])

  const getColorName = React.useMemo(() => {
    const colors: Record<string, string> = {
      '#FFFFFF': 'White',
      '#000000': 'Black',
      '#C0C0C0': 'Silver',
      '#808080': 'Gray',
      '#FF0000': 'Red',
      '#0000FF': 'Blue',
      '#00FF00': 'Green',
      '#FFFF00': 'Yellow',
      '#FFA500': 'Orange',
      '#800080': 'Purple',
      '#A52A2A': 'Brown',
      '#FFD700': 'Gold',
    }
    return (hex: string) => colors[hex.toUpperCase()] || hex
  }, [])

  const isLightColor = React.useCallback((hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    return luma > 186
  }, [])

  return (
    <Stack spacing="sm" className={className}>
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={colorPickerId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Color Picker Popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={colorPickerId}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start h-10 px-3',
              buttonClasses[validationState]
            )}
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${colorPickerId}-message` : 
              helperText ? `${colorPickerId}-helper` : 
              undefined
            }
          >
            <div className="flex items-center gap-2 flex-1">
              <div
                className="h-6 w-6 rounded border-2 border-black/10 flex-shrink-0"
                style={{ backgroundColor: value }}
              />
              <span className="font-mono text-sm">{value.toUpperCase()}</span>
              <span className="text-muted-foreground ml-auto text-sm">{getColorName(value)}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-3"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Stack spacing="md">
            {/* Color Swatches */}
            <div className="grid grid-cols-8 gap-2">
        {presets.map((color) => {
          const isSelected = value.toUpperCase() === color.toUpperCase()
          return (
            <button
              key={color}
              type="button"
              onClick={() => handleSwatchClick(color)}
              disabled={disabled}
              className={cn(
                'relative h-10 w-10 rounded-lg border-2 transition-all',
                'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-black/10',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
              style={{ backgroundColor: color }}
              title={getColorName(color)}
              aria-label={`Select ${getColorName(color)}`}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check 
                    className="h-5 w-5 drop-shadow-lg" 
                    style={{ 
                      color: isLightColor(color) ? '#000000' : '#FFFFFF'
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
            </div>

            {/* Hex Input */}
            {showInput && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hex Code</Label>
                <Input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  disabled={disabled}
                  placeholder="#000000"
                  maxLength={7}
                  className="w-full font-mono uppercase text-sm"
                />
              </div>
            )}
          </Stack>
        </PopoverContent>
      </Popover>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p id={`${colorPickerId}-message`} className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p id={`${colorPickerId}-helper`} className="text-xs text-muted-foreground">
              {helperText}
            </p>
          )}
        </div>
      )}
    </Stack>
  )
}
