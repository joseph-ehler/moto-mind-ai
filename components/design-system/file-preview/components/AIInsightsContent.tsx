/**
 * AI Insights Content Component
 * 
 * Pure content component for AI vision data - designed to be used within
 * the Drawer component from the design system overlay layer.
 * 
 * Strategic decision: Separate content from container to allow design system
 * Drawer to handle overlay behavior (focus trap, animations, etc.)
 */

import { Stack } from '../../primitives/Layout'
import { AIVisionData } from '../types'

interface AIInsightsContentProps {
  data: AIVisionData
}

export function AIInsightsContent({ data }: AIInsightsContentProps) {
  return (
    <Stack spacing="md">
      {/* Confidence Badge */}
      {data.confidence && (
        <div className="text-sm text-slate-600 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <span className="font-medium">
              {Math.round(data.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <span>💬</span>
            <span>AI Description</span>
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
            {data.description}
          </p>
        </div>
      )}

      {/* Detected Objects */}
      {data.detectedObjects && data.detectedObjects.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <span>🔍</span>
            <span>Detected Objects</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.detectedObjects.map((obj, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Parts */}
      {data.parts && data.parts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <span>🔧</span>
            <span>Identified Parts</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.parts.map((part, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
              >
                {part}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Damage Detected */}
      {data.damageDetected && data.damageDetected.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
            <span>⚠️</span>
            <span>Damage Detected</span>
          </h4>
          <Stack spacing="xs">
            {data.damageDetected.map((damage, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
              >
                <span className="mt-0.5">•</span>
                <span>{damage}</span>
              </div>
            ))}
          </Stack>
        </div>
      )}

      {/* Extracted Text (OCR) */}
      {data.extractedText && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <span>📝</span>
            <span>Extracted Text</span>
          </h4>
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg font-mono max-h-40 overflow-y-auto whitespace-pre-wrap">
            {data.extractedText}
          </div>
        </div>
      )}

      {/* Processing Info */}
      {data.processedAt && (
        <div className="text-xs text-slate-400 pt-2 border-t">
          Processed {new Date(data.processedAt).toLocaleString()}
        </div>
      )}

      {/* Error */}
      {data.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-red-700 mb-1">Processing Error</h4>
          <p className="text-xs text-red-600">{data.error}</p>
        </div>
      )}
    </Stack>
  )
}
