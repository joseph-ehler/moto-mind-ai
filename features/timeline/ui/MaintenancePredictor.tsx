/**
 * Maintenance Predictor Component
 * 
 * Predicts upcoming maintenance based on:
 * - Service history patterns
 * - Mileage intervals
 * - Time-based schedules
 * - Industry standard recommendations
 */

'use client'

import { useMemo } from 'react'
import { Calendar, Gauge, Wrench, AlertCircle } from 'lucide-react'
import { TimelineItem } from '@/types/timeline'

interface MaintenancePredictorProps {
  items: TimelineItem[]
  currentMileage?: number
}

interface Prediction {
  service: string
  dueIn: string
  priority: 'high' | 'medium' | 'low'
  reason: string
  icon: React.ReactNode
}

export function MaintenancePredictor({ items, currentMileage }: MaintenancePredictorProps) {
  const predictions = useMemo(() => {
    const predictions: Prediction[] = []
    
    // Get service history
    const serviceEvents = items
      .filter(item => item.type === 'service' || item.type === 'maintenance')
      .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    
    if (serviceEvents.length === 0) return predictions
    
    const lastService = serviceEvents[0]
    const daysSinceService = Math.floor(
      (Date.now() - new Date(lastService.timestamp || 0).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    // 1. Oil Change Prediction (every 5,000-7,500 miles or 6 months)
    const oilChangeEvents = serviceEvents.filter(event => {
      const serviceType = ((event.extracted_data as any)?.service_type || '').toLowerCase()
      return serviceType.includes('oil') || serviceType.includes('change')
    })
    
    if (oilChangeEvents.length > 0) {
      const lastOilChange = oilChangeEvents[0]
      const daysSinceOil = Math.floor(
        (Date.now() - new Date(lastOilChange.timestamp || 0).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Calculate interval based on history
      let avgInterval = 180 // Default 6 months
      if (oilChangeEvents.length > 1) {
        const intervals = oilChangeEvents.slice(0, 3).map((event, idx) => {
          if (idx === oilChangeEvents.length - 1) return 0
          const next = oilChangeEvents[idx + 1]
          return Math.floor(
            (new Date(event.timestamp || 0).getTime() - new Date(next.timestamp || 0).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
        }).filter(i => i > 0)
        
        if (intervals.length > 0) {
          avgInterval = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
        }
      }
      
      const daysUntilDue = avgInterval - daysSinceOil
      
      if (daysUntilDue < 30 && daysUntilDue > -30) {
        predictions.push({
          service: 'Oil Change',
          dueIn: daysUntilDue > 0 ? `${daysUntilDue} days` : `${Math.abs(daysUntilDue)} days overdue`,
          priority: daysUntilDue < 0 ? 'high' : daysUntilDue < 14 ? 'medium' : 'low',
          reason: `Based on ${avgInterval}-day service pattern`,
          icon: <Wrench className="w-4 h-4" />
        })
      }
    } else if (daysSinceService > 150) {
      // No oil change recorded, but it's been a while
      predictions.push({
        service: 'Oil Change',
        dueIn: 'Soon',
        priority: 'medium',
        reason: 'No recent oil change recorded',
        icon: <Wrench className="w-4 h-4" />
      })
    }
    
    // 2. Tire Rotation (every 5,000-7,500 miles or 6 months)
    const tireEvents = items.filter(item => 
      item.type === 'tire_tread' || item.type === 'tire_pressure'
    )
    
    if (tireEvents.length > 0) {
      const lastTireCheck = tireEvents[0]
      const daysSinceTire = Math.floor(
        (Date.now() - new Date(lastTireCheck.timestamp || 0).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceTire > 150) {
        predictions.push({
          service: 'Tire Check',
          dueIn: 'Now',
          priority: 'medium',
          reason: `Last check was ${daysSinceTire} days ago`,
          icon: <AlertCircle className="w-4 h-4" />
        })
      }
    }
    
    // 3. Inspection (annual)
    const inspectionEvents = items.filter(item => item.type === 'inspection')
    if (inspectionEvents.length > 0) {
      const lastInspection = inspectionEvents[0]
      const daysSinceInspection = Math.floor(
        (Date.now() - new Date(lastInspection.timestamp || 0).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const daysUntilDue = 365 - daysSinceInspection
      
      if (daysUntilDue < 60 && daysUntilDue > -30) {
        predictions.push({
          service: 'Vehicle Inspection',
          dueIn: daysUntilDue > 0 ? `${daysUntilDue} days` : `${Math.abs(daysUntilDue)} days overdue`,
          priority: daysUntilDue < 0 ? 'high' : daysUntilDue < 30 ? 'medium' : 'low',
          reason: 'Annual inspection required',
          icon: <Calendar className="w-4 h-4" />
        })
      }
    }
    
    // 4. Mileage-based predictions (if we have current mileage)
    if (currentMileage && currentMileage > 0) {
      // Get mileage from service events
      const eventsWithMileage = serviceEvents
        .filter(e => e.mileage && e.mileage > 0)
        .sort((a, b) => (b.mileage || 0) - (a.mileage || 0))
      
      if (eventsWithMileage.length > 0) {
        const lastServiceMileage = eventsWithMileage[0].mileage || 0
        const milesSince = currentMileage - lastServiceMileage
        
        if (milesSince > 5000) {
          predictions.push({
            service: 'Service Check',
            dueIn: `${milesSince} miles since last service`,
            priority: milesSince > 7500 ? 'high' : 'medium',
            reason: 'Mileage-based maintenance interval',
            icon: <Gauge className="w-4 h-4" />
          })
        }
      }
    }
    
    return predictions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [items, currentMileage])
  
  if (predictions.length === 0) return null
  
  return (
    <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Calendar className="w-5 h-5 text-purple-700" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Upcoming Maintenance</h3>
          <p className="text-sm text-gray-600">Based on your service history</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {predictions.map((prediction, idx) => (
          <div 
            key={idx}
            className={`
              flex items-center justify-between p-4 rounded-xl border-2
              ${prediction.priority === 'high' ? 'bg-red-50 border-red-200' : ''}
              ${prediction.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' : ''}
              ${prediction.priority === 'low' ? 'bg-blue-50 border-blue-200' : ''}
            `}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`
                p-2 rounded-lg
                ${prediction.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                ${prediction.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${prediction.priority === 'low' ? 'bg-blue-100 text-blue-700' : ''}
              `}>
                {prediction.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">
                  {prediction.service}
                </div>
                <div className="text-sm text-gray-600">
                  {prediction.reason}
                </div>
              </div>
            </div>
            
            <div className={`
              px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap
              ${prediction.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
              ${prediction.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${prediction.priority === 'low' ? 'bg-blue-100 text-blue-700' : ''}
            `}>
              {prediction.dueIn}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
