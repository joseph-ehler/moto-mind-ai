// Universal Metadata Component
// Displays shared metadata for all event types: confidence, source, edit controls

import React from 'react'
import { TimelineEvent } from './VehicleTimeline'
import { 
  getPositiveStatusColor,
  getWarningStatusColor,
  getCriticalStatusColor 
} from './utils/tokens'
import { resolveEventDate, formatEventDate } from './utils/date'
import { shouldShowConfidenceWarning, getConfidenceWarningReason, getOverallConfidence } from './utils/confidence'

interface UniversalMetadataProps {
  event: TimelineEvent
  onEdit?: () => void
  debug?: boolean
}

export function UniversalMetadata({ event, onEdit, debug = false }: UniversalMetadataProps) {
  const confidence = getOverallConfidence(event)
  const hasDocument = event.payload?.source_document_url || event.payload?.source === 'SimplePhotoModal'
  const processingMethod = event.payload?.processing_method || (hasDocument ? 'Document Processing' : 'Manual Entry')
  const showWarning = shouldShowConfidenceWarning(event)
  const eventDate = resolveEventDate(event)
  
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Data Quality</h4>
            <p className="text-xs text-gray-500">Extraction confidence & source</p>
          </div>
        </div>
        
        {/* Confidence Score - Enhanced with Smart Warnings */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Confidence</div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    confidence >= 0.9 ? 'bg-green-500' : 
                    confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(confidence * 100, 5)}%` }}
                />
              </div>
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                confidence >= 0.9 ? getPositiveStatusColor() :
                confidence >= 0.7 ? getWarningStatusColor() : getCriticalStatusColor()
              }`}>
                {Math.round(confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Smart Confidence Warning */}
      {showWarning && (
        <div className={`mb-4 p-3 rounded-lg border ${
          confidence < 0.5 ? 'bg-red-50 border-red-200' :
          confidence < 0.7 ? 'bg-yellow-50 border-yellow-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-medium text-amber-800">
              {getConfidenceWarningReason(event)}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        {/* Processing Method */}
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-medium">{processingMethod}</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}

          {/* Document Source */}
          {hasDocument && event.payload?.source_document_url && (
            <button 
              onClick={() => {
                if (event.payload?.source_document_url) {
                  window.open(event.payload.source_document_url, '_blank')
                }
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Document
            </button>
          )}
          
          {/* Processing Date - Using Smart Date Resolution */}
          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatEventDate(eventDate)}</span>
          </div>
        </div>
      </div>

      {/* Debug Information (only shown when debug=true) */}
      {debug && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>Event ID:</strong> {event.id}</div>
            <div><strong>Type:</strong> {event.type}</div>
            <div><strong>Created:</strong> {event.created_at}</div>
            {event.payload?.processing_metadata && (
              <div><strong>Model:</strong> {event.payload.processing_metadata.model}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
