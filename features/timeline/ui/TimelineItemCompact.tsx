/**
 * Timeline Item Compact - FLEXIBLE VERSION
 * 
 * Exact structure for every card:
 * 1. Header (px-6 py-4) - icon, title, subtitle, time
 * 2. Border divider
 * 3. Body (p-6 space-y-4) - hero, data display, AI summary, badges
 * 
 * Uses new flexible components for data-sparse and data-rich scenarios.
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Edit2, Copy, Trash2, Check, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Share2, Camera } from 'lucide-react'
import { TimelineItem as TimelineItemType } from '@/types/timeline'
import { getEventIcon, getEventColor } from '@/lib/utils/event-icons'
import { formatTime } from '@/lib/utils/date-grouping'
import { getEventRenderer } from '@/features/timeline/ui/event-types/types'
import { calculateQualityScore, getQualityBadgeClasses } from '@/lib/quality-score'
import { DataDisplay } from '@/features/timeline/ui/card-components/DataGrid'
import { AISummary } from '@/features/timeline/ui/card-components/AISummary'
import { SourceImage } from '@/features/timeline/ui/card-components/SourceImage'
import { QualityIndicator } from '@/features/timeline/ui/card-components/QualityIndicator'
import { CollapsibleData } from '@/features/timeline/ui/card-components/CollapsibleData'
import { ExtractionWarning } from '@/features/timeline/ui/card-components/ExtractionWarning'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const renderer = getEventRenderer(item.type)
  const title = renderer.getTitle(item)
  const subtitle = renderer.getSubtitle(item)
  const cardData = renderer.getCardData(item)

  // Calculate quality score using extracted utility
  const qualityResult = calculateQualityScore(item, cardData)
  const qualityScore = qualityResult.score
  const hasPhoto = qualityResult.breakdown.hasPhoto

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

  // Icon colors by type
  const iconBgColors: Record<string, string> = {
    fuel: 'bg-blue-50',
    service: 'bg-blue-50',
    maintenance: 'bg-blue-50',
    odometer: 'bg-gray-50',
    dashboard_warning: cardData.accent === 'warning' ? 'bg-orange-100' : 'bg-red-50',
    default: 'bg-gray-50',
  }
  const iconBg = iconBgColors[item.type] || iconBgColors.default

  const iconColors: Record<string, string> = {
    fuel: 'text-blue-600',
    service: 'text-blue-600',
    maintenance: 'text-blue-600',
    odometer: 'text-gray-600',
    dashboard_warning: cardData.accent === 'warning' ? 'text-orange-600' : 'text-red-600',
    default: 'text-gray-600',
  }
  const iconColor = iconColors[item.type] || iconColors.default

  // Accent styles for warning/danger cards
  const borderClass = cardData.accent === 'warning' 
    ? 'border-l-4 border-l-orange-500 border-y border-r border-gray-200'
    : cardData.accent === 'danger'
    ? 'border-l-4 border-l-red-500 border-y border-r border-gray-200'
    : 'border border-gray-200'

  const headerBg = cardData.accent === 'warning'
    ? 'bg-orange-50/30'
    : cardData.accent === 'danger'
    ? 'bg-red-50/30'
    : ''

  const dividerColor = cardData.accent === 'warning'
    ? 'border-orange-100'
    : cardData.accent === 'danger'
    ? 'border-red-100'
    : 'border-gray-100'

  const subtitleColor = cardData.accent === 'warning'
    ? 'text-orange-600 font-medium'
    : cardData.accent === 'danger'
    ? 'text-red-600 font-medium'
    : 'text-gray-500'

  return (
    <motion.div 
      className="relative group"
      initial={false}
      whileHover={{ scale: 1.005, y: -1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Timeline dot */}
      {timelineMode && (
        <>
          <div className={`absolute -left-6 left-9 top-7 w-3 h-3 rounded-full shadow-sm border-2 border-white z-10 ${getEventColor(item.type)}`} />
          <div className="absolute -left-6 left-9 top-8 w-4 h-px bg-gray-200 z-10" />
        </>
      )}

      {/* CARD - Same shell for every type */}
      <div 
        className={`bg-white rounded-xl ${borderClass} overflow-hidden hover:shadow-md transition-shadow ${!isExpanded ? 'cursor-pointer' : ''}`} 
        onClick={(e) => {
          // Only toggle if clicking on card background, not on buttons
          if (!isExpanded && e.target === e.currentTarget) {
            setIsExpanded(true)
          }
        }}
      >
        
        {/* HEADER - Always px-6 py-4 */}
        <div className={`px-6 py-4 flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-3">
            {/* Selection checkbox */}
            {selectionMode && onToggleSelect && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleSelect()
                }}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            )}
            
            {/* Icon - w-10 h-10 */}
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <div className={iconColor}>{getEventIcon(item.type)}</div>
            </div>
            
            {/* Title + subtitle + quality score */}
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-900">{title}</div>
                {/* Quality score badge (color-coded chip) */}
                <div 
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getQualityBadgeClasses(qualityScore)}`}
                  title={`Data quality: ${qualityScore}% - ${qualityResult.label}`}
                >
                  {qualityScore}%
                </div>
                {/* Photo missing indicator */}
                {!hasPhoto && (
                  <div className="flex items-center gap-1 text-red-500" title="No photo attached">
                    <Camera className="w-4 h-4" />
                    <span className="text-xs font-semibold">[!]</span>
                  </div>
                )}
              </div>
              {subtitle && <div className={`text-xs ${subtitleColor}`}>{subtitle}</div>}
              {!hasPhoto && <div className="text-xs text-gray-500 italic">Manual entry</div>}
            </div>
          </div>
          
          {/* Time + menu */}
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {formatTime(item.timestamp || new Date())}
            </div>
            
            {!selectionMode && (onEdit || onDelete) && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(!menuOpen)
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {onEdit && (
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(item); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Edit2 className="w-4 h-4" /><span>Edit</span>
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigator.clipboard.writeText(item.id); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Copy className="w-4 h-4" /><span>Copy ID</span>
                    </button>
                    {onDelete && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(item); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" /><span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DIVIDER - Always present */}
        <div className={`border-t ${dividerColor}`} />

        {/* BODY - Conditional rendering based on expanded state */}
        <div className="p-6 space-y-4">
          
          {/* COLLAPSED STATE - Show preview */}
          {!isExpanded && (
            <>
              {/* Hero metric only */}
              {cardData.hero && (
                <div className="text-center py-4 px-6 bg-gray-50 rounded-lg">
                  <div className="text-4xl font-bold text-gray-900">{cardData.hero.value}</div>
                  {cardData.hero.subtext && (
                    <div className="text-sm text-gray-500 mt-2">{cardData.hero.subtext}</div>
                  )}
                </div>
              )}
              
              {/* AI Summary (key insight) */}
              {cardData.aiSummary && (
                <AISummary
                  summary={cardData.aiSummary.text}
                  confidence={cardData.aiSummary.confidence}
                />
              )}
              
              {/* Photo nudge for manual entries */}
              {!hasPhoto && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900">Add receipt photo for proof?</div>
                    <div className="text-xs text-blue-700">Photos improve tracking and quality score</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Open photo upload
                      console.log('Upload photo for', item.id)
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              )}
              
              {/* Preview footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {cardData.data.length > 0 && <span>📊 {cardData.data.length} field{cardData.data.length !== 1 ? 's' : ''}</span>}
                  {cardData.data.length > 0 && cardData.badges && cardData.badges.length > 0 && <span className="mx-2">•</span>}
                  {cardData.badges && cardData.badges.length > 0 && <span>🎯 {cardData.badges.length} badge{cardData.badges.length !== 1 ? 's' : ''}</span>}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(true)
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Show more
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          
          {/* EXPANDED STATE - Show everything */}
          {isExpanded && (
            <>
          
          {/* ELITE: Source image */}
          {cardData.sourceImage && (
            <SourceImage
              url={cardData.sourceImage.url}
              thumbnail={cardData.sourceImage.thumbnail}
              alt={cardData.sourceImage.alt}
            />
          )}
          
          {/* HERO METRIC - In gray container */}
          {cardData.hero && (
            <div className="text-center py-4 px-6 bg-gray-50 rounded-lg">
              <div className="text-4xl font-bold text-gray-900">{cardData.hero.value}</div>
              {cardData.hero.subtext && (
                <div className="text-sm text-gray-500 mt-2">{cardData.hero.subtext}</div>
              )}
            </div>
          )}

          {/* ELITE: Warnings */}
          {cardData.warnings && cardData.warnings.length > 0 && (
            <>
              {cardData.warnings.map((warning, idx) => (
                <ExtractionWarning
                  key={idx}
                  type={warning.type}
                  message={warning.message}
                  action={warning.action}
                />
              ))}
            </>
          )}

          {/* AI SUMMARY - Positioned above data for context */}
          {cardData.aiSummary && (
            <AISummary
              summary={cardData.aiSummary.text}
              confidence={cardData.aiSummary.confidence}
            />
          )}

          {/* DATA - Flexible display with dividers */}
          {cardData.collapsible ? (
            // ELITE: Progressive disclosure
            <CollapsibleData
              summary={cardData.collapsible.summary}
              details={cardData.collapsible.details}
              compact={cardData.compact}
            />
          ) : cardData.data.length > 0 ? (
            (() => {
              // Check for special types (legacy warning events)
              const warningBox = cardData.data.find(d => d.label === 'WARNING_BOX')
              const systemsList = cardData.data.find(d => d.label === 'SYSTEMS_LIST')
              const regularData = cardData.data.filter(d => !['WARNING_BOX', 'SYSTEMS_LIST', 'CTA_BUTTON'].includes(d.label))

              return (
                <>
                  {/* Warning box (red) - Legacy support */}
                  {warningBox && (() => {
                    const parsed = JSON.parse(String(warningBox.value))
                    return (
                      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-red-900">{parsed.title}</div>
                          <div className="text-xs text-red-700 mt-1">{parsed.description}</div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Systems list (chips) - Legacy support */}
                  {systemsList && (() => {
                    const systems = JSON.parse(String(systemsList.value))
                    return (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500 mb-2">Affected systems</div>
                        <div className="flex flex-wrap gap-2">
                          {systems.map((sys: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700 border border-gray-200">
                              {sys}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Regular data - NEW flexible display */}
                  {regularData.length > 0 && (
                    <DataDisplay
                      items={regularData}
                      compact={cardData.compact}
                    />
                  )}
                </>
              )
            })()
          ) : null}

          {/* BADGES - Only when present */}
          {cardData.badges && cardData.badges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cardData.badges.map((badge, idx) => {
                const variants = {
                  success: 'bg-green-50 border-green-200 text-green-700',
                  warning: 'bg-orange-50 border-orange-200 text-orange-700',
                  danger: 'bg-red-50 border-red-200 text-red-700',
                  info: 'bg-blue-50 border-blue-200 text-blue-700',
                }
                return (
                  <div key={idx} className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${variants[badge.variant]}`}>
                    {badge.icon}
                    <span>{badge.text}</span>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* QUICK ACTIONS BAR - Only in expanded state */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Navigate to detail page
                window.location.href = `/events/${item.id}`
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </button>
            
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(item)
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Implement share
                console.log('Share', item.id)
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            
            <div className="flex-1" />
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(false)
              }}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-700"
            >
              Show less
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          
          </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
