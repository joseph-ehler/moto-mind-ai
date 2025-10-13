/**
 * Damage Event Renderer - Elite Tier
 * 
 * Damage reports with severity, location, and repair tracking
 */

import { AlertTriangle, MapPin, DollarSign, Wrench, Image, CheckCircle } from 'lucide-react'
import { EventTypeRenderer, DataRow, getExtractedData, getCost } from './types'
import { TimelineItem } from '@/types/timeline'

export const DamageEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const damageType = data.damage_type || data.type_of_damage
    
    if (damageType) {
      return `${damageType} Damage`
    }
    
    return 'Damage Report'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const parts: string[] = []
    
    // Location on vehicle
    const location = data.damage_location || data.location_on_vehicle || data.area
    if (location) parts.push(location)
    
    // Severity
    const severity = data.severity || data.damage_severity
    if (severity) parts.push(`${severity} severity`)
    
    // Incident date if different from timestamp
    const incidentDate = data.incident_date
    if (incidentDate) {
      const date = new Date(incidentDate)
      parts.push(`occurred ${date.toLocaleDateString()}`)
    }
    
    return parts.length > 0 ? parts.join(' • ') : null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    const cost = getCost(item)
    
    // 🚨 Severity indicator
    const severity = data.severity || data.damage_severity
    if (severity) {
      let severityBadge
      const severityLower = severity.toLowerCase()
      
      if (severityLower.includes('severe') || severityLower.includes('major')) {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold text-red-700">Severe Damage</span>
          </span>
        )
      } else if (severityLower.includes('moderate') || severityLower.includes('medium')) {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-700">Moderate Damage</span>
          </span>
        )
      } else {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-700">Minor Damage</span>
          </span>
        )
      }
      
      rows.push({ label: 'Severity', value: severityBadge })
    }
    
    // 📍 Damage location on vehicle
    const damageAreas = data.damaged_areas || data.affected_parts || data.damage_locations
    if (damageAreas && Array.isArray(damageAreas)) {
      const areasDisplay = (
        <div className="flex flex-wrap gap-2">
          {damageAreas.map((area: string, idx: number) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
            >
              <MapPin className="w-3.5 h-3.5" />
              {area}
            </span>
          ))}
        </div>
      )
      rows.push({ label: 'Affected Areas', value: areasDisplay })
    }
    
    // 💰 Repair cost estimate
    if (cost > 0) {
      const costDisplay = (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
              ${Number(cost).toFixed(2)}
            </span>
            <span className="text-sm font-medium text-gray-500">
              {data.cost_type === 'estimate' ? 'estimate' : 'actual'}
            </span>
          </div>
        </div>
      )
      rows.push({ label: 'Repair Cost', value: costDisplay })
    }
    
    // 🛠️ Repair status
    const repairStatus = data.repair_status || data.status
    if (repairStatus) {
      let statusBadge
      const statusLower = repairStatus.toLowerCase()
      
      if (statusLower.includes('complete') || statusLower.includes('fixed') || statusLower.includes('repaired')) {
        statusBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">Repaired</span>
          </span>
        )
      } else if (statusLower.includes('progress') || statusLower.includes('repairing')) {
        statusBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <Wrench className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">In Progress</span>
          </span>
        )
      } else {
        statusBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-700">Pending Repair</span>
          </span>
        )
      }
      
      rows.push({ label: 'Status', value: statusBadge })
    }
    
    // 📝 Description
    const description = data.description || data.damage_description || data.details
    if (description) {
      rows.push({
        label: 'Description',
        value: (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {description}
            </p>
          </div>
        )
      })
    }
    
    // 📸 Photo count
    const photoCount = data.photo_count || data.number_of_photos
    if (photoCount && photoCount > 0) {
      rows.push({
        label: 'Photos',
        value: (
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {photoCount} photo{photoCount > 1 ? 's' : ''} attached
            </span>
          </div>
        )
      })
    }
    
    // 🏢 Repair shop
    const repairShop = data.repair_shop || data.shop_name || data.body_shop
    if (repairShop) {
      rows.push({
        label: 'Repair Shop',
        value: <span className="text-sm font-medium text-gray-700">{repairShop}</span>
      })
    }
    
    // 🗓️ Repair completion date
    const completionDate = data.repair_completed_date || data.completion_date
    if (completionDate) {
      const date = new Date(completionDate)
      rows.push({
        label: 'Completed',
        value: (
          <span className="text-sm font-medium text-gray-700">
            {date.toLocaleDateString()}
          </span>
        )
      })
    }
    
    return rows
  }
}
