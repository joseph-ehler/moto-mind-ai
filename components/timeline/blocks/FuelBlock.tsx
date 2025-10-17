// Fuel Event Block
// Displays fuel purchase details with station info and efficiency metrics

import React from 'react'
import { TimelineEvent } from '../VehicleTimeline'
import { UniversalMetadata } from '../UniversalMetadata'
import { 
  getBlockSize, 
  getFinancialColor, 
  getMeasurementColor 
} from '../utils/tokens'
import { resolveVendor } from '../utils/vendor'
import { resolveEventDate, formatEventDate } from '../utils/date'

interface FuelBlockProps {
  event: TimelineEvent
  onEdit?: (updates: Partial<TimelineEvent>) => void
}

export function FuelBlock({ event, onEdit }: FuelBlockProps) {
  const vendor = resolveVendor(event)
  const eventDate = resolveEventDate(event)
  
  // Extract fuel-specific data
  const stationName = event.payload?.station_name || 
                     event.payload?.extracted_data?.station_name || 
                     vendor || 
                     'Unknown Station'
  
  const gallons = event.gallons || 
                 event.payload?.gallons || 
                 event.payload?.extracted_data?.gallons
  
  const pricePerGallon = event.payload?.price_per_gallon || 
                        event.payload?.extracted_data?.price_per_gallon
  
  const totalAmount = event.total_amount || 
                     event.payload?.total_amount || 
                     event.payload?.extracted_data?.total_amount
  
  const fuelType = event.payload?.fuel_type || 
                  event.payload?.extracted_data?.fuel_type || 
                  'Regular'
  
  // Calculate efficiency if we have miles
  const efficiency = event.miles && gallons ? (event.miles / gallons).toFixed(1) : null

  return (
    <div className="space-y-6">
      {/* Fuel Header with Icon */}
      <div className="flex items-center gap-3 border-b border-blue-200 pb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Fuel Purchase</h3>
          <p className="text-sm text-gray-500">Fill-up details and efficiency</p>
        </div>
      </div>

      {/* Fuel Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Station</div>
          <div className="text-base font-semibold text-gray-900">{stationName}</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Date</div>
          <div className="text-base font-semibold text-gray-900">{formatEventDate(eventDate)}</div>
        </div>
        
        {gallons && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Volume</div>
            <div className={`inline-flex rounded-full ${getBlockSize('large')} ${getMeasurementColor()}`}>
              {gallons} gal
            </div>
          </div>
        )}
        
        {pricePerGallon && (
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Price per Gallon</div>
            <div className={`inline-flex rounded-full ${getBlockSize('medium')} ${getFinancialColor()}`}>
              ${pricePerGallon}/gal
            </div>
          </div>
        )}
        
        {totalAmount && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 md:col-span-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Cost</div>
            <div className={`inline-flex rounded-full ${getBlockSize('large')} ${getFinancialColor()}`}>
              ${totalAmount.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Fuel Details */}
      <div className="bg-white rounded-xl p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-900">Fuel Details</h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Fuel Type</span>
            <span className="font-semibold text-gray-900">{fuelType}</span>
          </div>
          
          {event.miles && (
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Odometer</span>
              <span className="font-semibold text-gray-900">{event.miles.toLocaleString()} mi</span>
            </div>
          )}
          
          {efficiency && (
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100 sm:col-span-2">
              <span className="text-blue-700 font-medium">Fuel Efficiency</span>
              <div className={`inline-flex rounded-full ${getBlockSize('medium')} bg-blue-100 text-blue-800 border-blue-200`}>
                {efficiency} MPG
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Universal Metadata */}
      <UniversalMetadata 
        event={event} 
        onEdit={onEdit ? () => onEdit({}) : undefined} 
      />
    </div>
  )
}
