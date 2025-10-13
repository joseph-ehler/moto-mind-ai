/**
 * Service/Maintenance Event Renderer - Elite Tier
 * 
 * Comprehensive service tracking with warranty and next-service reminders
 */

import { Wrench, Shield, Calendar, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { EventTypeRenderer, DataRow, getExtractedData, getCost } from './types'
import { TimelineItem } from '@/types/timeline'

export const ServiceEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const serviceType = data.service_type || data.maintenance_type || data.work_performed
    
    // Handle common service types with better formatting
    if (serviceType) {
      return serviceType
        .split(/[_\-\s]+/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
    
    return item.type === 'maintenance' ? 'Maintenance' : 'Service'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const parts: string[] = []
    
    // Provider/mechanic
    const provider = data.service_provider || data.mechanic || data.shop_name || data.dealer
    if (provider) parts.push(`at ${provider}`)
    
    // Service category
    const category = data.category || data.service_category
    if (category && !parts.some(p => p.toLowerCase().includes(category.toLowerCase()))) {
      parts.push(category)
    }
    
    // Location
    const location = data.location || data.city
    if (location && !parts.some(p => p.includes(location))) {
      parts.push(location)
    }
    
    return parts.length > 0 ? parts.join(' • ') : null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    const cost = getCost(item)
    
    // 💰 Cost with labor/parts breakdown
    if (cost > 0) {
      const laborCost = data.labor_cost || data.labour_cost
      const partsCost = data.parts_cost
      
      const costDisplay = (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 leading-none tracking-tight">
              ${Number(cost).toFixed(2)}
            </span>
            {(laborCost || partsCost) && (
              <span className="text-sm font-medium text-gray-500">total</span>
            )}
          </div>
          {(laborCost || partsCost) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {laborCost > 0 && (
                <span className="text-gray-600">
                  <span className="font-medium">Labor:</span> ${laborCost.toFixed(2)}
                </span>
              )}
              {partsCost > 0 && (
                <span className="text-gray-600">
                  <span className="font-medium">Parts:</span> ${partsCost.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </div>
      )
      rows.push({ label: 'Total Cost', value: costDisplay })
    }
    
    // 📦 Parts replaced with visual list
    const partsReplaced = data.parts_replaced || data.replaced_parts || data.new_parts
    if (partsReplaced && Array.isArray(partsReplaced) && partsReplaced.length > 0) {
      const partsDisplay = (
        <div className="flex flex-col gap-1.5">
          {partsReplaced.slice(0, 4).map((part: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">{part}</span>
            </div>
          ))}
          {partsReplaced.length > 4 && (
            <span className="text-xs text-gray-500 ml-5">
              +{partsReplaced.length - 4} more
            </span>
          )}
        </div>
      )
      rows.push({ label: 'Parts Replaced', value: partsDisplay })
    }
    
    // 🛡️ Warranty information with countdown
    const warrantyUntil = data.warranty_until || data.warranty_expiry || data.warranty_end_date
    if (warrantyUntil) {
      const warrantyDate = new Date(warrantyUntil)
      const today = new Date()
      const daysLeft = Math.floor((warrantyDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let badgeColor = 'green'
      let badgeText = 'Active'
      let Icon = Shield
      
      if (daysLeft < 0) {
        badgeColor = 'gray'
        badgeText = 'Expired'
        Icon = AlertCircle
      } else if (daysLeft < 30) {
        badgeColor = 'yellow'
        badgeText = 'Expiring Soon'
        Icon = Clock
      }
      
      const warrantyDisplay = (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-${badgeColor}-50 text-${badgeColor}-700 border border-${badgeColor}-200`}>
            <Icon className="w-3.5 h-3.5" />
            {badgeText}
          </span>
          <span className="text-sm text-gray-600">
            until {warrantyDate.toLocaleDateString()}
            {daysLeft > 0 && ` (${daysLeft}d)`}
          </span>
        </div>
      )
      rows.push({ label: 'Warranty', value: warrantyDisplay })
    }
    
    // 📅 Next service reminder
    const nextService = data.next_service_date || data.next_service_due || data.service_due_date
    const nextServiceMiles = data.next_service_miles || data.next_service_mileage
    
    if (nextService || nextServiceMiles) {
      let parts: string[] = []
      
      if (nextService) {
        const serviceDate = new Date(nextService)
        const today = new Date()
        const daysUntil = Math.floor((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntil < 0) {
          parts.push(`⚠️ ${Math.abs(daysUntil)} days overdue`)
        } else if (daysUntil < 30) {
          parts.push(`🔔 ${daysUntil} days`)
        } else {
          parts.push(serviceDate.toLocaleDateString())
        }
      }
      
      if (nextServiceMiles) {
        parts.push(`${nextServiceMiles.toLocaleString()} mi`)
      }
      
      const nextServiceDisplay = (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">
            {parts.join(' or ')}
          </span>
        </div>
      )
      rows.push({ label: 'Next Service', value: nextServiceDisplay })
    }
    
    // ⏱️ Service duration
    const duration = data.service_duration || data.time_spent
    if (duration) {
      rows.push({
        label: 'Duration',
        value: (
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {duration}
          </span>
        )
      })
    }
    
    // ✅ Work completed
    const workCompleted = data.work_completed || data.services_performed
    if (workCompleted && Array.isArray(workCompleted) && workCompleted.length > 0) {
      const workDisplay = (
        <div className="flex flex-col gap-1">
          {workCompleted.slice(0, 3).map((work: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-gray-700">{work}</span>
            </div>
          ))}
          {workCompleted.length > 3 && (
            <span className="text-xs text-gray-500 ml-5">
              +{workCompleted.length - 3} more items
            </span>
          )}
        </div>
      )
      rows.push({ label: 'Work Completed', value: workDisplay })
    }
    
    return rows
  }
}
