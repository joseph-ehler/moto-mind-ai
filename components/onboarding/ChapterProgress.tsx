/**
 * Chapter Progress
 * 
 * Adaptive progress bars for wizard chapters/sections.
 * Each bar represents a chapter, fills based on progress.
 * Handles 1-10+ chapters elegantly.
 */

'use client'

import { cn } from '@/lib/utils'

export type Chapter = {
  id: string
  name: string
  stepCount: number
  currentStep?: number // 1-indexed, undefined if not started
}

type ChapterProgressProps = {
  chapters: Chapter[]
  currentChapterId: string
  showChapterName?: boolean
  className?: string
}

export function ChapterProgress({
  chapters,
  currentChapterId,
  showChapterName = false,
  className
}: ChapterProgressProps) {
  const currentChapterIndex = chapters.findIndex((c) => c.id === currentChapterId)
  const currentChapter = chapters[currentChapterIndex]
  
  // Calculate bar widths: active expands to fill, others are collapsed
  const getBarWidth = (isActive: boolean) => {
    const count = chapters.length
    
    if (isActive) {
      // Active chapter expands to fill available space
      return 'flex-1'
    } else {
      // Completed/future chapters are very compact
      if (count === 1) return 'w-32' // Single chapter (won't be used with flex-1)
      if (count === 2) return 'w-10' // 40px
      if (count === 3) return 'w-8' // 32px
      if (count === 4) return 'w-6' // 24px
      return 'w-5' // 20px for 5+ chapters
    }
  }
  
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      {/* Chapter name (optional, subtle) */}
      {showChapterName && currentChapter && (
        <p className="text-xs font-medium text-gray-500 truncate max-w-xs">
          {currentChapter.name}
        </p>
      )}
      
      {/* Progress bars */}
      <div className="flex items-center gap-2 w-full">
        {chapters.map((chapter, index) => {
          const isCompleted = index < currentChapterIndex
          const isCurrent = index === currentChapterIndex
          const isFuture = index > currentChapterIndex
          
          // Calculate fill percentage for current chapter
          let fillPercent = 0
          if (isCompleted) {
            fillPercent = 100
          } else if (isCurrent && chapter.currentStep) {
            fillPercent = (chapter.currentStep / chapter.stepCount) * 100
          }
          
          return (
            <div
              key={chapter.id}
              className={cn(
                'h-1.5 rounded-full overflow-hidden',
                'transition-all duration-300 ease-in-out', // Smooth width transition
                getBarWidth(isCurrent),
                isCurrent && 'ring-1 ring-blue-200'
              )}
              style={{
                backgroundColor: isFuture ? '#e5e7eb' : '#dbeafe', // gray or blue-light
              }}
              aria-label={`${chapter.name}: ${Math.round(fillPercent)}% complete`}
              role="progressbar"
              aria-valuenow={fillPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {/* Fill indicator */}
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Utility: Calculate which chapter a step belongs to
 */
export function getChapterForStep(
  stepIndex: number,
  chapterStepCounts: number[]
): { chapterIndex: number; stepInChapter: number } {
  let accumulated = 0
  
  for (let i = 0; i < chapterStepCounts.length; i++) {
    const chapterStepCount = chapterStepCounts[i]
    if (stepIndex < accumulated + chapterStepCount) {
      return {
        chapterIndex: i,
        stepInChapter: stepIndex - accumulated + 1 // 1-indexed
      }
    }
    accumulated += chapterStepCount
  }
  
  // Fallback to last chapter
  return {
    chapterIndex: chapterStepCounts.length - 1,
    stepInChapter: chapterStepCounts[chapterStepCounts.length - 1]
  }
}
