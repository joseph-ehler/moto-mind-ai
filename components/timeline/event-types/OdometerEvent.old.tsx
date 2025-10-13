/**
 * Odometer Event Renderer - REDESIGNED
 */

import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const OdometerEvent: EventTypeRenderer = {
  getTitle: () => 'Odometer Reading',
  
  getSubtitle: (item) => {
    if (item.mileage) {
      return `${item.mileage.toLocaleString()} miles`
    }
    return null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    
    // 📊 Current Mileage (Hero metric)
    if (item.mileage && item.mileage > 0) {
      const mileageDisplay = (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 leading-none tracking-tight">
              {item.mileage.toLocaleString()}
            </span>
            <span className="text-lg text-gray-600 font-medium">miles</span>
          </div>
          {data.vehicle_age && (
            <span className="text-sm text-gray-500">
              {data.vehicle_age} old
            </span>
          )}
        </div>
      )
      rows.push({ label: 'Current Mileage', value: mileageDisplay })
    }
    
    // 🚗 Trip Distance
    const tripA = data.trip_a || data.trip_distance
    const tripB = data.trip_b
    
    if (tripA || tripB) {
      const tripDisplay = (
        <div className="flex flex-col gap-2">
          {tripA && (
            <div className="flex items-center justify-between gap-3 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Trip A</span>
              </div>
              <span className="text-base font-bold text-blue-900">
                {tripA.toLocaleString()} mi
              </span>
            </div>
          )}
          {tripB && (
            <div className="flex items-center justify-between gap-3 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Trip B</span>
              </div>
              <span className="text-base font-bold text-purple-900">
                {tripB.toLocaleString()} mi
              </span>
            </div>
          )}
        </div>
      )
      rows.push({ label: 'Trip Meters', value: tripDisplay })
    }
    
    // 📈 Average mileage per day/month/year
    const avgDaily = data.avg_miles_per_day || data.daily_average
    const avgMonthly = data.avg_miles_per_month || data.monthly_average
    const avgYearly = data.avg_miles_per_year || data.yearly_average
    
    if (avgDaily || avgMonthly || avgYearly) {
      const avgDisplay = (
        <div className="grid grid-cols-1 gap-2">
          {avgDaily && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Daily</span>
              <span className="font-semibold text-gray-900">{avgDaily.toLocaleString()} mi/day</span>
            </div>
          )}
          {avgMonthly && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly</span>
              <span className="font-semibold text-gray-900">{avgMonthly.toLocaleString()} mi/mo</span>
            </div>
          )}
          {avgYearly && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Yearly</span>
              <span className="font-semibold text-gray-900">{avgYearly.toLocaleString()} mi/yr</span>
            </div>
          )}
        </div>
      )
      rows.push({ label: 'Averages', value: avgDisplay })
    }
    
    // 🎯 Milestone indicator
    if (item.mileage) {
      const milestones = [10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000]
      const recentMilestone = milestones.reverse().find(m => item.mileage && item.mileage >= m)
      const nextMilestone = milestones.reverse().find(m => item.mileage && item.mileage < m)
      
      if (recentMilestone && item.mileage - recentMilestone < 100) {
        // Just passed a milestone!
        rows.push({
          label: 'Milestone',
          value: (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <span className="text-2xl">🎉</span>
              <span className="text-sm font-bold text-orange-700">
                {recentMilestone.toLocaleString()} miles!
              </span>
            </span>
          )
        })
      } else if (nextMilestone) {
        const remaining = nextMilestone - item.mileage
        if (remaining < 1000) {
          rows.push({
            label: 'Next Milestone',
            value: (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {remaining.toLocaleString()} miles to {nextMilestone.toLocaleString()}
                </span>
              </div>
            )
          })
        }
      }
    }
    
    // 📅 Days since last reading
    const lastReadingDate = data.last_reading_date || data.previous_reading_date
    if (lastReadingDate) {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(lastReadingDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      rows.push({
        label: 'Last Reading',
        value: (
          <span className="text-sm text-gray-600 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {daysSince} days ago
          </span>
        )
      })
    }
    
    return rows
  }
}
