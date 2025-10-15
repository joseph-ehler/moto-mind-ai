// Inspection Event Block
// Displays vehicle inspection details with checklist and results

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

interface InspectionBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function InspectionBlock({ event, onEdit }: InspectionBlockProps) {
  const eventDate = resolveEventDate(event)
  
  // Extract inspection-specific data
  const inspectionType = event.payload?.inspection_type || 'Safety'
  const result = event.payload?.result || 'unknown'
  const station = event.payload?.extracted_data?.inspection_station || 'Unknown Station'
  const inspector = event.payload?.extracted_data?.inspector_name || 'Unknown'
  const certificateNumber = event.payload?.certificate_number || 'N/A'
  const expirationDate = event.payload?.expiration_date || 'Unknown'
  const feeAmount = event.payload?.extracted_data?.fee_amount
  
  const itemsChecked = event.payload?.extracted_data?.items_checked || []
  const itemsPassed = event.payload?.extracted_data?.items_passed || []

  return (
    <div className="space-y-6">
      {/* Inspection Header with Icon */}
      <div className="flex items-center gap-3 border-b border-emerald-200 pb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Vehicle Inspection</h3>
          <p className="text-sm text-gray-500">Official safety & emissions certification</p>
        </div>
      </div>

      {/* Inspection Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inspection Type</div>
          <div className="text-base font-semibold text-gray-900">{inspectionType} Inspection</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Result</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(result)}`}>
            {result.toUpperCase()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inspection Station</div>
          <div className="text-base font-semibold text-gray-900">{station}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inspector</div>
          <div className="text-base font-semibold text-gray-900">{inspector}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Certificate Number</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-mono font-semibold ${getIdColor()}`}>
            {certificateNumber}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expiration Date</div>
          <div className="text-base font-semibold text-gray-900">{expirationDate}</div>
        </div>
      </div>

      {/* Items Checked */}
      {itemsChecked.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-emerald-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Inspection Checklist</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemsChecked.map((item: string, index: number) => {
              const passed = itemsPassed.includes(item)
              return (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    passed ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {passed ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                  <span className={`font-medium capitalize ${
                    passed ? 'text-emerald-900' : 'text-red-900'
                  }`}>
                    {item.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Inspection Fee */}
      {feeAmount && (
        <div className="bg-white rounded-xl p-5 border border-emerald-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Inspection Fee</h4>
          </div>
          <div className={`inline-flex px-4 py-2 rounded-full text-2xl font-bold ${getFinancialColor()}`}>
            ${feeAmount}
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
