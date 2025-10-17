'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { Input } from '../forms/FormFields'
import { Combobox } from '../forms/Combobox'
import { Button } from '../primitives/Button'
import { Modal } from '../feedback/Overlays'

// ============================================================================
// MOBILE-FIRST UTILITIES
// ============================================================================

/**
 * useMediaQuery - Detect screen size for responsive behavior
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

/**
 * useIsMobile - Detect if device is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}

/**
 * useIsTablet - Detect if device is tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
}

/**
 * useIsTouch - Detect if device supports touch
 */
export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

// Mobile-first design tokens
const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

const touchTargets = {
  minimum: 44,  // Apple HIG minimum (44x44px)
  comfortable: 48,
  large: 56
}

// ============================================================================
// SEARCH BAR - Basic search with autocomplete
// ============================================================================

export interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string
  /** Current search value */
  value?: string
  /** Change handler */
  onChange?: (value: string) => void
  /** Submit handler */
  onSubmit?: (value: string) => void
  /** Show autocomplete suggestions */
  suggestions?: SearchSuggestion[]
  /** Suggestion selected */
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void
  /** Loading state */
  loading?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show search icon */
  showIcon?: boolean
  /** Show clear button */
  showClear?: boolean
  /** Additional className */
  className?: string
  /** Autofocus */
  autoFocus?: boolean
  /** Disable form wrapper (for use inside other forms) */
  disableForm?: boolean
}

export interface SearchSuggestion {
  id: string
  label: string
  category?: string
  icon?: React.ReactNode
  metadata?: string
  value?: any
}

/**
 * SearchBar - Basic search input with autocomplete suggestions
 * 
 * @example
 * <SearchBar
 *   placeholder="Search vehicles..."
 *   value={query}
 *   onChange={setQuery}
 *   suggestions={suggestions}
 *   onSuggestionSelect={handleSelect}
 * />
 */
