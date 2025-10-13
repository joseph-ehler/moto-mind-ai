/**
 * Quality Indicator Component
 * 
 * Shows data extraction confidence at-a-glance.
 * Builds user trust by being transparent about AI accuracy.
 */

import { Info } from 'lucide-react'

type QualityLevel = 'high' | 'medium' | 'low'

interface QualityIndicatorProps {
  level: QualityLevel
  /** Optional: Detailed info on hover */
  details?: {
    fieldsExtracted: number
    fieldsMissing: number
    imageQuality: number  // 0-100
  }
  /** Visual style: 'dots' (subtle) or 'badge' (prominent) */
  variant?: 'dots' | 'badge'
}

export function QualityIndicator({ 
  level, 
  details,
  variant = 'dots' 
}: QualityIndicatorProps) {
  
  // Dot indicator (subtle, in header)
  if (variant === 'dots') {
    const dots = level === 'high' ? 5 : level === 'medium' ? 3 : 1
    const totalDots = 5
    
    return (
      <div 
        className="flex items-center gap-0.5 group relative"
        title={details ? getTooltipText(details) : `${level} quality`}
      >
        {Array.from({ length: totalDots }).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full ${
              idx < dots
                ? level === 'high'
                  ? 'bg-green-500'
                  : level === 'medium'
                  ? 'bg-orange-400'
                  : 'bg-red-400'
                : 'bg-gray-200'
            }`}
          />
        ))}
        
        {details && (
          <Info className="w-3 h-3 text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    )
  }
  
  // Badge indicator (prominent, below title)
  const badgeStyles = {
    high: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200',
    low: 'bg-red-50 text-red-700 border-red-200'
  }
  
  const badgeLabels = {
    high: 'High Quality',
    medium: 'Medium Quality',
    low: 'Low Quality'
  }
  
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-semibold ${badgeStyles[level]}`}
      title={details ? getTooltipText(details) : undefined}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${
        level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-orange-500' : 'bg-red-500'
      }`} />
      {badgeLabels[level]}
    </div>
  )
}

function getTooltipText(details: { fieldsExtracted: number; fieldsMissing: number; imageQuality: number }): string {
  return `${details.fieldsExtracted} fields extracted | ${details.fieldsMissing} missing | Image quality: ${details.imageQuality}%`
}
