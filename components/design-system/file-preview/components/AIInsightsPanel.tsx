import { X } from 'lucide-react'
import { AIVisionData, PreviewFile } from '../types'

interface AIInsightsPanelProps {
  data: AIVisionData
  file: PreviewFile
  onClose: () => void
}

export function AIInsightsPanel({ data, file, onClose }: AIInsightsPanelProps) {
  return (
    <>
      {/* Mobile: Full screen overlay */}
      <div 
        className="sm:hidden fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed sm:absolute inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:bottom-0 w-full sm:w-80 bg-white sm:border-l shadow-xl overflow-y-auto z-50 sm:z-20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-50 to-blue-50 border-b p-3 sm:p-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🤖</span>
                <h3 className="font-semibold text-base sm:text-lg">AI Insights</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data.confidence && `${Math.round(data.confidence * 100)}% confidence`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-1 hover:bg-white/50 active:bg-white/70 rounded transition-colors touch-manipulation"
              aria-label="Close AI Insights"
            >
              <X className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 pb-safe">
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
            <ul className="space-y-2">
              {data.damageDetected.map((damage, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
                >
                  <span className="mt-0.5">•</span>
                  <span>{damage}</span>
                </li>
              ))}
            </ul>
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
        </div>
      </div>
    </>
  )
}
