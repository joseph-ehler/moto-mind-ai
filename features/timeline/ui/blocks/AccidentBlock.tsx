// Accident Event Block
// Displays accident report details with damage assessment and other party info

import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { UniversalMetadata } from '../UniversalMetadata'
import { 
  getBlockSize, 
  getFinancialColor, 
  getIdColor,
  getStatusColor 
} from '../utils/tokens'
import { resolveEventDate, formatEventDate } from '../utils/date'

interface AccidentBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function AccidentBlock({ event, onEdit }: AccidentBlockProps) {
  const eventDate = resolveEventDate(event)
  
  // Extract accident-specific data
  const accidentDate = event.payload?.extracted_data?.accident_date || 'Unknown'
  const location = event.payload?.location || 'Unknown'
  const severity = event.payload?.key_facts?.severity || 'unknown'
  const weatherConditions = event.payload?.extracted_data?.weather_conditions || 'Unknown'
  const policeReportNumber = event.payload?.police_report_number || 'N/A'
  const claimNumber = event.payload?.claim_number || 'N/A'
  const damageDescription = event.payload?.damage_description || 'No damage description available'
  const estimatedDamage = event.payload?.estimated_damage
  const otherPartyInfo = event.payload?.other_party_info

  return (
    <div className="space-y-6">
      {/* Accident Header with Icon */}
      <div className="flex items-center gap-3 border-b border-red-200 pb-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Vehicle Accident</h3>
          <p className="text-sm text-gray-500">Collision report & claim details</p>
        </div>
      </div>

      {/* Accident Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Accident Date</div>
          <div className="text-base font-semibold text-gray-900">{accidentDate}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Location</div>
          <div className="text-base font-semibold text-gray-900">{location}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Severity Level</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(severity)}`}>
            {severity}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Weather Conditions</div>
          <div className="text-base font-semibold text-gray-900">{weatherConditions}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Police Report #</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-mono font-semibold ${getIdColor()}`}>
            {policeReportNumber}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-red-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Insurance Claim #</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-mono font-semibold ${getIdColor()}`}>
            {claimNumber}
          </div>
        </div>
      </div>

      {/* Damage Assessment */}
      <div className="bg-white rounded-xl p-5 border border-red-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-900">Damage Assessment</h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</div>
            <p className="text-sm text-gray-900 leading-relaxed">{damageDescription}</p>
          </div>
          
          {estimatedDamage && (
            <div className="pt-3 border-t border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Estimated Repair Cost</span>
                <div className={`inline-flex px-3 py-1 rounded-full text-lg font-bold ${getFinancialColor()}`}>
                  ${estimatedDamage}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other Party Information */}
      {otherPartyInfo && (
        <div className="bg-white rounded-xl p-5 border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Other Party Information</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Driver Name</div>
              <div className="text-sm font-medium text-gray-900">{otherPartyInfo.name || 'Unknown'}</div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Vehicle</div>
              <div className="text-sm font-medium text-gray-900">{otherPartyInfo.vehicle || 'Unknown'}</div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Insurance Company</div>
              <div className="text-sm font-medium text-gray-900">{otherPartyInfo.insurance || 'Unknown'}</div>
            </div>
            
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">License Plate</div>
              <div className="text-sm font-mono font-medium text-gray-900">{otherPartyInfo.license_plate || 'Unknown'}</div>
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
