'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Stack } from '../primitives/Layout'
import { useIsMobile, useIsTouch } from '../utilities/Search'

// ============================================================================
// TYPES
// ============================================================================

export interface ComboboxOption<T = any> {
  /** Unique value */
  value: T
  /** Display label */
  label: string
  /** Optional description */
  description?: string
  /** Icon or image */
  icon?: React.ReactNode
  /** Disabled state */
  disabled?: boolean
  /** Custom data */
  data?: any
}

export interface ComboboxProps<T = any> {
  /** Label text */
  label?: string
  /** Helper text shown below combobox */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Options array */
  options: ComboboxOption<T>[]
  /** Selected value(s) */
  value?: T | T[]
  /** Change handler */
  onChange?: (value: T | T[] | null) => void
  /** Placeholder text */
  placeholder?: string
  /** Enable multi-select */
  multiple?: boolean
  /** Allow clearing selection */
  clearable?: boolean
  /** Loading state */
  loading?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Allow creating new options */
  creatable?: boolean
  /** Handler for creating new options */
  onCreateOption?: (inputValue: string) => void
  /** Optional description above combobox */
  description?: string
  /** Search placeholder */
  searchPlaceholder?: string
  /** No options message */
  noOptionsMessage?: string
  /** Loading message */
  loadingMessage?: string
  /** Async search handler */
  onSearch?: (query: string) => Promise<ComboboxOption<T>[]>
  /** Debounce time for async search (ms) */
  searchDebounce?: number
}

// ============================================================================
// COMBOBOX COMPONENT - shadcn/ui + MotoMind patterns
// ============================================================================

/**
 * Enhanced Combobox - shadcn/ui Command + Popover with MotoMind patterns
 * 
 * Features:
 * - Built on battle-tested shadcn/ui
 * - Single & multi-select
 * - Searchable/filterable
 * - Keyboard navigation
 * - Async loading
 * - Create new options
 * - Validation states
 * 
 * @example
 * <Combobox
 *   label="Vehicle Make"
 *   options={makes}
 *   value={selectedMake}
 *   onChange={setSelectedMake}
 *   searchPlaceholder="Search makes..."
 * />
 */
