'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Calendar, Clock, MapPin, ExternalLink, Fuel, Wrench, Car, AlertTriangle, FileText, DollarSign, Camera, Map, List, Filter, Activity, Gauge, Settings, CheckCircle, Shield } from 'lucide-react'
import { UnifiedEventDetail } from './UnifiedEventDetail'
import { SimpleEventsMap } from '../maps/SimpleEventsMap'
import { SectionHeader } from '@/components/ui/PageHeader'

// Enhanced event interface with validation, summaries, and processing metadata
export interface TimelineEvent {
  id: string
  vehicle_id?: string
  type: 'odometer' | 'fuel' | 'service' | 'document' | 'repair' | 'inspection' | 'insurance' | 'accident' | 'maintenance' | 'dashboard_snapshot' | 'photo' | 'damage_report'
  created_at: string
  miles?: number
  total_amount?: number
  gallons?: number
  kind?: string
  vendor?: string
  station?: string
  doc_type?: string
  confidence?: number
  summary?: string
  notes?: string
  
  // Linked photo
  image?: {
    id: string
    public_url: string
    filename: string
    ai_category?: string
    ai_description?: string
  }
  
  // Hybrid edit model - user-editable display fields
  display_vendor?: string      // User can override vendor name
  display_amount?: number      // User can correct amounts
  display_summary?: string     // User can provide custom summary
  user_notes?: string         // User can add context
  
  // Edit audit trail
  edited_at?: string
  edited_by?: string
  edit_reason?: string
  
  payload?: {
    source_document_url?: string
    extraction_confidence?: number
    validation?: {
      rollup?: 'validated' | 'needs_review' | 'ok'
      issues?: string[]
      reason?: string
      // Dashboard-specific confidence scores
      odometer_conf?: number
      fuel_conf?: number
      lights_conf?: number
    }
    [key: string]: any
  }
}

interface VehicleTimelineProps {
  vehicleId: string
  events: TimelineEvent[]
  onEventDeleted: () => void
  timelineFilter: string
  onFilterChange: (filter: string) => void
  onEventClick?: (eventId: string) => void
}

