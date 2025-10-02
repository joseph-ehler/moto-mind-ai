// Insurance Event Block
// Displays insurance policy details with coverage and premium breakdown

import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { UniversalMetadata } from '../UniversalMetadata'
import { 
  getBlockSize, 
  getFinancialColor, 
  getIdColor 
} from '../utils/tokens'
import { resolveEventDate, formatEventDate } from '../utils/date'

interface InsuranceBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function InsuranceBlock({ event, onEdit }: InsuranceBlockProps) {
  const eventDate = resolveEventDate(event)
  
  // Extract insurance-specific data
  const company = event.payload?.insurance_company || 'Unknown Company'
  const policyNumber = event.payload?.policy_number || 'N/A'
  const agentName = event.payload?.extracted_data?.agent_name || 'Unknown'
  const agentPhone = event.payload?.extracted_data?.agent_phone || 'Unknown'
  const effectiveDate = event.payload?.effective_date || 'Unknown'
  const expirationDate = event.payload?.expiration_date || 'Unknown'
  
  const premiumBreakdown = event.payload?.extracted_data?.premium_breakdown
  const coverageDetails = event.payload?.extracted_data?.coverage_details

  return (
    <div className="space-y-6">
      {/* Insurance Header with Icon */}
      <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Auto Insurance</h3>
          <p className="text-sm text-gray-500">Policy details & coverage information</p>
        </div>
      </div>

      {/* Insurance Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Insurance Company</div>
          <div className="text-base font-semibold text-gray-900">{company}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Policy Number</div>
          <div className={`inline-flex px-3 py-1 rounded-full text-sm font-mono font-semibold ${getIdColor()}`}>
            {policyNumber}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Agent Name</div>
          <div className="text-base font-semibold text-gray-900">{agentName}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Agent Phone</div>
          <div className="text-base font-mono font-semibold text-gray-900">{agentPhone}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Effective Date</div>
          <div className="text-base font-semibold text-gray-900">{effectiveDate}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-indigo-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Expiration Date</div>
          <div className="text-base font-semibold text-gray-900">{expirationDate}</div>
        </div>
      </div>

      {/* Premium Breakdown */}
      {premiumBreakdown && (
        <div className="bg-white rounded-xl p-5 border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Premium Breakdown</h4>
          </div>
          
          <div className="space-y-3">
            {Object.entries(premiumBreakdown).map(([type, amount]: [string, any]) => (
              <div key={type} className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium capitalize">{type.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-900">${amount}</span>
              </div>
            ))}
            
            {event.total_amount && (
              <div className="flex justify-between items-center py-3 border-t border-indigo-100">
                <span className="text-lg font-semibold text-gray-900">Total Annual Premium</span>
                <div className={`inline-flex px-3 py-1 rounded-full text-xl font-bold ${getFinancialColor()}`}>
                  ${event.total_amount}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coverage Details */}
      {coverageDetails && (
        <div className="bg-white rounded-xl p-5 border border-indigo-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Coverage Details</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(coverageDetails).map(([type, details]: [string, any]) => (
              <div key={type} className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                  {type.replace('_', ' ')}
                </div>
                <div className="space-y-1">
                  {typeof details === 'object' ? (
                    Object.entries(details).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                        <span className="font-semibold text-gray-900">{value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{details}</div>
                  )}
                </div>
              </div>
            ))}
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
