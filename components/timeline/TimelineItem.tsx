/**
 * TimelineItem Component
 * 
 * Compact, scannable timeline entry with visual hierarchy
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Stack, Flex, Text } from '@/components/design-system'
import { Edit2, Trash2, MoreVertical, Copy, Check } from 'lucide-react'
import { TimelineItem as TimelineItemType } from '@/types/timeline'
import { getEventIcon, getEventColor } from '@/lib/utils/event-icons'
import { formatTime } from '@/lib/utils/date-grouping'

interface TimelineItemProps {
  item: TimelineItemType
  onExpand?: (id: string) => void
  onEdit?: (item: TimelineItemType) => void
  onDelete?: (item: TimelineItemType) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

export function TimelineItem({ item, onExpand, onEdit, onDelete, selectionMode, isSelected, onToggleSelect }: TimelineItemProps) {
  // Format timestamp on client-side only to avoid hydration errors
  const [fullDate, setFullDate] = useState<string>('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  useEffect(() => {
    // Handle both timestamp and date properties
    const dateValue = item.timestamp || (item as any).date
    if (dateValue) {
      try {
        const formatted = new Date(dateValue).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        setFullDate(formatted)
      } catch (e) {
        console.error('Invalid date:', dateValue)
        setFullDate('Date unknown')
      }
    } else {
      setFullDate('Date unknown')
    }
  }, [item.timestamp, (item as any).date])

  return (
    <Card 
      className={`group p-0 hover:shadow-lg transition-shadow overflow-hidden bg-white border-2 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => {
        if (selectionMode && onToggleSelect) {
          onToggleSelect()
        } else {
          onExpand?.(item.id)
        }
      }}
    >
      {/* Timestamp Header with Menu */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <Text className="text-xs text-gray-600">{fullDate || 'Loading...'}</Text>
        
        {/* Three-dot menu */}
        {(onEdit || onDelete) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      onEdit(item)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Event</span>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    navigator.clipboard.writeText(item.id)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy ID</span>
                </button>
                {onDelete && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        onDelete(item)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Event</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Flex gap="none" className="flex-col sm:flex-row">
        {/* Photo Area - Always 200x200 */}
        <div className="w-full sm:w-[200px] h-[200px] flex-shrink-0 bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative">
          {/* Selection Checkbox */}
          {selectionMode && (
            <div className="absolute top-3 left-3 z-10">
              <div 
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-600' 
                    : 'bg-white border-gray-400'
                }`}
              >
                {isSelected && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}
          <Camera className="w-10 h-10 text-gray-400" />
        </div>

        {/* Content */}
        <div className="p-4 flex-1 min-w-0">
          <Stack spacing="sm">
            {/* Type Label */}
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {getItemTitle(item)}
            </Text>

            {/* Key Metric */}
            <div className="text-xl font-bold text-gray-900">
              {getKeyMetric(item)}
            </div>

            {/* Secondary Info */}
            {getSecondaryInfo(item) && (
              <Text className="text-sm text-gray-600">
                {getSecondaryInfo(item)}
              </Text>
            )}

            {/* Mileage Badge */}
            {item.mileage && (
              <div className="pt-2 mt-2 border-t border-gray-100">
                <Text className="text-xs text-gray-500">
                  {item.mileage.toLocaleString()} miles
                </Text>
              </div>
            )}
          </Stack>
        </div>
      </Flex>
    </Card>
  )
}

// Helper: Get display title for timeline item
function getItemTitle(item: TimelineItemType): string {
  switch (item.type) {
    case 'odometer':
      return 'Odometer'
    case 'service':
    case 'maintenance':
      return item.extracted_data.service_type || 'Service'
    case 'fuel':
      return 'Fuel'
    case 'dashboard_warning':
      return 'Warning'
    case 'dashboard_snapshot':
      return 'Dashboard Snapshot'
    case 'tire_tread':
      return 'Tire Tread'
    case 'tire_pressure':
      return 'Tire Pressure'
    case 'damage':
      return 'Damage'
    case 'parking':
      return 'Parking'
    case 'document':
      return 'Document'
    case 'manual':
      return 'Note'
    default:
      return 'Event'
  }
}

// Helper: Get the single most important metric for each type
function getKeyMetric(item: TimelineItemType): string {
  switch (item.type) {
    case 'odometer':
      return item.extracted_data?.reading 
        ? `${item.extracted_data.reading.toLocaleString()} mi`
        : 'Odometer reading'
    
    case 'service':
    case 'maintenance':
      return item.extracted_data?.cost 
        ? `$${item.extracted_data.cost.toFixed(2)}`
        : item.extracted_data?.vendor_name || 'Service completed'
    
    case 'fuel':
      const fuelCost = item.extracted_data?.cost || (item as any).cost
      const gallons = item.extracted_data?.gallons
      
      if (fuelCost && gallons) {
        return `$${fuelCost.toFixed(2)} • ${gallons.toFixed(1)} gal`
      } else if (fuelCost) {
        return `$${fuelCost.toFixed(2)}`
      } else if (gallons) {
        return `${gallons.toFixed(1)} gallons`
      }
      return 'Fuel recorded'
    
    case 'dashboard_warning':
    case 'dashboard_snapshot':
      return item.extracted_data?.warning_type?.length
        ? item.extracted_data.warning_type.join(', ')
        : 'Dashboard check'
    
    case 'tire_tread':
      return item.extracted_data?.depth_32nds
        ? `${item.extracted_data.depth_32nds}/32"`
        : 'Tread measured'
    
    case 'tire_pressure':
      return item.extracted_data?.pressures?.front_left
        ? `${item.extracted_data.pressures.front_left} PSI`
        : 'Pressure checked'
    
    case 'damage':
      return item.extracted_data?.severity && item.extracted_data?.location
        ? `${item.extracted_data.severity} - ${item.extracted_data.location}`
        : 'Damage reported'
    
    case 'parking':
      return item.extracted_data?.lot_name || 'Location saved'
    
    default:
      return 'View details'
  }
}

// Helper: Get secondary information for each type
function getSecondaryInfo(item: TimelineItemType): string | null {
  switch (item.type) {
    case 'odometer':
      return item.extracted_data?.change_since_last 
        ? `+${item.extracted_data.change_since_last.toLocaleString()} mi since last reading`
        : null
    
    case 'service':
    case 'maintenance':
      return item.extracted_data?.vendor_name || null
    
    case 'fuel':
      const fuelSecondary = []
      if (item.extracted_data?.gallons) {
        fuelSecondary.push(`${item.extracted_data.gallons.toFixed(1)} gal`)
      }
      if (item.extracted_data?.station_name || (item as any).vendor_name) {
        fuelSecondary.push(item.extracted_data?.station_name || (item as any).vendor_name)
      }
      if (item.extracted_data?.mpg_calculated) {
        fuelSecondary.push(`${item.extracted_data.mpg_calculated.toFixed(1)} mpg`)
      }
      return fuelSecondary.length > 0 ? fuelSecondary.join(' • ') : null
    
    case 'dashboard_warning':
    case 'dashboard_snapshot':
      return item.extracted_data?.resolved 
        ? 'Resolved' 
        : item.extracted_data?.severity || null
    
    case 'tire_tread':
      return item.extracted_data?.position && item.extracted_data?.condition
        ? `${item.extracted_data.position.replace('_', ' ')} tire • ${item.extracted_data.condition}`
        : null
    
    case 'parking':
      return item.extracted_data?.spot_number 
        ? `${item.extracted_data.level ? item.extracted_data.level + ', ' : ''}Spot ${item.extracted_data.spot_number}`
        : null
    
    default:
      return null
  }
}

