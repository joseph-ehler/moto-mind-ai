/**
 * Progress Dots
 * 
 * Compact visual progress indicator.
 * Shows dots for each step (filled = complete/current, empty = future).
 */

'use client'

import { cn } from '@/lib/utils'

type ProgressDotsProps = {
  current: number
  total: number
  className?: string
}

export function ProgressDots({ current, total, className }: ProgressDotsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isComplete = stepNum < current
        const isCurrent = stepNum === current
        const isFuture = stepNum > current
        
        return (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all',
              isComplete && 'w-2 h-2 bg-blue-600',
              isCurrent && 'w-2.5 h-2.5 bg-blue-600 ring-2 ring-blue-200',
              isFuture && 'w-2 h-2 bg-gray-300'
            )}
            aria-label={`Step ${stepNum} of ${total}`}
          />
        )
      })}
    </div>
  )
}
