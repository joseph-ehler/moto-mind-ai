'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wrench, 
  Fuel, 
  Gauge, 
  FileText,
  ChevronRight 
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/time'

interface TimelineEvent {
  id: string
  type: string
  summary?: string
  captured_at: string
  date?: string
  created_at?: string
  miles?: number
  total_amount?: number
  vendor?: string
  station?: string
  gallons?: number
}

interface RecentActivityCardProps {
  events: TimelineEvent[]
  onViewAll: () => void
}

export function RecentActivityCard({ events, onViewAll }: RecentActivityCardProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'service':
      case 'maintenance':
        return Wrench
      case 'fuel':
        return Fuel
      case 'odometer':
        return Gauge
      default:
        return FileText
    }
  }

  const getEventSummary = (event: TimelineEvent) => {
    // Use server-provided summary if available
    if (event.summary) {
      return event.summary
    }

    // Fallback to client-side summary generation
    switch (event.type) {
      case 'service':
      case 'maintenance':
        return `${event.vendor || 'Service'} • ${event.total_amount ? `$${event.total_amount}` : 'Service completed'}`
      case 'fuel':
        return `${event.gallons ? `${event.gallons} gal` : 'Fuel'} • ${event.station || 'Gas station'} • ${event.total_amount ? `$${event.total_amount}` : ''}`
      case 'odometer':
      default:
        return 'Document uploaded'
    }
  }

  const recentEvents = events.slice(0, 4) // Show last 4 events

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">Recent Activity</h2>
          <button 
            onClick={onViewAll}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {recentEvents.length > 0 ? (
          <div className="space-y-6">
            {recentEvents.map((event) => {
              const Icon = getEventIcon(event.type)
              // Use created_at if available, fallback to captured_at
              const timeToDisplay = event.created_at || event.captured_at
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-black/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black text-lg leading-tight">
                      {getEventSummary(event)}
                    </p>
                    <p className="text-sm text-black/60 mt-1">
                      {formatRelativeTime(timeToDisplay)}
                      {event.miles && (
                        <span className="ml-2">• {event.miles.toLocaleString()} mi</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-black/40" />
            </div>
            <p className="text-black/70 text-lg font-medium">No activity yet</p>
            <p className="text-sm text-black/50 mt-1">Start by capturing your dashboard</p>
          </div>
        )}
    </div>
  )
}
