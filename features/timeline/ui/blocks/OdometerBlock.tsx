// Odometer Event Block
// Displays odometer reading with mileage tracking and trip information

import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { UniversalMetadata } from '../UniversalMetadata'
import { 
  getBlockSize, 
  getMeasurementColor,
  getPositiveStatusColor 
} from '../utils/tokens'
import { resolveEventDate, formatEventDate } from '../utils/date'

interface OdometerBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function OdometerBlock({ event, onEdit }: OdometerBlockProps) {
  const eventDate = resolveEventDate(event)
  
  // Extract odometer-specific data
  const miles = event.miles || 
               event.payload?.miles || 
               event.payload?.odometer_miles ||
               event.payload?.extracted_data?.odometer_miles
  
  const displayType = event.payload?.display_type || 'Digital'
  const units = event.payload?.units || 'Miles'
  
  const tripMeters = event.payload?.trip_meters || {}
  const tripA = tripMeters.trip_a
  const tripB = tripMeters.trip_b

  return (
    <div className="space-y-6">
      {/* Odometer Header with Icon */}
      <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Odometer Reading</h3>
          <p className="text-sm text-gray-500">Vehicle mileage tracking</p>
        </div>
      </div>

      {/* Main Odometer Display */}
      {miles && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100">
          <div className="text-center">
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Current Mileage</div>
            <div className="text-4xl font-bold text-indigo-900 mb-2">
              {miles.toLocaleString()}
            </div>
            <div className="text-sm text-indigo-600 font-medium">{units}</div>
          </div>
        </div>
      )}

      {/* Reading Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Reading Date</div>
          <div className="text-base font-semibold text-gray-900">{formatEventDate(eventDate)}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Display Type</div>
          <div className="text-base font-semibold text-gray-900">{displayType}</div>
        </div>
      </div>

      {/* Trip Meters */}
      {(tripA || tripB) && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Trip Meters</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tripA && (
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <span className="text-indigo-700 font-medium">Trip A</span>
                <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getMeasurementColor()}`}>
                  {tripA.toLocaleString()} mi
                </div>
              </div>
            )}
            
            {tripB && (
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <span className="text-indigo-700 font-medium">Trip B</span>
                <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getMeasurementColor()}`}>
                  {tripB.toLocaleString()} mi
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reading Quality */}
      {event.payload?.confidence && (
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Reading Quality</h4>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
            <span className="text-green-700 font-medium">Confidence Score</span>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getPositiveStatusColor()}`}>
              {Math.round(event.payload.confidence * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Universal Metadata */}
      <UniversalMetadata 
        event={event} 
        onEdit={onEdit ? () => onEdit({}) : undefined} 
      />
    </div>
  )
}