export function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSubmit,
  suggestions = [],
  onSuggestionSelect,
  loading = false,
  size = 'md',
  showIcon = true,
  showClear = true,
  className,
  autoFocus = false,
  disableForm = false
}: SearchBarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(value)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  // Mobile-first responsive sizing
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  
  // Auto-upgrade size on mobile for better touch targets
  const responsiveSize = isMobile ? (size === 'sm' ? 'md' : size === 'md' ? 'lg' : size) : size

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    onChange?.(newValue)
    setIsOpen(newValue.length > 0 && suggestions.length > 0)
    setSelectedIndex(-1)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // If a suggestion is selected, use it
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSuggestionClick(suggestions[selectedIndex])
    } else {
      onSubmit?.(internalValue)
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInternalValue(suggestion.label)
    onChange?.(suggestion.label)
    onSuggestionSelect?.(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange?.('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault()
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
    }
  }

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: isMobile ? 'h-12 text-base' : 'h-10 text-base',  // Larger on mobile
    lg: isMobile ? 'h-14 text-lg' : 'h-12 text-lg'        // Larger on mobile
  }

  const inputElement = (
    <div className="relative">
      {/* Search Icon */}
      {showIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(internalValue.length > 0 && suggestions.length > 0)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'w-full rounded-lg border border-black/10 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
          'transition-colors',
          sizeClasses[responsiveSize],
          showIcon && (isMobile ? 'pl-12' : 'pl-10'),  // More padding on mobile
          (showClear && internalValue) && (isMobile ? 'pr-24' : 'pr-20'),
          !showClear && 'pr-4',
          // Prevent iOS zoom: minimum 16px font
          isMobile && 'text-base'
        )}
        style={isMobile ? { fontSize: '16px' } : undefined}  // Prevent iOS zoom
      />

      {/* Clear + Loading */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {loading && (
          <svg className="w-4 h-4 animate-spin text-black/40" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {showClear && internalValue && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className="text-black/40 hover:text-black/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={cn('relative', className)}>
      {disableForm ? (
        inputElement
      ) : (
        <form onSubmit={handleSubmit}>
          {inputElement}
        </form>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className={cn(
          'absolute z-50 w-full mt-2 bg-white border border-black/10 rounded-lg shadow-lg overflow-hidden',
          isMobile && 'max-h-[60vh]',  // More space on mobile
          !isMobile && 'max-h-80'
        )}>
          <div className="overflow-y-auto h-full">
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full text-left hover:bg-slate-50 transition-colors',
                  'flex items-center gap-3',
                  // Mobile: larger touch targets (min 48px)
                  isMobile ? 'px-5 py-4 min-h-[48px]' : 'px-4 py-2.5',
                  idx > 0 && 'border-t border-black/5',
                  selectedIndex === idx && 'bg-primary/10 border-primary/20'
                )}
              >
                {suggestion.icon && (
                  <div className="text-black/60 [&>svg]:w-5 [&>svg]:h-5">
                    {suggestion.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-black truncate">
                    {suggestion.label}
                  </div>
                  {suggestion.metadata && (
                    <div className="text-xs text-black/50 truncate">
                      {suggestion.metadata}
                    </div>
                  )}
                </div>
                {suggestion.category && (
                  <span className="px-2 py-0.5 text-xs bg-slate-100 text-black/70 rounded">
                    {suggestion.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ADVANCED SEARCH - With filters
// ============================================================================

export interface SearchFilter {
  id: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text'
  options?: Array<{ label: string; value: string }>
  value?: any
}

export interface AdvancedSearchProps {
  /** Search query */
  query?: string
  /** Query change handler */
  onQueryChange?: (query: string) => void
  /** Available filters */
  filters?: SearchFilter[]
  /** Filter change handler */
  onFilterChange?: (filterId: string, value: any) => void
  /** Submit handler */
  onSubmit?: () => void
  /** Reset handler */
  onReset?: () => void
  /** Show filters by default */
  defaultExpanded?: boolean
  /** Additional className */
  className?: string
}

/**
 * AdvancedSearch - Search with expandable filters
 * 
 * @example
 * <AdvancedSearch
 *   query={query}
 *   onQueryChange={setQuery}
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   onSubmit={handleSearch}
 * />
 */
export function AdvancedSearch({
  query = '',
  onQueryChange,
  filters = [],
  onFilterChange,
  onSubmit,
  onReset,
  defaultExpanded = false,
  className
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)
  const [internalQuery, setInternalQuery] = React.useState(query)

  const handleQueryChange = (value: string) => {
    setInternalQuery(value)
    onQueryChange?.(value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.()
  }

  const handleReset = () => {
    setInternalQuery('')
    onQueryChange?.('')
    onReset?.()
  }

  const activeFiltersCount = filters.filter(f => f.value).length

  return (
    <div className={cn('bg-white border border-black/10 rounded-lg', className)}>
      <form onSubmit={handleSubmit}>
        <Stack spacing="md" className="p-4">
          {/* Search Bar */}
          <Flex gap="sm">
            <div className="flex-1">
              <SearchBar
                placeholder="Search vehicles, services, maintenance..."
                value={internalQuery}
                onChange={handleQueryChange}
                showClear
                disableForm
              />
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
          </Flex>

          {/* Filters Toggle */}
          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-black/70 hover:text-black transition-colors"
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">
                {isExpanded ? 'Hide' : 'Show'} filters
              </span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {/* Filters */}
          {isExpanded && filters.length > 0 && (
            <div className="pt-2 border-t border-black/5">
              <Stack spacing="md">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filters.map(filter => (
                    <div key={filter.id}>
                      {filter.type === 'select' && filter.options && (
                        <Combobox
                          label={filter.label}
                          options={filter.options}
                          value={filter.value}
                          onChange={(value) => onFilterChange?.(filter.id, value)}
                        />
                      )}
                      {filter.type === 'text' && (
                        <Input
                          label={filter.label}
                          value={filter.value || ''}
                          onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
                        />
                      )}
                      {/* Add more filter types as needed */}
                    </div>
                  ))}
                </div>

                <Flex justify="end" gap="sm">
                  <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                    Reset filters
                  </Button>
                </Flex>
              </Stack>
            </div>
          )}
        </Stack>
      </form>
    </div>
  )
}

// ============================================================================
// SEARCH RESULTS - Display with highlighting
// ============================================================================

export interface SearchResult {
  id: string
  title: string
  description?: string
  category: string
  icon?: React.ReactNode
  metadata?: Array<{ label: string; value: string }>
  url?: string
  onClick?: () => void
}

export interface SearchResultsProps {
  /** Search results */
  results: SearchResult[]
  /** Search query for highlighting */
  query?: string
  /** Loading state */
  loading?: boolean
  /** Empty state */
  emptyState?: React.ReactNode
  /** Result click handler */
  onResultClick?: (result: SearchResult) => void
  /** Group by category */
  groupByCategory?: boolean
  /** Additional className */
  className?: string
}

/**
 * SearchResults - Display search results with highlighting
 * 
 * @example
 * <SearchResults
 *   results={results}
 *   query={query}
 *   onResultClick={handleResultClick}
 *   groupByCategory
 * />
 */
export function SearchResults({
  results,
  query = '',
  loading = false,
  emptyState,
  onResultClick,
  groupByCategory = false,
  className
}: SearchResultsProps) {
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  const highlightText = (text: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={idx} className="bg-yellow-200 text-black">
          {part}
        </mark>
      ) : (
        <span key={idx}>{part}</span>
      )
    )
  }

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="animate-pulse bg-slate-100 rounded-lg p-4 h-20" />
        ))}
      </div>
    )
  }

  if (results.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>
  }

  if (results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm text-black/40">No results found</p>
        {query && (
          <p className="text-xs text-black/30 mt-1">
            Try adjusting your search terms
          </p>
        )}
      </div>
    )
  }

  const resultsByCategory = groupByCategory
    ? results.reduce((acc, result) => {
        if (!acc[result.category]) {
          acc[result.category] = []
        }
        acc[result.category].push(result)
        return acc
      }, {} as Record<string, SearchResult[]>)
    : { All: results }

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(resultsByCategory).map(([category, categoryResults]) => (
        <div key={category}>
          {groupByCategory && (
            <h3 className="text-sm font-semibold text-black/60 uppercase tracking-wide mb-3">
              {category} ({categoryResults.length})
            </h3>
          )}
          <Stack spacing="sm">
            {categoryResults.map(result => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  result.onClick?.()
                  onResultClick?.(result)
                }}
                className={cn(
                  'w-full text-left bg-white border border-black/10 rounded-lg transition-all',
                  'hover:border-primary hover:shadow-sm',
                  // Mobile: larger touch targets and padding
                  isMobile ? 'p-5 min-h-[80px]' : 'p-4',
                  // Touch: active state feedback
                  isTouch && 'active:bg-slate-50'
                )}
              >
                <Flex 
                  align="start" 
                  gap={isMobile ? 'md' : 'sm'}
                  className={isMobile ? 'flex-col sm:flex-row' : ''}
                >
                  {result.icon && (
                    <div className={cn(
                      'flex-shrink-0 text-black/60',
                      isMobile ? '[&>svg]:w-7 [&>svg]:h-7' : '[&>svg]:w-6 [&>svg]:h-6'
                    )}>
                      {result.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      'font-medium text-black mb-1',
                      isMobile && 'text-base'  // Larger text on mobile
                    )}>
                      {highlightText(result.title)}
                    </div>
                    {result.description && (
                      <div className={cn(
                        'text-black/60 line-clamp-2',
                        isMobile ? 'text-sm' : 'text-sm'
                      )}>
                        {highlightText(result.description)}
                      </div>
                    )}
                    {result.metadata && result.metadata.length > 0 && (
                      <div className={cn(
                        'flex flex-wrap mt-2',
                        isMobile ? 'gap-2' : 'gap-3'
                      )}>
                        {result.metadata.map((meta, idx) => (
                          <span key={idx} className="text-xs text-black/50">
                            <span className="font-medium">{meta.label}:</span> {meta.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!groupByCategory && (
                    <span className={cn(
                      'flex-shrink-0 px-2 py-0.5 text-xs bg-slate-100 text-black/70 rounded',
                      isMobile && 'self-start'
                    )}>
                      {result.category}
                    </span>
                  )}
                </Flex>
              </button>
            ))}
          </Stack>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// GLOBAL SEARCH - Full modal search (Cmd+K style)
// ============================================================================

export interface GlobalSearchProps {
  /** Is modal open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Search function */
  onSearch: (query: string) => Promise<SearchResult[]> | SearchResult[]
  /** Result click handler */
  onResultClick?: (result: SearchResult) => void
  /** Placeholder text */
  placeholder?: string
  /** Show recent searches */
  showRecent?: boolean
  /** Recent searches */
  recentSearches?: string[]
  /** Clear recent searches */
  onClearRecent?: () => void
}

/**
 * GlobalSearch - Full-page search modal (Cmd+K style)
 * 
 * @example
 * <GlobalSearch
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSearch={handleSearch}
 *   onResultClick={handleResultClick}
 * />
 */
export function GlobalSearch({
  isOpen,
  onClose,
  onSearch,
  onResultClick,
  placeholder = 'Search vehicles, services, maintenance...',
  showRecent = true,
  recentSearches = [],
  onClearRecent
}: GlobalSearchProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const isMobile = useIsMobile()

  const handleSearch = React.useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const searchResults = await onSearch(searchQuery)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [onSearch]
  )

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, handleSearch])

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result)
    onClose()
    setQuery('')
  }

  const handleClose = () => {
    onClose()
    setQuery('')
    setResults([])
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={isMobile ? 'full' : 'lg'}  // Full-screen on mobile
      title=""
      showCloseButton={false}
    >
      <Stack spacing={isMobile ? 'md' : 'lg'} className={isMobile ? 'h-full' : ''}>
        {/* Search Input */}
        <div className={isMobile ? 'sticky top-0 bg-white z-10 pb-4' : ''}>
          <SearchBar
            placeholder={placeholder}
            value={query}
            onChange={setQuery}
            loading={loading}
            showClear
            size="lg"
            autoFocus
          />
        </div>

        {/* Recent Searches */}
        {!query && showRecent && recentSearches.length > 0 && (
          <div>
            <Flex justify="between" align="center" className="mb-3">
              <h3 className={cn(
                'font-semibold text-black/60 uppercase tracking-wide',
                isMobile ? 'text-xs' : 'text-sm'
              )}>
                Recent Searches
              </h3>
              {onClearRecent && (
                <button
                  type="button"
                  onClick={onClearRecent}
                  className={cn(
                    'text-black/40 hover:text-black/60 transition-colors',
                    isMobile ? 'text-xs px-2 py-1' : 'text-xs'
                  )}
                >
                  Clear
                </button>
              )}
            </Flex>
            <Stack spacing="xs">
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setQuery(search)}
                  className={cn(
                    'flex items-center gap-2 text-left hover:bg-slate-50 rounded-lg transition-colors',
                    isMobile ? 'px-4 py-3 text-base min-h-[48px]' : 'px-3 py-2 text-sm'
                  )}
                >
                  <svg className={cn(
                    'text-black/40',
                    isMobile ? 'w-5 h-5' : 'w-4 h-4'
                  )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-black/70">{search}</span>
                </button>
              ))}
            </Stack>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className={cn(
            'overflow-y-auto',
            isMobile ? 'flex-1 -mx-6 px-6' : 'max-h-96'  // Full height on mobile
          )}>
            <SearchResults
              results={results}
              query={query}
              loading={loading}
              onResultClick={handleResultClick}
              groupByCategory
            />
          </div>
        )}

        {/* Keyboard Shortcuts Hint - Hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center justify-center gap-4 text-xs text-black/40 pt-2 border-t border-black/5">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-slate-100 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-slate-100 rounded">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-slate-100 rounded">Esc</kbd>
              Close
            </span>
          </div>
        )}
      </Stack>
    </Modal>
  )
}

// ============================================================================
// SEARCH HOOK - For managing search state
// ============================================================================

export interface UseSearchOptions {
  /** Initial query */
  initialQuery?: string
  /** Debounce delay in ms */
  debounce?: number
  /** Minimum query length */
  minLength?: number
}

export interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  debouncedQuery: string
  isSearching: boolean
}

/**
 * useSearch - Hook for managing search state with debouncing
 * 
 * @example
 * const { query, setQuery, debouncedQuery } = useSearch({ debounce: 300 })
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { initialQuery = '', debounce = 300, minLength = 0 } = options
  
  const [query, setQuery] = React.useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery)
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    if (query.length < minLength) {
      setDebouncedQuery('')
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, debounce)

    return () => clearTimeout(timer)
  }, [query, debounce, minLength])

  return { query, setQuery, debouncedQuery, isSearching }
}