export function Combobox<T = any>({
  label,
  helperText,
  error,
  success,
  warning,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  clearable = false,
  loading = false,
  disabled = false,
  required = false,
  creatable = false,
  onCreateOption,
  description,
  searchPlaceholder = 'Search...',
  noOptionsMessage = 'No options found',
  loadingMessage = 'Loading...',
  onSearch,
  searchDebounce = 300,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [asyncOptions, setAsyncOptions] = React.useState<ComboboxOption<T>[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const inputId = React.useId()
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  // Get selected option(s)
  const selectedOptions = React.useMemo(() => {
    const allOptions = onSearch ? asyncOptions : options
    if (multiple && Array.isArray(value)) {
      return allOptions.filter(opt => value.includes(opt.value))
    }
    return allOptions.filter(opt => opt.value === value)
  }, [options, asyncOptions, value, multiple, onSearch])

  // Handle async search with debounce
  React.useEffect(() => {
    if (!onSearch || !searchQuery) {
      setAsyncOptions([])
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const results = await onSearch(searchQuery)
        setAsyncOptions(results)
      } catch (error) {
        console.error('Search error:', error)
        setAsyncOptions([])
      } finally {
        setIsSearching(false)
      }
    }, searchDebounce)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, onSearch, searchDebounce])

  // Get options to display
  const displayOptions = onSearch ? asyncOptions : options

  // Filter options based on search (for non-async)
  const filteredOptions = React.useMemo(() => {
    if (onSearch) return displayOptions
    if (!searchQuery) return displayOptions
    
    const query = searchQuery.toLowerCase()
    return displayOptions.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query)
    )
  }, [displayOptions, searchQuery, onSearch])

  // Handle selection
  const handleSelect = (option: ComboboxOption<T>) => {
    if (option.disabled) return

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : []
      const newValue = currentValue.includes(option.value)
        ? currentValue.filter(v => v !== option.value)
        : [...currentValue, option.value]
      onChange?.(newValue)
    } else {
      onChange?.(option.value)
      setOpen(false)
    }
  }

  // Handle clear
  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    onChange?.(multiple ? [] : null)
  }

  // Handle remove single item (multi-select)
  const handleRemove = (optionValue: T, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple && Array.isArray(value)) {
      onChange?.(value.filter(v => v !== optionValue))
    }
  }

  // Handle create option
  const handleCreate = () => {
    if (creatable && onCreateOption && searchQuery.trim()) {
      onCreateOption(searchQuery.trim())
      setSearchQuery('')
    }
  }

  // Show create option
  const showCreateOption = creatable && searchQuery.trim() && !filteredOptions.some(opt =>
    opt.label.toLowerCase() === searchQuery.toLowerCase()
  )

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  const triggerClasses = {
    default: '',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-amber-500'
  }

  return (
    <Stack spacing="sm">
      {/* Label & Description */}
      {(label || description) && (
        <div>
          {label && (
            <Label htmlFor={inputId}>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              'w-full justify-between font-normal',
              isMobile && 'h-12 text-base',
              triggerClasses[validationState],
              !selectedOptions.length && 'text-muted-foreground'
            )}
            style={isMobile ? { fontSize: '16px' } : undefined}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className={isMobile ? 'h-5 w-5 animate-spin' : 'h-4 w-4 animate-spin'} />
                  Loading...
                </span>
              ) : multiple && selectedOptions.length > 0 ? (
                // Multiple selection chips
                <div className="flex flex-wrap gap-1 max-w-full">
                  {selectedOptions.map((option) => (
                    <Badge
                      key={String(option.value)}
                      variant="secondary"
                      className="gap-1"
                    >
                      <span className="truncate max-w-[150px]">{option.label}</span>
                      <button
                        onClick={(e) => handleRemove(option.value, e)}
                        className={cn(
                          'ml-1 hover:text-destructive',
                          isMobile && 'p-1 min-w-[24px] min-h-[24px] flex items-center justify-center'
                        )}
                        type="button"
                      >
                        <X className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : selectedOptions.length > 0 ? (
                // Single selection
                <span className="truncate">{selectedOptions[0].label}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>

            <div className="flex items-center gap-1 ml-2">
              {clearable && selectedOptions.length > 0 && !disabled && (
                <button
                  onClick={handleClear}
                  className={cn(
                    'hover:text-destructive',
                    isMobile && 'p-1 min-w-[32px] min-h-[32px] flex items-center justify-center'
                  )}
                  type="button"
                >
                  <X className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
                </button>
              )}
              <ChevronsUpDown className={isMobile ? 'h-5 w-5 shrink-0 opacity-50' : 'h-4 w-4 shrink-0 opacity-50'} />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent 
          className={cn(
            'w-full p-0',
            isMobile && 'max-h-[60vh]'
          )} 
          align="start"
        >
          <Command>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            
            <CommandEmpty>
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">{loadingMessage}</span>
                </div>
              ) : showCreateOption ? (
                <div
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={handleCreate}
                >
                  <span>Create "{searchQuery}"</span>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">{noOptionsMessage}</div>
              )}
            </CommandEmpty>

            <CommandGroup className={isMobile ? 'max-h-[50vh] overflow-auto' : 'max-h-[300px] overflow-auto'}>
              {filteredOptions.map((option) => {
                const isSelected = multiple
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value

                return (
                  <CommandItem
                    key={String(option.value)}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option)}
                    className={isMobile ? 'min-h-[48px] px-4 py-3' : ''}
                  >
                    {multiple && (
                      <div className={cn(
                        'mr-2 flex items-center justify-center rounded-sm border border-primary',
                        isMobile ? 'h-5 w-5' : 'h-4 w-4',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}>
                        <Check className={isMobile ? 'h-4 w-4' : 'h-3 w-3'} />
                      </div>
                    )}
                    
                    {option.icon && (
                      <div className={cn(
                        'mr-2 flex-shrink-0',
                        isMobile && '[&>svg]:w-5 [&>svg]:h-5'
                      )}>
                        {option.icon}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'truncate',
                        isMobile && 'text-base'
                      )}>
                        {option.label}
                      </div>
                      {option.description && (
                        <div className={cn(
                          'text-xs text-muted-foreground truncate',
                          isMobile && 'text-sm'
                        )}>
                          {option.description}
                        </div>
                      )}
                    </div>

                    {!multiple && isSelected && (
                      <Check className={cn(
                        'ml-2 flex-shrink-0',
                        isMobile ? 'h-5 w-5' : 'h-4 w-4'
                      )} />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper Text or Validation Message */}
      {(validationMessage || helperText) && (
        <div className="min-h-[20px]">
          {validationMessage && (
            <p className={cn('text-xs', messageClasses[validationState])}>
              {validationMessage}
            </p>
          )}
          {!validationMessage && helperText && (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          )}
        </div>
      )}
    </Stack>
  )
}
