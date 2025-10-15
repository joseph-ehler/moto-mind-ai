/**
 * Event Card Shell - ELITE TIER VERSION
 * 
 * Enhanced with:
 * - Quality indicators
 * - Quick actions
 * - Loading states
 * - Error states
 */

import { ReactNode } from 'react'
import { Edit2, Flag, Share2 } from 'lucide-react'
import { QualityIndicator } from './QualityIndicator'
import { EventCardSkeleton } from './EventCardSkeleton'

type QualityLevel = 'high' | 'medium' | 'low'

interface EventCardProps {
  /** Icon component (already sized) */
  icon: ReactNode
  
  /** Icon background color */
  iconBg: string
  
  /** Icon color */
  iconColor: string
  
  /** Card title */
  title: string
  
  /** Subtitle (gray text below title) */
  subtitle: string | null
  
  /** Time string */
  time: string
  
  /** Left border accent */
  variant?: 'normal' | 'warning' | 'error'
  
  /** Card body content */
  children: ReactNode
  
  /** Click handler */
  onClick?: () => void
  
  // NEW: Elite features
  /** Data extraction quality */
  quality?: {
    level: QualityLevel
    details?: {
      fieldsExtracted: number
      fieldsMissing: number
      imageQuality: number
    }
  }
  
  /** Quick actions */
  actions?: {
    onEdit?: () => void
    onFlag?: () => void
    onShare?: () => void
  }
  
  /** Loading state */
  loading?: boolean
  
  /** Error state */
  error?: string
}

export function EventCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  time,
  variant = 'normal',
  children,
  onClick,
  quality,
  actions,
  loading,
  error
}: EventCardProps) {
  
  // Loading state
  if (loading) {
    return <EventCardSkeleton />
  }
  
  // Border styles based on variant
  const borderClass = variant === 'warning'
    ? 'border-l-4 border-l-orange-500 border-y border-r border-gray-200'
    : variant === 'error'
    ? 'border-l-4 border-l-red-500 border-y border-r border-gray-200'
    : 'border border-gray-200'
  
  // Header background tint
  const headerBg = variant === 'warning'
    ? 'bg-orange-50/30'
    : variant === 'error'
    ? 'bg-red-50/30'
    : ''
  
  // Divider color
  const dividerColor = variant === 'warning'
    ? 'border-orange-100'
    : variant === 'error'
    ? 'border-red-100'
    : 'border-gray-100'

  return (
    <div 
      className={`bg-white rounded-xl ${borderClass} overflow-hidden hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* HEADER */}
      <div className={`px-6 py-4 ${headerBg}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {/* Icon circle */}
            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <div className={iconColor}>
                {icon}
              </div>
            </div>
            
            {/* Text */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                {quality && (
                  <QualityIndicator 
                    level={quality.level} 
                    details={quality.details}
                    variant="dots"
                  />
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          
          {/* Time + Actions */}
          <div className="flex items-center gap-2">
            {actions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {actions.onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.onEdit?.()
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
                {actions.onFlag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.onFlag?.()
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Flag for review"
                  >
                    <Flag className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
                {actions.onShare && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      actions.onShare?.()
                    }}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                )}
              </div>
            )}
            <time className="text-xs font-semibold text-gray-600 flex-shrink-0">
              {time}
            </time>
          </div>
        </div>
      </div>
      
      {/* DIVIDER */}
      <div className={`border-t ${dividerColor}`} />
      
      {/* BODY */}
      <div className="p-6 space-y-4">
        {error ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <p className="text-xs text-gray-500">Try uploading the image again</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
