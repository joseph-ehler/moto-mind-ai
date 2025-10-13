/**
 * Timeline Item Compact - REFACTORED
 * 
 * Simplified using event type registry pattern
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Edit2, Copy, Trash2, Check } from 'lucide-react'
import { Flex, Stack } from '@/components/design-system'
import { TimelineItem as TimelineItemType } from '@/types/timeline'
import { getEventIcon, getEventColor } from '@/lib/utils/event-icons'
import { formatTime } from '@/lib/utils/date-grouping'
import { getEventRenderer, getCost } from './event-types'
import { DataGrid, NoteText, type DataRow } from './card-blocks'

interface Props {
  item: TimelineItemType
  onEdit?: (item: TimelineItemType) => void
  onDelete?: (item: TimelineItemType) => void
  onExpand?: (id: string) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
  timelineMode?: boolean
}

export function TimelineItemCompact({
  item,
  onEdit,
  onDelete,
  onExpand,
  selectionMode,
  isSelected,
  onToggleSelect,
  timelineMode = false
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // ✅ Use event type renderer
  const renderer = getEventRenderer(item.type)
  const title = renderer.getTitle(item)
  const subtitle = renderer.getSubtitle(item)
  const dataRows = renderer.getDataRows(item)
  const cost = getCost(item)

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

  // Cost indicator helpers
  const getCostColor = () => {
    if (cost === 0) return null
    if (cost < 50) return 'bg-green-500'
    if (cost < 200) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getCostLabel = () => {
    if (cost === 0) return null
    if (cost < 50) return 'Low cost'
    if (cost < 200) return 'Medium cost'
    return 'High cost'
  }

  // Icon colors - Comprehensive mapping
  const getIconBgColor = (): string => {
    const colorMap: Record<string, string> = {
      fuel: 'bg-blue-50',
      service: 'bg-purple-50',
      maintenance: 'bg-purple-50',
      odometer: 'bg-gray-50',
      dashboard_warning: 'bg-red-50',
      dashboard_snapshot: 'bg-blue-50',
      tire_tread: 'bg-orange-50',
      tire_pressure: 'bg-orange-50',
      damage: 'bg-orange-50',
      parking: 'bg-gray-50',
      document: 'bg-green-50',
      inspection: 'bg-green-50',
      recall: 'bg-red-50',
      manual: 'bg-gray-50',
    }
    return colorMap[item.type] || 'bg-gray-50'
  }

  return (
    <motion.div 
      className="relative group"
      initial={false}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      {/* Timeline dot (if in timeline mode) */}
      {timelineMode && (
        <>
          <motion.div 
            initial={false}
            className={`
              absolute -left-14 left-8 -translate-x-1/2 top-7
              w-3 h-3 rounded-full shadow-sm
              ${getEventColor(item.type)}
              border-2 border-white
              z-10
            `}
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            initial={false}
            className="absolute -left-6 left-9 top-8 w-4 h-px bg-gray-200 z-10"
            whileHover={{ width: '1.25rem' }}
            transition={{ duration: 0.2 }}
          />
        </>
      )}

      {/* Card */}
      <div 
        className="relative bg-white rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all cursor-pointer"
        onClick={() => onExpand?.(item.id)}
      >
        <div className="flex gap-4">
          {/* Selection Checkbox */}
          {selectionMode && onToggleSelect && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect()
              }}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer mt-0.5 ${
                isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
          )}

          {/* Icon with cost indicator */}
          <div className="relative">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${getIconBgColor()} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <div className="scale-90 md:scale-100">
                {getEventIcon(item.type)}
              </div>
            </div>
            
            {/* Cost Indicator Dot */}
            {getCostColor() && (
              <div 
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getCostColor()} border-2 border-white shadow-sm`} 
                title={getCostLabel() || undefined}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
              
              <Flex gap="xs" align="center" className="flex-shrink-0">
                <time className="text-sm text-gray-900 font-bold whitespace-nowrap">
                  {formatTime(item.timestamp || new Date())}
                </time>
                
                {/* Cost Badge */}
                {cost > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap
                    ${cost < 50 ? 'bg-green-100 text-green-700' : ''}
                    ${cost >= 50 && cost < 200 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${cost >= 200 ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    ${cost.toFixed(0)}
                  </span>
                )}
                
                {/* Menu */}
                {!selectionMode && (onEdit || onDelete) && (
                  <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(!menuOpen)
                      }}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpen(false)
                              onEdit(item)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(false)
                            navigator.clipboard.writeText(item.id)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Flex>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <div className="text-sm text-gray-500 mt-1 leading-relaxed truncate md:whitespace-normal">
                {subtitle}
              </div>
            )}
            
            {/* Data Rows - Using standardized card blocks */}
            {dataRows.length > 0 && (
              <Stack spacing="lg" className="mt-4">
                {/* Separate special rows from regular data rows */}
                {(() => {
                  const primaryMetric = dataRows.find(r => r.label === 'PRIMARY_METRIC')
                  const badges = dataRows.find(r => r.label === 'BADGES')
                  const regularRows = dataRows.filter(r => r.label !== 'PRIMARY_METRIC' && r.label !== 'BADGES')
                  
                  return (
                    <>
                      {/* Primary Metric (full width, centered) */}
                      {primaryMetric && <div>{primaryMetric.value}</div>}
                      
                      {/* Regular Data Grid (2 columns) */}
                      {regularRows.length > 0 && <DataGrid rows={regularRows} columns={2} />}
                      
                      {/* Badges (full width) */}
                      {badges && <div>{badges.value}</div>}
                    </>
                  )
                })()}
              </Stack>
            )}
            
            {/* Notes - Using standardized NoteText block */}
            {item.notes && (
              <div className="mt-4">
                <NoteText text={item.notes} />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
