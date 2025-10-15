/**
 * AI Summary Component
 * 
 * Displays AI-generated insights from OpenAI Vision analysis.
 * 
 * Features:
 * - Subtle visual treatment (not distracting)
 * - Sparkle icon to indicate AI
 * - Optional, only shows when content exists
 */

import { Sparkles } from 'lucide-react'

interface AISummaryProps {
  /** AI-generated summary text */
  summary: string
  /** Optional: Confidence level */
  confidence?: 'high' | 'medium' | 'low'
}

export function AISummary({ summary, confidence }: AISummaryProps) {
  if (!summary) return null
  
  // Subtle indicator based on confidence
  const confidenceStyle = confidence === 'low' 
    ? 'border-amber-200 bg-amber-50/30' 
    : 'border-blue-200 bg-blue-50/30'
  
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${confidenceStyle}`}>
      <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 leading-relaxed">
          {summary}
        </p>
        {confidence === 'low' && (
          <p className="text-[10px] text-amber-600 mt-1 font-medium">
            Low confidence - verify details
          </p>
        )}
      </div>
    </div>
  )
}
