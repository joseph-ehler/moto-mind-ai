import React, { useState } from 'react'
import { TimelineEvent } from './VehicleTimeline'
import { ChevronDown, ChevronUp, Image as ImageIcon, ExternalLink, Gauge, Fuel, Wrench, AlertTriangle, Calendar, DollarSign, MapPin, Edit2, Clock, User } from 'lucide-react'
import { getWarningLightLabel, getWarningLightColor, groupWarningLightsBySeverity } from '@/lib/domain/warning-lights'

interface UnifiedEventDetailProps {
  event: TimelineEvent
  onImageClick?: () => void
}

export function UnifiedEventDetail({ event, onImageClick }: UnifiedEventDetailProps) {
  const [showTechnical, setShowTechnical] = useState(false)
  const [showRawData, setShowRawData] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [showChangeLog, setShowChangeLog] = useState(false)
  
  // Unit preference state - defaults to original captured unit
  const originalUnit = event.payload?.key_facts?.odometer_original_unit || 'mi'
  const [displayUnit, setDisplayUnit] = useState<'mi' | 'km'>(originalUnit)

  // Get document image URL
  const getDocumentImageUrl = () => {
    // Check payload.raw_extraction.source_document_url first (most reliable)
    if (event?.payload?.raw_extraction?.raw_extraction?.source_document_url) {
      return event.payload.raw_extraction.raw_extraction.source_document_url
    }
    // Check payload.raw_extraction.image_url
    if (event?.payload?.raw_extraction?.image_url) {
      return event.payload.raw_extraction.image_url
    }
    // Check nested raw_extraction
    if (event?.payload?.raw_extraction?.raw_extraction?.image_url) {
      return event.payload.raw_extraction.raw_extraction.image_url
    }
    // Everything is an event - check payload.image_url
    if (event?.payload?.image_url) {
      return event.payload.image_url
    }
    // Fallback: Check for joined image data (Supabase returns as array)
    if (event?.image && Array.isArray(event.image) && event.image.length > 0) {
      return event.image[0].public_url
    }
    // Check for image object (single)
    if (event?.image && typeof event.image === 'object' && !Array.isArray(event.image) && event.image.public_url) {
      return event.image.public_url
    }
    // Legacy fallback
    if (event?.payload?.source_document_url) {
      return event.payload.source_document_url
    }
    return null
  }

  const documentImageUrl = getDocumentImageUrl()

  // Extract key data fields from event
  const getKeyFields = (): Array<{ label: string; value: any; type?: 'financial' | 'measurement' | 'text'; isOdometer?: boolean }> => {
    const fields: Array<{ label: string; value: any; type?: 'financial' | 'measurement' | 'text'; isOdometer?: boolean }> = []

    // Type-specific fields FIRST (so fuel data shows before odometer)
    switch (event.type) {
      case 'dashboard_snapshot':
        // Read from canonical payload.data (with fallback for old events)
        const dashData = event.payload?.data || event.payload?.key_facts || {}
        
        // Fuel Level
        if (dashData.fuel_eighths !== null && dashData.fuel_eighths !== undefined) {
          fields.push({ label: 'Fuel Level', value: `${Math.round(dashData.fuel_eighths / 8 * 100)}%`, type: 'measurement' })
        }
        
        // Coolant Temperature
        if (dashData.coolant_temp) {
          const tempLabels: Record<string, string> = {
            'cold': 'Cold',
            'normal': 'Normal',
            'hot': 'Hot'
          }
          fields.push({ label: 'Coolant Temp', value: tempLabels[dashData.coolant_temp] || dashData.coolant_temp, type: 'measurement' })
        }
        
        // Outside Temperature
        if (dashData.outside_temp_value !== null && dashData.outside_temp_value !== undefined) {
          const unit = dashData.outside_temp_unit || 'F'
          fields.push({ label: 'Outside Temp', value: `${dashData.outside_temp_value}°${unit}`, type: 'measurement' })
        }
        
        // Warning Lights Count
        if (dashData.warning_lights && dashData.warning_lights.length > 0) {
          fields.push({ label: 'Warning Lights', value: dashData.warning_lights.length, type: 'text' })
        }
        
        // Oil Life (if present)
        if (dashData.oil_life_percent) {
          fields.push({ label: 'Oil Life', value: `${dashData.oil_life_percent}%`, type: 'measurement' })
        }
        
        // Trip Meters (if present)
        if (dashData.trip_a_miles) {
          fields.push({ label: 'Trip A', value: `${dashData.trip_a_miles.toLocaleString()} mi`, type: 'measurement' })
        }
        if (dashData.trip_b_miles) {
          fields.push({ label: 'Trip B', value: `${dashData.trip_b_miles.toLocaleString()} mi`, type: 'measurement' })
        }
        break

      case 'fuel':
        // Read from canonical payload.data (with fallback for old events)
        const fuelData = event.payload?.data || event.payload?.raw_extraction?.key_facts || {}
        const gallons = fuelData.gallons
        const station = fuelData.station_name
        const fuelAmount = fuelData.total_amount
        const pricePerGal = fuelData.price_per_gallon
        const fuelType = fuelData.fuel_type
        
        if (station) fields.push({ label: 'Station', value: station, type: 'text' })
        if (gallons) fields.push({ label: 'Gallons', value: `${gallons} gal`, type: 'measurement' })
        if (fuelAmount) fields.push({ label: 'Total Amount', value: `$${fuelAmount.toFixed(2)}`, type: 'financial' })
        if (pricePerGal) {
          fields.push({ label: 'Price/Gallon', value: `$${pricePerGal.toFixed(3)}`, type: 'financial' })
        }
        if (fuelType) fields.push({ label: 'Fuel Type', value: fuelType, type: 'text' })
        break

      case 'service':
      case 'maintenance':
        if (event.vendor) fields.push({ label: 'Vendor', value: event.vendor, type: 'text' })
        if (event.kind) fields.push({ label: 'Service Type', value: event.kind, type: 'text' })
        break

      case 'repair':
        if (event.vendor) fields.push({ label: 'Shop', value: event.vendor, type: 'text' })
        if (event.kind) fields.push({ label: 'Repair Type', value: event.kind, type: 'text' })
        if (event.payload?.key_facts?.urgency) {
          fields.push({ label: 'Urgency', value: event.payload.key_facts.urgency, type: 'text' })
        }
        break

      case 'inspection':
        if (event.payload?.result) fields.push({ label: 'Result', value: event.payload.result, type: 'text' })
        if (event.payload?.certificate_number) fields.push({ label: 'Certificate', value: event.payload.certificate_number, type: 'text' })
        break
    }

    // Odometer - only show for events that actually have odometer data
    if (event.type === 'dashboard_snapshot' && event.payload?.key_facts?.odometer_original_value) {
      const originalValue = event.payload.key_facts.odometer_original_value
      const originalUnit = event.payload.key_facts.odometer_original_unit || 'mi'
      
      let displayValue: number
      if (displayUnit === originalUnit) {
        displayValue = originalValue
      } else if (displayUnit === 'km' && originalUnit === 'mi') {
        displayValue = Math.round(originalValue * 1.609)
      } else {
        displayValue = Math.round(originalValue / 1.609)
      }
      
      fields.push({ 
        label: 'Odometer', 
        value: `${displayValue.toLocaleString()} ${displayUnit}`, 
        type: 'measurement',
        isOdometer: true
      })
    } else if (event.miles && event.type === 'odometer') {
      // Only show odometer for explicit odometer events
      fields.push({ label: 'Odometer', value: `${event.miles.toLocaleString()} mi`, type: 'measurement' })
    }

    return fields
  }

  const keyFields = getKeyFields()

  // Get field styling based on type
  const getFieldStyle = (type?: string) => {
    switch (type) {
      case 'financial':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
          text: 'text-blue-900',
          border: 'border-blue-200',
          icon: DollarSign,
          iconColor: 'text-blue-600'
        }
      case 'measurement':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
          text: 'text-purple-900',
          border: 'border-purple-200',
          icon: Gauge,
          iconColor: 'text-purple-600'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100/50',
          text: 'text-gray-900',
          border: 'border-gray-200',
          icon: null,
          iconColor: 'text-gray-600'
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Original Document Image */}
      {documentImageUrl && (
        <div className="relative">
          <button
            onClick={onImageClick}
            className="w-full group relative overflow-hidden rounded-t-2xl"
          >
            <img
              src={documentImageUrl}
              alt="Original document"
              className="w-full h-auto max-h-96 object-contain bg-gray-900"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white">
                <ImageIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Click to view full size</span>
              </div>
            </div>
          </button>
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={onImageClick}
              className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
              title="View full size"
            >
              <ImageIcon className="w-4 h-4 text-gray-700" />
            </button>
            {documentImageUrl && (
              <a
                href={documentImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-lg transition-colors backdrop-blur-sm"
                title="Open in new tab"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-gray-700" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 space-y-8">
        {/* Key Fields Grid - Redesigned */}
        {keyFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyFields.map((field, index) => {
              const style = getFieldStyle(field.type)
              const Icon = style.icon
              return (
                <div key={index} className={`${style.bg} ${style.border} border rounded-xl p-4 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        {field.label}
                      </div>
                      <div className={`text-2xl font-bold ${style.text} leading-tight break-words`}>
                        {field.value}
                      </div>
                      {/* Unit toggle for odometer on dashboard snapshots */}
                      {field.isOdometer && event.type === 'dashboard_snapshot' && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setDisplayUnit('mi')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              displayUnit === 'mi'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white/50 text-purple-700 hover:bg-white/80'
                            }`}
                          >
                            Miles
                          </button>
                          <button
                            onClick={() => setDisplayUnit('km')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              displayUnit === 'km'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white/50 text-purple-700 hover:bg-white/80'
                            }`}
                          >
                            Kilometers
                          </button>
                        </div>
                      )}
                    </div>
                    {Icon && (
                      <div className={`flex-shrink-0 ${style.iconColor} opacity-40`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Service Message (Dashboard Snapshot) - If present */}
        {event.type === 'dashboard_snapshot' && event.payload?.key_facts?.service_message && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                Service Message
              </h3>
            </div>
            <p className="text-base text-gray-800 leading-relaxed font-medium">
              {event.payload.key_facts.service_message}
            </p>
          </div>
        )}

        {/* Warning Lights (Dashboard Snapshot) - Grouped by Severity */}
        {event.type === 'dashboard_snapshot' && event.payload?.key_facts?.warning_lights && event.payload.key_facts.warning_lights.length > 0 && (() => {
          const grouped = groupWarningLightsBySeverity(event.payload.key_facts.warning_lights)
          const hasCritical = grouped.critical.length > 0
          const hasWarning = grouped.warning.length > 0
          const hasInfo = grouped.info.length > 0
          
          return (
            <div className="space-y-4">
              {/* Critical Warnings */}
              {hasCritical && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
                      Critical Warnings ({grouped.critical.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {grouped.critical.map((light: string, idx: number) => {
                      const colors = getWarningLightColor(light)
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-2 px-4 py-2 bg-white border-2 ${colors.border} rounded-lg shadow-sm`}
                        >
                          <div className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`} />
                          <span className={`text-sm font-bold ${colors.text} uppercase tracking-wide`}>
                            {getWarningLightLabel(light)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Important Warnings */}
              {hasWarning && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                      Service Warnings ({grouped.warning.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {grouped.warning.map((light: string, idx: number) => {
                      const colors = getWarningLightColor(light)
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-2 px-4 py-2 bg-white border-2 ${colors.border} rounded-lg shadow-sm`}
                        >
                          <div className={`w-2 h-2 ${colors.dot} rounded-full animate-pulse`} />
                          <span className={`text-sm font-bold ${colors.text} uppercase tracking-wide`}>
                            {getWarningLightLabel(light)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Informational Indicators */}
              {hasInfo && (
                <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                      Active Indicators ({grouped.info.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {grouped.info.map((light: string, idx: number) => {
                      const colors = getWarningLightColor(light)
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-2 px-4 py-2 bg-white border-2 ${colors.border} rounded-lg shadow-sm`}
                        >
                          <div className={`w-2 h-2 ${colors.dot} rounded-full`} />
                          <span className={`text-sm font-bold ${colors.text} uppercase tracking-wide`}>
                            {getWarningLightLabel(light)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Notes - Redesigned */}
        {event.notes && (
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                Notes
              </h3>
            </div>
            <p className="text-base text-gray-800 leading-relaxed">
              {event.notes}
            </p>
          </div>
        )}

      {/* Technical Details Collapsible */}
      {event.confidence && (
        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
              Technical Details
            </span>
            {showTechnical ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showTechnical && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {event.confidence && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Confidence</div>
                    <div className="font-medium">{Math.round(event.confidence * 100)}%</div>
                  </div>
                )}
                {event.payload?.processing_metadata?.model_version && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Model</div>
                    <div className="font-mono text-xs">{event.payload.processing_metadata.model_version}</div>
                  </div>
                )}
                {event.created_at && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-xs">{new Date(event.created_at).toLocaleString()}</div>
                  </div>
                )}
                {event.id && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Event ID</div>
                    <div className="font-mono text-xs truncate">{event.id}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw Data Collapsible */}
        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
              Raw Data (JSON)
            </span>
            {showRawData ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showRawData && (
            <div className="mt-4">
              <pre className="p-4 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto">
                {JSON.stringify(event, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Event Metadata Accordion */}
        <div className="border-t border-gray-100 pt-6">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="flex items-center justify-between w-full text-left group"
          >
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
              Event Metadata
            </span>
            {showMetadata ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showMetadata && (
            <div className="mt-4 space-y-3">
              {/* Event ID */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-700">Event ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{event.id}</code>
              </div>

              {/* Created At */}
              {event?.created_at && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(event.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              )}

              {/* Source Information */}
              {event?.payload?.source && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Source</span>
                  <span className="text-sm text-gray-600 capitalize">{event.payload.source}</span>
                </div>
              )}

              {/* Method Information */}
              {event?.payload?.method && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Method</span>
                  <span className="text-sm text-gray-600 capitalize">{event.payload.method}</span>
                </div>
              )}

              {/* Tenant ID (for debugging) */}
              {(event as any)?.tenant_id && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Tenant</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{(event as any).tenant_id}</code>
                </div>
              )}

              {/* Vehicle ID */}
              {event?.vehicle_id && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Vehicle</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{event.vehicle_id}</code>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Change Log Accordion - Only show if event has been edited */}
        {((event as any)?.edit_history?.length > 0 || event?.edited_at) && (
          <div className="border-t border-gray-100 pt-6">
            <button
              onClick={() => setShowChangeLog(!showChangeLog)}
              className="flex items-center justify-between w-full text-left group"
            >
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide group-hover:text-gray-700">
                Change Log
              </span>
              {showChangeLog ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showChangeLog && (
              <div className="mt-4">
                {/* Show full edit history if available */}
                {(event as any)?.edit_history?.length > 0 ? (
                  // Display full history (newest first)
                  <div className="space-y-6">
                    {[...(event as any).edit_history].reverse().map((historyEntry: any, index: number) => (
                      <div key={index} className="relative">
                        {/* Timeline connector line */}
                        {index < (event as any).edit_history.length - 1 && (
                          <div className="absolute left-4 top-12 bottom-0 w-px bg-gray-200"></div>
                        )}
                        
                        <div className="flex gap-4">
                          {/* Timeline icon */}
                          <div className="flex-shrink-0 relative">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0 pb-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-semibold text-gray-900">Event edited</h5>
                              <time className="text-xs text-gray-500 font-medium">
                                {new Date(historyEntry.timestamp).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </time>
                            </div>
                            
                            {/* Edit reason */}
                            {historyEntry.reason && (
                              <p className="text-sm text-gray-600 mb-3 italic">"{historyEntry.reason}"</p>
                            )}
                            
                            {/* Changes */}
                            {historyEntry.changes && (
                              <div className="space-y-2">
                                {Object.entries(historyEntry.changes).map(([field, change]: [string, any]) => {
                                  // Helper to safely render values (handle objects)
                                  const renderValue = (val: any) => {
                                    if (val === null || val === undefined) return 'empty'
                                    if (typeof val === 'object') return JSON.stringify(val)
                                    return String(val)
                                  }
                                  
                                  // Handle nested payload changes
                                  if (field === 'payload' && typeof change === 'object') {
                                    return Object.entries(change).map(([payloadField, payloadChange]: [string, any]) => (
                                      <div key={`${field}.${payloadField}`} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700 capitalize">
                                            {payloadField.replace('_', ' ')}
                                          </span>
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs line-through">
                                              {renderValue(payloadChange.from)}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs font-semibold">
                                              {renderValue(payloadChange.to)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  }
                                  
                                  // Handle direct field changes
                                  return (
                                    <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                          {field.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-2 text-sm">
                                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs line-through">
                                            {renderValue(change.from)}
                                          </span>
                                          <span className="text-gray-400">→</span>
                                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs font-semibold">
                                            {renderValue(change.to)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback to old format for backward compatibility
                  event?.edited_at && (
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 relative">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-semibold text-gray-900">Event edited</h5>
                          <time className="text-xs text-gray-500 font-medium">
                            {new Date(event.edited_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>
                        
                        {event?.edit_reason && (
                          <p className="text-sm text-gray-600 mb-3 italic">"{event.edit_reason}"</p>
                        )}
                        
                        {/* Show what actually changed */}
                        {(event as any)?.edit_changes && (
                          <div className="space-y-2">
                            {Object.entries((event as any).edit_changes).map(([field, change]: [string, any]) => {
                              // Helper to safely render values (handle objects)
                              const renderValue = (val: any) => {
                                if (val === null || val === undefined) return 'empty'
                                if (typeof val === 'object') return JSON.stringify(val)
                                return String(val)
                              }
                              
                              // Handle nested payload changes
                              if (field === 'payload' && typeof change === 'object') {
                                return Object.entries(change).map(([payloadField, payloadChange]: [string, any]) => (
                                  <div key={`${field}.${payloadField}`} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700 capitalize">
                                        {payloadField.replace('_', ' ')}
                                      </span>
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs line-through">
                                          {renderValue(payloadChange.from)}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs font-semibold">
                                          {renderValue(payloadChange.to)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              }
                              
                              // Handle direct field changes
                              return (
                                <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 capitalize">
                                      {field.replace('_', ' ')}
                                    </span>
                                    <div className="flex items-center gap-2 text-sm">
                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-mono text-xs line-through">
                                        {renderValue(change.from)}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-mono text-xs font-semibold">
                                        {renderValue(change.to)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
