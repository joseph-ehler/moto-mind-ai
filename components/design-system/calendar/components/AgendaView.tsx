/**
 * AgendaView Component
 * 
 * List view of upcoming maintenance events grouped by date
 */

import * as React from 'react'
import { Stack, Flex } from '../../primitives/Layout'
import { MaintenanceEvent } from '../types'
import { EventCard } from './EventCard'
import { formatDate, isToday, isPast, daysBetween } from '../utils/dateUtils'

interface AgendaViewProps {
  events: MaintenanceEvent[]
  onEventClick?: (event: MaintenanceEvent) => void
  daysToShow?: number
  className?: string
}

export function AgendaView({
  events,
  onEventClick,
  daysToShow = 90,
  className
}: AgendaViewProps) {
  // Group events by date
  const groupedEvents = React.useMemo(() => {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysToShow)
    
    // Filter events within the date range
    const filteredEvents = events
      .filter(event => {
        const eventDate = event.startDate
        return eventDate >= now && eventDate <= futureDate
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    
    // Group by date
    const groups = new Map<string, MaintenanceEvent[]>()
    
    filteredEvents.forEach(event => {
      const dateKey = event.startDate.toDateString()
      const existing = groups.get(dateKey) || []
      groups.set(dateKey, [...existing, event])
    })
    
    return Array.from(groups.entries()).map(([dateKey, events]) => ({
      date: new Date(dateKey),
      events
    }))
  }, [events, daysToShow])
  
  const hasUpcoming = groupedEvents.length > 0
  const overdueEvents = events.filter(e => e.status === 'overdue')
  
  return (
    <Stack spacing="lg" className={className}>
      {/* Overdue Section */}
      {overdueEvents.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-3">
            Overdue ({overdueEvents.length})
          </h3>
          <Stack spacing="sm">
            {overdueEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                compact={true}
                onClick={() => onEventClick?.(event)}
              />
            ))}
          </Stack>
        </div>
      )}
      
      {/* Upcoming Events */}
      {hasUpcoming ? (
        <Stack spacing="lg">
          {groupedEvents.map(({ date, events }) => (
            <div key={date.toDateString()}>
              <DateHeader date={date} />
              <Stack spacing="sm" className="mt-2">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact={true}
                    onClick={() => onEventClick?.(event)}
                  />
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No upcoming maintenance in the next {daysToShow} days</p>
          <p className="text-slate-400 text-xs mt-1">You're all caught up! ✨</p>
        </div>
      )}
    </Stack>
  )
}

// Date header component
function DateHeader({ date }: { date: Date }) {
  const dateIsToday = isToday(date)
  const daysAway = daysBetween(new Date(), date)
  
  let timelineLabel = ''
  if (dateIsToday) {
    timelineLabel = 'Today'
  } else if (daysAway === 1) {
    timelineLabel = 'Tomorrow'
  } else if (daysAway < 7) {
    timelineLabel = `In ${daysAway} days`
  }
  
  return (
    <div className="pb-2 mb-2 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-slate-900">
        {formatDate(date, 'long')}
        {timelineLabel && (
          <span className="ml-2 text-xs font-normal text-slate-500">• {timelineLabel}</span>
        )}
      </h3>
    </div>
  )
}
