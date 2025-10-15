// Repair Event Block
// Displays repair details with urgency indicators and cost breakdown

import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { UniversalMetadata } from '../UniversalMetadata'
import { 
  getBlockSize, 
  getFinancialColor, 
  getCriticalStatusColor,
  getWarningStatusColor 
} from '../utils/tokens'
import { resolveVendor } from '../utils/vendor'
import { resolveEventDate, formatEventDate } from '../utils/date'

interface RepairBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function RepairBlock({ event, onEdit }: RepairBlockProps) {
  const vendor = resolveVendor(event)
  const eventDate = resolveEventDate(event)
  
  // Extract repair-specific data
  const repairType = event.payload?.key_facts?.repair_type || 
                    event.payload?.repair_description || 
                    event.kind || 
                    'Repair'
  
  const shopName = event.payload?.extracted_data?.shop_name || 
                   vendor || 
                   'Unknown Shop'
  
  const urgency = event.payload?.key_facts?.urgency
  const isEmergency = urgency === 'emergency'
  
  const laborAmount = event.payload?.extracted_data?.labor_amount
  const laborHours = event.payload?.extracted_data?.labor_hours
  const partsUsed = event.payload?.extracted_data?.parts_used || []
  
  const partsTotal = partsUsed.reduce((sum: number, part: any) => sum + (part.price || 0), 0)

  return (
    <div className="space-y-6">
      {/* Repair Header with Icon */}
      <div className="flex items-center gap-3 border-b border-amber-200 pb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Repair Details</h3>
          <p className="text-sm text-gray-500">
            {isEmergency ? 'Emergency repair breakdown' : 'Complete repair breakdown'}
          </p>
        </div>
        {isEmergency && (
          <div className={`ml-auto inline-flex rounded-full ${getBlockSize('small')} ${getCriticalStatusColor()}`}>
            EMERGENCY
          </div>
        )}
      </div>

      {/* Repair Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Repair Type</div>
          <div className="text-base font-semibold text-gray-900">{repairType}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Repair Shop</div>
          <div className="text-base font-semibold text-gray-900">{shopName}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-amber-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Repair Date</div>
          <div className="text-base font-semibold text-gray-900">{formatEventDate(eventDate)}</div>
        </div>
        
        {event.miles && (
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Odometer Reading</div>
            <div className="text-xl font-bold text-gray-900">
              {event.miles.toLocaleString()} <span className="text-sm font-normal text-gray-500">miles</span>
            </div>
          </div>
        )}
        
        {urgency && (
          <div className="bg-white rounded-lg p-4 border border-amber-100 md:col-span-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Urgency Level</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${
              urgency === 'emergency' ? getCriticalStatusColor() : 
              urgency === 'urgent' ? getWarningStatusColor() : 
              'bg-green-100 text-green-800 border-green-200'
            }`}>
              {urgency.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {event.total_amount && (
        <div className="bg-white rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Repair Costs</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-amber-100">
              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
              <div className={`inline-flex rounded-full ${getBlockSize('large')} ${getFinancialColor()}`}>
                ${event.total_amount.toFixed(2)}
              </div>
            </div>
            
            {laborAmount && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">
                  Labor {laborHours && <span className="text-sm text-gray-400">({laborHours}h)</span>}
                </span>
                <div className={`inline-flex rounded-full ${getBlockSize('small')} ${getFinancialColor()}`}>
                  ${laborAmount.toFixed(2)}
                </div>
              </div>
            )}
            
            {partsUsed.length > 0 && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">
                  Parts <span className="text-sm text-gray-400">({partsUsed.length} items)</span>
                </span>
                <div className={`inline-flex rounded-full ${getBlockSize('small')} ${getFinancialColor()}`}>
                  ${partsTotal.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Parts List */}
      {partsUsed.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900">Replacement Parts</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {partsUsed.slice(0, 6).map((part: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                <span className="font-medium text-gray-900 text-sm">{part.part_name || part.name || 'Unknown Part'}</span>
                <span className="font-bold text-gray-900">${(part.price || 0).toFixed(2)}</span>
              </div>
            ))}
            
            {partsUsed.length > 6 && (
              <div className="col-span-full text-center py-2 text-sm text-gray-500 bg-amber-50 rounded-lg border border-amber-100">
                + {partsUsed.length - 6} more parts
              </div>
            )}
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
