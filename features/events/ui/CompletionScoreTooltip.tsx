'use client'

import { useState } from 'react'
import { Info, Check, X, AlertCircle } from 'lucide-react'

interface ScoreBreakdown {
  category: string
  weight: number
  complete: boolean
  reason?: string
}

interface CompletionScoreTooltipProps {
  score: number
  breakdown: ScoreBreakdown[]
}

export function CompletionScoreTooltip({ score, breakdown }: CompletionScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const completedItems = breakdown.filter(item => item.complete)
  const missingItems = breakdown.filter(item => !item.complete)

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-help"
      >
        <span className="text-xs font-bold">{score}%</span>
        <Info className="w-3 h-3" />
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div 
          className="absolute z-50 left-1/2 transform -translate-x-1/2 mt-2 w-72 bg-white rounded-lg shadow-xl border-2 border-gray-200 overflow-hidden"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">
                Completion Breakdown
              </h4>
              <div className="text-xl font-bold text-blue-600">
                {score}%
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
            {/* Completed items */}
            {completedItems.length > 0 && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Complete ({completedItems.length})
                </div>
                <div className="space-y-1">
                  {completedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 px-2 py-1.5 bg-green-50 rounded text-xs border border-green-100"
                    >
                      <div className="flex items-start gap-1.5 flex-1">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item.category}</span>
                      </div>
                      <span className="text-green-700 font-semibold">+{item.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing items */}
            {missingItems.length > 0 && (
              <div>
                <div className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Missing ({missingItems.length})
                </div>
                <div className="space-y-1">
                  {missingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 px-2 py-1.5 bg-amber-50 rounded text-xs border border-amber-100"
                    >
                      <div className="flex items-start gap-1.5 flex-1">
                        <X className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-gray-700">{item.category}</div>
                          {item.reason && (
                            <div className="text-amber-600 text-[10px] mt-0.5">
                              {item.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-amber-700 font-semibold">-{item.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer tip */}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 text-center">
              💡 Complete data enables better insights and analytics
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to calculate completion score
export function calculateCompletionScore(event: {
  receipt_image_url?: string | null
  total_amount?: number | null
  gallons?: number | null
  vendor?: string | null
  geocoded_lat?: number | null
  date?: string | null
  miles?: number | null
  notes?: string | null
}): { score: number; breakdown: ScoreBreakdown[] } {
  const breakdown: ScoreBreakdown[] = [
    {
      category: 'Receipt photo',
      weight: 15,
      complete: !!event.receipt_image_url,
      reason: !event.receipt_image_url ? 'No receipt photo uploaded' : undefined
    },
    {
      category: 'Financial data',
      weight: 25,
      complete: !!(event.total_amount && event.gallons),
      reason: !(event.total_amount && event.gallons) ? 'Missing cost or gallons' : undefined
    },
    {
      category: 'Location verified',
      weight: 20,
      complete: !!(event.vendor && event.geocoded_lat),
      reason: !(event.vendor && event.geocoded_lat) ? 'Location not verified' : undefined
    },
    {
      category: 'Date & time',
      weight: 15,
      complete: !!event.date,
      reason: !event.date ? 'Date not recorded' : undefined
    },
    {
      category: 'Odometer reading',
      weight: 15,
      complete: !!event.miles,
      reason: !event.miles ? 'Enables MPG tracking' : undefined
    },
    {
      category: 'Notes',
      weight: 10,
      complete: !!(event.notes && event.notes.trim().length > 0),
      reason: !(event.notes && event.notes.trim().length > 0) ? 'Add context for future reference' : undefined
    }
  ]

  const score = breakdown
    .filter(item => item.complete)
    .reduce((sum, item) => sum + item.weight, 0)

  return { score, breakdown }
}
