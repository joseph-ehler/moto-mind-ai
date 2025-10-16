/**
 * Timeline Insights Component
 * 
 * Analyzes timeline data and provides intelligent suggestions,
 * warnings, and maintenance predictions
 */

'use client'

import { useMemo } from 'react'
import { AlertCircle, TrendingUp, Calendar, Wrench, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { TimelineItem, TimelineFilter } from '@/types/timeline'
import { motion } from 'framer-motion'

interface TimelineInsightsProps {
  items: TimelineItem[]
  onFilterClick?: (filter: TimelineFilter) => void
}

interface Insight {
  type: 'warning' | 'info' | 'success' | 'alert'
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    filter?: TimelineFilter
  }
}

export function TimelineInsights({ items, onFilterClick }: TimelineInsightsProps) {
  const insights = useMemo(() => {
    const insights: Insight[] = []
    
    // 1. Check for recent warnings
    const recentWarnings = items.filter(item => 
      item.type === 'dashboard_warning' && 
      isRecent(item.timestamp, 30) // Last 30 days
    )
    
    if (recentWarnings.length > 0) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: `${recentWarnings.length} Recent Warning${recentWarnings.length > 1 ? 's' : ''}`,
        description: 'Dashboard warnings detected in the last 30 days',
        action: {
          label: 'View warnings',
          filter: 'warnings'
        }
      })
    }
    
    // 2. Maintenance interval analysis
    const maintenanceEvents = items.filter(item => 
      item.type === 'service' || item.type === 'maintenance'
    ).sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    
    if (maintenanceEvents.length > 0) {
      const lastMaintenance = maintenanceEvents[0]
      const daysSince = getDaysSince(lastMaintenance.timestamp)
      
      if (daysSince > 90) {
        insights.push({
          type: 'alert',
          icon: <Wrench className="w-5 h-5" />,
          title: 'Maintenance Overdue',
          description: `Last service was ${daysSince} days ago. Consider scheduling maintenance.`,
          action: {
            label: 'View history',
            filter: 'service'
          }
        })
      } else if (daysSince > 60) {
        insights.push({
          type: 'info',
          icon: <Calendar className="w-5 h-5" />,
          title: 'Maintenance Due Soon',
          description: `Last service was ${daysSince} days ago. Plan ahead for upcoming maintenance.`,
          action: {
            label: 'View history',
            filter: 'service'
          }
        })
      }
    }
    
    // 3. Spending trend analysis
    const last30Days = items.filter(item => isRecent(item.timestamp, 30))
    const last30Cost = calculateTotalCost(last30Days)
    const prev30Days = items.filter(item => 
      !isRecent(item.timestamp, 30) && isRecent(item.timestamp, 60)
    )
    const prev30Cost = calculateTotalCost(prev30Days)
    
    if (last30Cost > prev30Cost * 1.5 && last30Cost > 200) {
      insights.push({
        type: 'warning',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Spending Increased',
        description: `Spent $${last30Cost.toFixed(0)} in last 30 days (${Math.round((last30Cost / prev30Cost - 1) * 100)}% increase)`,
        action: {
          label: 'Review costs',
          filter: 'all'
        }
      })
    } else if (last30Cost < prev30Cost * 0.5 && prev30Cost > 100) {
      insights.push({
        type: 'success',
        icon: <DollarSign className="w-5 h-5" />,
        title: 'Lower Expenses',
        description: `Spent $${last30Cost.toFixed(0)} in last 30 days (${Math.round((1 - last30Cost / prev30Cost) * 100)}% decrease)`,
        action: {
          label: 'View details',
          filter: 'all'
        }
      })
    }
    
    // 4. Document expiration (if any insurance/registration docs)
    const documents = items.filter(item => item.type === 'document')
    if (documents.length > 0) {
      const hasInsurance = documents.some(doc => 
        ((doc.extracted_data as any)?.document_type || '').toLowerCase().includes('insurance')
      )
      const hasRegistration = documents.some(doc => 
        ((doc.extracted_data as any)?.document_type || '').toLowerCase().includes('registration')
      )
      
      if (!hasInsurance || !hasRegistration) {
        insights.push({
          type: 'info',
          icon: <Info className="w-5 h-5" />,
          title: 'Add Important Documents',
          description: 'Keep insurance and registration handy by adding them to your timeline',
          action: {
            label: 'View documents',
            filter: 'documents'
          }
        })
      }
    }
    
    // 5. Tire maintenance check
    const tireEvents = items.filter(item => 
      item.type === 'tire_tread' || item.type === 'tire_pressure'
    )
    if (tireEvents.length === 0 && items.length > 10) {
      insights.push({
        type: 'info',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Check Your Tires',
        description: 'No tire checks recorded. Regular monitoring improves safety and fuel economy.',
        action: {
          label: 'Learn more',
          filter: 'tires'
        }
      })
    }
    
    return insights
  }, [items])
  
  if (insights.length === 0) {
    return null
  }
  
  return (
    <div className="space-y-3 mb-6">
      {insights.map((insight, idx) => (
        <motion.div
          key={idx}
          initial={false}
          className={`
            rounded-xl p-4 border-2 cursor-pointer transition-all
            ${insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300' : ''}
            ${insight.type === 'alert' ? 'bg-red-50 border-red-200 hover:border-red-300' : ''}
            ${insight.type === 'success' ? 'bg-green-50 border-green-200 hover:border-green-300' : ''}
            ${insight.type === 'info' ? 'bg-blue-50 border-blue-200 hover:border-blue-300' : ''}
          `}
          onClick={() => insight.action?.filter && onFilterClick?.(insight.action.filter)}
        >
          <div className="flex items-start gap-3">
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${insight.type === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${insight.type === 'alert' ? 'bg-red-100 text-red-700' : ''}
              ${insight.type === 'success' ? 'bg-green-100 text-green-700' : ''}
              ${insight.type === 'info' ? 'bg-blue-100 text-blue-700' : ''}
            `}>
              {insight.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 mb-1">
                {insight.title}
              </div>
              <div className="text-sm text-gray-600">
                {insight.description}
              </div>
            </div>
            
            {insight.action && (
              <button 
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0
                  ${insight.type === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                  ${insight.type === 'alert' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                  ${insight.type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                  ${insight.type === 'info' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                `}
              >
                {insight.action.label}
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Helper functions
function isRecent(timestamp: Date | string | undefined, days: number): boolean {
  if (!timestamp) return false
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= days
}

function getDaysSince(timestamp: Date | string | undefined): number {
  if (!timestamp) return 999
  const date = new Date(timestamp)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function calculateTotalCost(items: TimelineItem[]): number {
  return items.reduce((sum, item) => {
    const cost = (item.extracted_data as any)?.cost || 0
    return sum + cost
  }, 0)
}
