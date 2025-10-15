/**
 * Timeline Header Component
 * 
 * Handles search and filter UI for timeline
 * Responsive: expanding search on mobile, persistent on desktop
 */

'use client'

import { useState } from 'react'
import { Camera, Search, ArrowLeft, ChevronDown, Check, X } from 'lucide-react'
import { Flex, Heading, Button } from '@/components/design-system'
import { TimelineFilter } from '@/types/timeline'

interface TimelineHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFilter: TimelineFilter
  onFilterChange: (filter: TimelineFilter) => void
  filterOptions: Array<{ value: TimelineFilter; label: string; count?: number }>
  onCapture?: () => void
  showHeader?: boolean
}

export function TimelineHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterOptions,
  onCapture,
  showHeader = true
}: TimelineHeaderProps) {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  if (!showHeader) return null

  return (
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm -mx-4 px-4 sm:px-6">
      <div className="py-3 sm:py-4">
        {/* Mobile: Expanding search */}
        {searchExpanded ? (
          <Flex align="center" gap="sm" className="md:hidden">
            <button
              onClick={() => {
                setSearchExpanded(false)
                onSearchChange('')
              }}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="relative flex-1">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search timeline..."
                className="w-full px-3 py-2 bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </Flex>
        ) : (
          <>
            {/* Mobile: Collapsed */}
            <Flex justify="between" align="center" className="md:hidden">
              <Heading level="title" className="text-xl font-bold text-gray-900">
                Timeline
              </Heading>
              
              <Flex gap="xs">
                <button
                  onClick={() => setSearchExpanded(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="Search timeline"
                >
                  <Search className="w-5 h-5 text-gray-700" />
                </button>
                
                {/* Filter Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    {filterOptions.find(f => f.value === activeFilter)?.label || 'All'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showFilterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowFilterDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                        {filterOptions.map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => {
                              onFilterChange(filter.value)
                              setShowFilterDropdown(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                          >
                            <Check
                              className={`w-4 h-4 ${
                                activeFilter === filter.value ? 'text-blue-600' : 'text-transparent'
                              }`}
                            />
                            <span className="flex-1">{filter.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Flex>
            </Flex>

            {/* Desktop: Full layout */}
            <Flex justify="between" align="center" className="hidden md:flex">
              <Heading level="title" className="text-2xl font-bold text-gray-900">
                Timeline
              </Heading>
              
              <Flex gap="md" align="center">
                {/* Persistent search bar */}
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search timeline..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
                
                {/* Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    {filterOptions.find(f => f.value === activeFilter)?.label || 'All Events'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showFilterDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowFilterDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                        {filterOptions.map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => {
                              onFilterChange(filter.value)
                              setShowFilterDropdown(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-left"
                          >
                            <Check
                              className={`w-4 h-4 flex-shrink-0 ${
                                activeFilter === filter.value ? 'text-blue-600' : 'text-transparent'
                              }`}
                            />
                            <span className="flex-1">{filter.label}</span>
                            {filter.count !== undefined && (
                              <span className="text-xs text-gray-500">({filter.count})</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Capture button */}
                {onCapture && (
                  <Button
                    onClick={onCapture}
                    className="bg-black text-white hover:bg-gray-800 rounded-lg"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture
                  </Button>
                )}
              </Flex>
            </Flex>
          </>
        )}
      </div>
    </div>
  )
}
