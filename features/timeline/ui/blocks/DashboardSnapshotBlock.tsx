// Dashboard Snapshot Event Block
// Displays dashboard readings with collapsible technical details

import React, { useState } from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { 
  getBlockSize, 
  getMeasurementColor, 
  getPositiveStatusColor, 
  getWarningStatusColor, 
  getCriticalStatusColor,
  getNeutralStatusColor 
} from '../utils/tokens'
import { UniversalMetadata } from '../UniversalMetadata'

interface DashboardSnapshotBlockProps {
  event: TimelineEvent
  onEdit?: () => void
}

export function DashboardSnapshotBlock({ event, onEdit }: DashboardSnapshotBlockProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  
  // Handle both old and new data formats
  const keyFacts = event.payload?.key_facts || event.payload?.data?.key_facts || {}

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Icon */}
      <div className="flex items-center gap-3 border-b border-purple-200 pb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Dashboard Snapshot</h3>
          <p className="text-sm text-gray-500">Vehicle dashboard readings and status</p>
        </div>
      </div>

      {/* Key Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Odometer Reading */}
        {keyFacts?.odometer_miles && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Odometer Reading</div>
            <div className={`inline-flex rounded-full ${getBlockSize('large')} ${getMeasurementColor()}`}>
              {keyFacts.odometer_miles.toLocaleString()} mi
            </div>
          </div>
        )}

        {/* Fuel Level */}
        {keyFacts?.fuel_level_eighths !== null && keyFacts?.fuel_level_eighths !== undefined && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Fuel Level</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getMeasurementColor()}`}>
              {(() => {
                const eighths = keyFacts.fuel_level_eighths
                const fuelLabels = ['Empty', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞', 'Full']
                const percentage = Math.round((eighths / 8) * 100)
                return `${fuelLabels[eighths]} (${percentage}%)`
              })()}
            </div>
          </div>
        )}

        {/* Warning Lights */}
        {keyFacts?.warning_lights && keyFacts.warning_lights.length > 0 && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 md:col-span-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Warning Lights</div>
            <div className="flex flex-wrap gap-2">
              {keyFacts.warning_lights.map((light: string, index: number) => (
                <div key={index} className={`inline-flex rounded-full ${getBlockSize('small')} ${getCriticalStatusColor()}`}>
                  {light.replace(/_/g, ' ').toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Oil Life */}
        {keyFacts?.oil_life_percent && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Oil Life Remaining</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${
              keyFacts.oil_life_percent > 50 ? getPositiveStatusColor() :
              keyFacts.oil_life_percent > 25 ? getWarningStatusColor() : getCriticalStatusColor()
            }`}>
              {keyFacts.oil_life_percent}%
            </div>
          </div>
        )}

        {/* Coolant Temperature */}
        {keyFacts?.coolant_temp && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Engine Temperature</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${
              keyFacts.coolant_temp.status === 'cold' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              keyFacts.coolant_temp.status === 'normal' ? getPositiveStatusColor() :
              keyFacts.coolant_temp.status === 'hot' ? getCriticalStatusColor() : getNeutralStatusColor()
            }`}>
              {keyFacts.coolant_temp.status.toUpperCase()}
              {keyFacts.coolant_temp.gauge_position && (
                <span className="ml-1 text-xs opacity-75">
                  ({keyFacts.coolant_temp.gauge_position})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Outside Temperature */}
        {keyFacts?.outside_temp && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Outside Temperature</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getNeutralStatusColor()}`}>
              {keyFacts.outside_temp.value}°{keyFacts.outside_temp.unit}
              {keyFacts.outside_temp.display_location && (
                <span className="ml-1 text-xs opacity-75">
                  ({keyFacts.outside_temp.display_location})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Details Accordion */}
      <div className="bg-white rounded-xl border border-gray-100">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Technical Details</h4>
              <p className="text-xs text-gray-500">Processing metadata and quality scores</p>
            </div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showTechnicalDetails && (
          <div className="border-t border-gray-100 p-4 space-y-4">
            {/* Validation Status */}
            {event.payload?.data?.validation && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Extraction Quality</h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Odometer</div>
                    <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      (event.payload.data.validation.odometer_conf || 0) > 0.8 ? getPositiveStatusColor() :
                      (event.payload.data.validation.odometer_conf || 0) > 0.5 ? getWarningStatusColor() : getCriticalStatusColor()
                    }`}>
                      {Math.round((event.payload.data.validation.odometer_conf || 0) * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Fuel Level</div>
                    <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      (event.payload.data.validation.fuel_conf || 0) > 0.8 ? getPositiveStatusColor() :
                      (event.payload.data.validation.fuel_conf || 0) > 0.5 ? getWarningStatusColor() : getCriticalStatusColor()
                    }`}>
                      {Math.round((event.payload.data.validation.fuel_conf || 0) * 100)}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Warning Lights</div>
                    <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      (event.payload.data.validation.lights_conf || 0) > 0.8 ? getPositiveStatusColor() :
                      (event.payload.data.validation.lights_conf || 0) > 0.5 ? getWarningStatusColor() : getCriticalStatusColor()
                    }`}>
                      {Math.round((event.payload.data.validation.lights_conf || 0) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Details */}
            {event.payload?.data?.processing_metadata && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Processing Details</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-600">AI Model</span>
                    <span className="text-xs font-mono text-gray-800">
                      {event.payload.data.processing_metadata.model || 'gpt-4o'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-600">Prompt Version</span>
                    <span className="text-xs font-mono text-gray-800">
                      {event.payload.data.processing_metadata.prompt_hash || 'dashboard_v4'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Data Quality Summary */}
            {event.payload?.data?.confidence !== undefined && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Data Quality</h5>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Overall Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          event.payload.data.confidence > 0.8 ? 'bg-green-500' :
                          event.payload.data.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(event.payload.data.confidence * 100, 5)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {Math.round(event.payload.data.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
