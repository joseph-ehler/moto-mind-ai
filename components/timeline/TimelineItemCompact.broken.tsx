/**
 * Timeline Item Compact - REDESIGNED
 * 
 * Matches the clean card specification:
 * - Compact header (10h icon, small text, consistent px-6 py-4)
 * - Hero section (if metric exists - px-6 py-6, gradient bg)
 * - Data section (clean 2-col grid - px-6 py-4)
 * - Badge section (only when present - px-6 pb-4)
 * - Border-b between sections
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Edit2, Copy, Trash2, Check } from 'lucide-react'
import { TimelineItem as TimelineItemType } from '@/types/timeline'
import { getEventIcon, getEventColor } from '@/lib/utils/event-icons'
import { formatTime } from '@/lib/utils/date-grouping'
import { getEventRenderer } from './event-types'

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

  // Get renderer data
  const renderer = getEventRenderer(item.type)
  const title = renderer.getTitle(item)
  const subtitle = renderer.getSubtitle(item)
  const cardData = renderer.getCardData(item)

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

  // Accent colors for warning/danger cards
  const getAccentBorder = () => {
    if (cardData.accent === 'warning') return 'border-l-4 border-l-orange-500'
    if (cardData.accent === 'danger') return 'border-l-4 border-l-red-500'
    return ''
  }

  const getAccentHeaderBg = () => {
    if (cardData.accent === 'warning') return 'bg-orange-50/50'
    if (cardData.accent === 'danger') return 'bg-red-50/50'
    return ''
  }

  const getAccentBorderColor = () => {
    if (cardData.accent === 'warning') return 'border-orange-100'
    if (cardData.accent === 'danger') return 'border-red-100'
    return 'border-gray-100'
  }

  // Icon background colors
  const iconBgColorMap: Record<string, string> = {
    fuel: 'bg-blue-50',
    service: 'bg-blue-50',
    maintenance: 'bg-blue-50',
    odometer: 'bg-gray-50',
    dashboard_warning: cardData.accent === 'warning' ? 'bg-orange-100' : 'bg-red-50',
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
  const iconBgColor = iconBgColorMap[item.type] || 'bg-gray-50'

  const iconColorMap: Record<string, string> = {
    fuel: 'text-blue-600',
    service: 'text-blue-600',
    maintenance: 'text-blue-600',
    odometer: 'text-gray-600',
    dashboard_warning: cardData.accent === 'warning' ? 'text-orange-600' : 'text-red-600',
    dashboard_snapshot: 'text-blue-600',
    tire_tread: 'text-orange-600',
    tire_pressure: 'text-orange-600',
    damage: 'text-orange-600',
    parking: 'text-gray-600',
    document: 'text-green-600',
    inspection: 'text-green-600',
    recall: 'text-red-600',
    manual: 'text-gray-600',
  }
  const iconColor = iconColorMap[item.type] || 'text-gray-600'

  return (
    <motion.div 
      className="relative group"
      initial={false}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Timeline dot (if in timeline mode) */}
      {timelineMode && (
        <>
          <div 
            className={`absolute -left-6 left-9 top-7 w-3 h-3 rounded-full shadow-sm border-2 border-white z-10 ${getEventColor(item.type)}`}
          />
          <div className="absolute -left-6 left-9 top-8 w-4 h-px bg-gray-200 z-10" />
        </>
      )}

      {/* Card - matches spec exactly */}
      <div 
        className={`
          bg-white rounded-xl border border-gray-200 overflow-hidden
          ${getAccentBorder()}
          hover:shadow-md transition-shadow cursor-pointer
        `}
        onClick={() => onExpand?.(item.id)}
      >
        {/* HEADER - Compact, always px-6 py-4 */}
        <div className={`
          px-6 py-4 flex items-center justify-between border-b ${getAccentBorderColor()}
          ${getAccentHeaderBg()}
        `}>
          <div className="flex items-center gap-3">
            {/* Selection checkbox */}
            {selectionMode && onToggleSelect && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect()
                }}
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer
                  ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'}
                `}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            )}
            
            {/* Icon - always 10h (w-10 h-10) */}
            <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
              <div className={iconColor}>
                {getEventIcon(item.type)}
              </div>
            </div>
            
            {/* Title + subtitle */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
              {subtitle && (
                <p className={`
                  text-xs font-medium mt-0.5
                  ${cardData.accent === 'warning' ? 'text-orange-600' : cardData.accent === 'danger' ? 'text-red-600' : 'text-gray-500'}
                `}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {/* Right side - time + menu */}
          <div className="flex items-center gap-2">
            <time className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {formatTime(item.timestamp || new Date())}
            </time>
            
            {/* Menu */}
            {!selectionMode && (onEdit || onDelete) && (
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(!menuOpen)
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
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
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
          </div>
        </div>

        {/* HERO METRIC - If exists, px-6 py-6, gradient bg */}
        {cardData.hero && (
          <div className="px-6 py-6 text-center bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
            <div className="text-4xl font-bold text-gray-900">{cardData.hero.value}</div>
            {cardData.hero.subtext && (
              <div className="text-sm text-gray-500 mt-1">{cardData.hero.subtext}</div>
            )}
          </div>
        )}

        {/* DATA - Clean 2-col grid, px-6 py-4 */}
        {cardData.data.length > 0 && (
          <div className={`px-6 py-4 grid grid-cols-2 gap-4 ${cardData.badges ? 'border-b border-gray-100' : ''}`}>
            {cardData.data.map((item, idx) => (
              <div key={idx}>
                <div className="text-xs text-gray-500">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* BADGES - Only when present, px-6 pb-4 */}
        {cardData.badges && cardData.badges.length > 0 && (
          <div className="px-6 pb-4">
            {cardData.badges.map((badge, idx) => {
              const variantStyles = {
                success: 'bg-green-50 border-green-200 text-green-700',
                warning: 'bg-orange-50 border-orange-200 text-orange-700',
                danger: 'bg-red-50 border-red-200 text-red-700',
                info: 'bg-blue-50 border-blue-200 text-blue-700',
              }
              
              return (
                <div
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${variantStyles[badge.variant]}`}
                >
                  {badge.icon}
                  <span>{badge.text}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Notes - if present */}
        {item.notes && (
          <div className="px-6 pb-4 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600 italic">"{item.notes}"</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