export function VehicleTimeline({ vehicleId, events, onEventDeleted, timelineFilter, onFilterChange, onEventClick }: VehicleTimelineProps) {
  const [expandedEvents, setExpandedEvents] = React.useState<Set<string>>(new Set())
  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return 'Unknown date'
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 0) return 'Future date'
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
    
    const months = Math.floor(diffInSeconds / 2592000)
    if (months < 12) return `${months} months ago`
    
    const years = Math.floor(months / 12)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }

  const handleDeleteEvent = async (event: TimelineEvent) => {
    if (!confirm(`Delete this ${event.type} event? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/timeline/${event.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      onEventDeleted?.()
    } catch (error) {
      console.error('Error deleting event:', error)
      
      const errorMessage = document.createElement('div')
      errorMessage.textContent = 'Failed to delete event. Please try again.'
      errorMessage.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50'
      document.body.appendChild(errorMessage)
      
      setTimeout(() => {
        if (errorMessage.parentNode) {
          errorMessage.parentNode.removeChild(errorMessage)
        }
      }, 5000)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'odometer': return Gauge
      case 'fuel': return Fuel
      case 'service': 
      case 'maintenance': return Wrench
      case 'repair': return Settings
      case 'inspection': return CheckCircle
      case 'insurance': return Shield
      case 'accident': 
      case 'damage_report': return AlertTriangle
      case 'dashboard_snapshot': return Activity
      case 'photo': return FileText
      case 'document': return FileText
      default: return FileText
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'odometer': return 'text-blue-600 bg-blue-50'
      case 'fuel': return 'text-green-600 bg-green-50'
      case 'service': 
      case 'maintenance': return 'text-orange-600 bg-orange-50'
      case 'repair': return 'text-amber-600 bg-amber-50'
      case 'inspection': return 'text-emerald-600 bg-emerald-50'
      case 'insurance': return 'text-indigo-600 bg-indigo-50'
      case 'accident': 
      case 'damage_report': return 'text-red-600 bg-red-50'
      case 'dashboard_snapshot': return 'text-purple-600 bg-purple-50'
      case 'photo': return 'text-slate-600 bg-slate-50'
      case 'document': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatEventTitle = (event: TimelineEvent): string => {
    switch (event.type) {
      case 'service':
      case 'maintenance':
        const vendor = event.vendor || event.payload?.extracted_data?.shop_name || 'Unknown Shop'
        const amount = event.total_amount ? ` for $${event.total_amount}` : ''
        return `${event.kind || 'Service'} at ${vendor}${amount}`
        
      case 'fuel':
        if (event.gallons && event.total_amount) {
          const ppg = (event.total_amount / event.gallons).toFixed(2)
          return `Fuel • ${event.gallons} gal @ $${ppg}/gal`
        }
        return event.summary || 'Fuel'
        
      case 'odometer':
        return `${event.miles?.toLocaleString()} mi`
        
      case 'repair':
        const repairVendor = event.vendor || event.payload?.shop_name || 'Unknown Shop'
        const repairCost = event.total_amount ? ` for $${event.total_amount}` : ''
        return `${event.kind || 'Repair'} at ${repairVendor}${repairCost}`
        
      case 'inspection':
        const inspectionStation = event.payload?.inspection_station || event.vendor || 'Unknown Station'
        const result = event.payload?.result || 'completed'
        return `${event.payload?.inspection_type || 'Safety'} inspection ${result} at ${inspectionStation}`
        
      case 'insurance':
        const company = event.payload?.insurance_company || event.vendor || 'Unknown Company'
        const action = event.payload?.document_type === 'insurance_card' ? 'card saved' : 'renewed'
        return `Auto insurance ${action} with ${company}`
        
      case 'accident':
        const location = event.payload?.location || 'Unknown location'
        const severity = event.payload?.key_facts?.severity || 'Minor'
        return `${severity} collision at ${location}`
        
      case 'dashboard_snapshot':
        // Use the pre-built summary from the payload
        return event.payload?.summary || event.summary || 'Dashboard snapshot captured'
        
      case 'damage_report':
        return event.notes || 'Damage documented'
        
      case 'photo':
        return event.kind || event.notes || 'Vehicle photo'
        
      case 'document':
        // Check if this is a photo event (has image_id)
        if (event.image) {
          return event.notes || event.image.ai_description || 'Vehicle photo'
        }
        
        const docType = event.payload?.document_type || event.payload?.doc_type || event.doc_type
        switch (docType) {
          case 'insurance_policy':
            const insuranceCompany = event.payload?.insurance_company || 'Unknown Company'
            return `Auto insurance renewed with ${insuranceCompany}`
          case 'insurance_card':
            return `Insurance card saved`
          case 'accident_report':
            const accidentLocation = event.payload?.location || 'Unknown location'
            return `Minor collision at ${accidentLocation}`
          default:
            return event.summary || 'Document saved'
        }
        
      default:
        return event.summary || 'Event'
    }
  }

  const formatEventSubtitle = (event: TimelineEvent): string | null => {
    switch (event.type) {
      case 'service':
      case 'maintenance':
        const serviceParts = []
        if (event.vendor && event.vendor !== 'Unknown Shop') serviceParts.push(event.vendor)
        if (event.total_amount) serviceParts.push(`$${event.total_amount}`)
        return serviceParts.join(' • ') || null
        
      case 'fuel':
        const fuelParts = []
        if (event.station) fuelParts.push(event.station)
        if (event.total_amount) fuelParts.push(`$${event.total_amount}`)
        return fuelParts.join(' • ') || null
        
      case 'repair':
        const repairParts = []
        if (event.vendor) repairParts.push(event.vendor)
        if (event.total_amount) repairParts.push(`$${event.total_amount}`)
        if (event.payload?.warranty_period) repairParts.push(`Warranty: ${event.payload.warranty_period}`)
        return repairParts.join(' • ') || null
        
      case 'inspection':
        const inspectionParts = []
        if (event.payload?.certificate_number) inspectionParts.push(`Certificate #${event.payload.certificate_number}`)
        if (event.payload?.expiration_date) {
          const date = new Date(event.payload.expiration_date)
          inspectionParts.push(`Valid until ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`)
        }
        return inspectionParts.join(' • ') || null
        
      case 'insurance':
        const insuranceParts = []
        if (event.payload?.policy_number) insuranceParts.push(`Policy #${event.payload.policy_number}`)
        if (event.payload?.premium_amount) insuranceParts.push(`$${event.payload.premium_amount}/year`)
        if (event.payload?.coverage_type) insuranceParts.push(event.payload.coverage_type)
        return insuranceParts.join(' • ') || null
        
      case 'accident':
        const accidentParts = []
        if (event.payload?.damage_description) accidentParts.push(event.payload.damage_description)
        if (event.payload?.claim_number) accidentParts.push(`Claim #${event.payload.claim_number}`)
        if (event.payload?.other_party_info?.vehicle) accidentParts.push(`Other party: ${event.payload.other_party_info.vehicle}`)
        return accidentParts.join(' • ') || null
        
      case 'odometer':
        return formatRelativeTime(event.created_at)
        
      case 'dashboard_snapshot':
        const dashboardParts = []
        
        // Add needs review chip if validation failed
        if (event.payload?.validation?.rollup === 'needs_review') {
          const reasons = []
          const validation = event.payload.validation
          if (validation.odometer_conf !== undefined && validation.odometer_conf < 0.8) reasons.push('odometer unclear')
          if (validation.fuel_conf !== undefined && validation.fuel_conf < 0.7) reasons.push('fuel unclear')
          if (validation.lights_conf !== undefined && validation.lights_conf < 0.75) reasons.push('lights unclear')
          const reason = reasons.length > 0 ? reasons.join(', ') : 'needs review'
          dashboardParts.push(`⚠️ ${reason}`)
        }
        
        // Add confidence if available
        if (event.payload?.confidence && event.payload.confidence < 0.9) {
          dashboardParts.push(`${Math.round(event.payload.confidence * 100)}% confidence`)
        }
        
        return dashboardParts.join(' • ') || null
        
      default:
        return null
    }
  }

  const formatContextLine = (event: TimelineEvent): string | null => {
    const parts = []
    
    if (event.miles) {
      parts.push(`At ${event.miles.toLocaleString()} mi`)
    }
    
    switch (event.type) {
      case 'repair':
        if (event.payload?.key_facts?.urgency === 'emergency') {
          parts.push('Emergency repair')
        }
        break
      case 'inspection':
        if (event.payload?.expiration_date) {
          const expDate = new Date(event.payload.expiration_date)
          parts.push(`Next due ${expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`)
        }
        break
      case 'accident':
        if (event.payload?.police_report_number) {
          parts.push('Police report filed')
        }
        break
    }
    
    return parts.length > 0 ? parts.join(' • ') : null
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
        <p className="text-gray-500">
          Start by adding fuel, service records, or odometer readings to track your vehicle's history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <SectionHeader 
          title="Vehicle Timeline"
          action={
            <div className="text-sm text-gray-500">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </div>
          }
        />
        
        {onFilterChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'odometer', 'fuel', 'service', 'repair', 'inspection', 'insurance', 'accident', 'document'].map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  timelineFilter === filter
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event) => {
          const IconComponent = getEventIcon(event.type)
          const colorClasses = getEventColor(event.type)
          const title = formatEventTitle(event)
          const subtitle = formatEventSubtitle(event)
          const relativeTime = formatRelativeTime(event.created_at)

          return (
            <div key={event.id} className="group bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200">
              <div 
                className="p-4 cursor-pointer"
                onClick={() => onEventClick?.(event.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Photo Thumbnail */}
                  {event.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={event.image.public_url}
                        alt={event.image.filename}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(event.image?.public_url, '_blank')}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                      {title}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {subtitle && <span>{subtitle}</span>}
                      {subtitle && <span>•</span>}
                      <span>{relativeTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    
                    {(event.payload?.source_document_url || event.payload?.source === 'SimplePhotoModal') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (event.payload?.source_document_url) {
                            window.open(event.payload.source_document_url, '_blank')
                          } else {
                            alert('Document storage failed - original image not available. Please re-upload to store documents.')
                          }
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded hover:bg-blue-100 transition-colors"
                      >
                        View
                      </button>
                    )}

                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleEventExpansion(event.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title={expandedEvents.has(event.id) ? "Collapse details" : "Expand details"}
                    >
                      {expandedEvents.has(event.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEvent(event)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {expandedEvents.has(event.id) && (
                <UnifiedEventDetail event={event} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
