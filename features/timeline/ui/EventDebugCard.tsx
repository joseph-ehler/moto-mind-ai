/**
 * Event Debug Card Component
 * 
 * Contains Raw Data, Event Metadata, and Change Log sections
 * Separated from main event details for better organization
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Edit2, Clock, User, Database, Code } from 'lucide-react'
import { TimelineEvent } from './VehicleTimeline'
import { StandardCard, StandardCardHeader, StandardCardContent } from '@/components/ui/StandardCard'

interface EventDebugCardProps {
  event: TimelineEvent
}

export function EventDebugCard({ event }: EventDebugCardProps) {
  const [showRawData, setShowRawData] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [showChangeLog, setShowChangeLog] = useState(false)

  return (
    <StandardCard>
      <StandardCardHeader 
        title="Debug Information" 
        subtitle="Technical details and metadata"
      >
        <div className="p-2 rounded-lg bg-gray-600 text-white">
          <Code className="w-5 h-5" />
        </div>
      </StandardCardHeader>

      <StandardCardContent className="space-y-6">
        {/* Raw Data Section */}
        <div>
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                Raw Data (JSON)
              </span>
            </div>
            {showRawData ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showRawData && (
            <div className="mt-3 ml-7">
              <pre className="p-4 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Event Metadata Section */}
        <div>
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                Event Metadata
              </span>
            </div>
            {showMetadata ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showMetadata && (
            <div className="mt-3 ml-7 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event ID:</span>
                    <span className="font-mono text-xs text-gray-900">{event.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">
                      {event.created_at && new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant:</span>
                    <span className="font-mono text-xs text-gray-900">{(event as any).tenant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="font-mono text-xs text-gray-900">{event.vehicle_id}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {event.payload?.metadata && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="text-gray-900">
                          {event.payload.metadata.confidence ? 
                            `${Math.round(event.payload.metadata.confidence * 100)}%` : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing:</span>
                        <span className="text-gray-900">
                          {event.payload.metadata.processing_ms ? 
                            `${event.payload.metadata.processing_ms}ms` : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span className="text-xs text-gray-900">
                          {event.payload.metadata.model_version || 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Log Section */}
        {(event.edited_at || (event as any).edit_history) && (
          <div>
            <button
              onClick={() => setShowChangeLog(!showChangeLog)}
              className="flex items-center justify-between w-full text-left group hover:bg-gray-50 p-3 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Edit2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                  Change Log
                </span>
              </div>
              {showChangeLog ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showChangeLog && (
              <div className="mt-3 ml-7">
                {(event as any).edit_history && Array.isArray((event as any).edit_history) ? (
                  <div className="space-y-4">
                    {(event as any).edit_history.map((edit: any, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 relative">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {edit.reason || 'Event edited'}
                            </h5>
                            <time className="text-xs text-gray-500 font-medium">
                              {new Date(edit.edited_at).toLocaleString()}
                            </time>
                          </div>
                          
                          {edit.edited_by && (
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">by {edit.edited_by}</span>
                            </div>
                          )}
                          
                          {edit.changes && (
                            <div className="space-y-2">
                              {Object.entries(edit.changes).map(([field, change]: [string, any]) => (
                                <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                      {field.replace('_', ' ')}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs line-through">
                                        {typeof change.from === 'object' ? JSON.stringify(change.from) : String(change.from)}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs font-semibold">
                                        {typeof change.to === 'object' ? JSON.stringify(change.to) : String(change.to)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : event.edited_at ? (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-semibold text-gray-900">Event edited</h5>
                        <time className="text-xs text-gray-500 font-medium">
                          {new Date(event.edited_at).toLocaleString()}
                        </time>
                      </div>
                      
                      {event.edit_reason && (
                        <p className="text-sm text-gray-600 italic">"{event.edit_reason}"</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No edit history available</p>
                )}
              </div>
            )}
          </div>
        )}
      </StandardCardContent>
    </StandardCard>
  )
}
