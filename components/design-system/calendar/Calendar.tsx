/**
 * Calendar Component
 * 
 * Main calendar component for maintenance scheduling with external calendar integration
 * 
 * FEATURES:
 * - Month view with maintenance events
 * - Agenda view (list of upcoming events)
 * - Click dates to create events
 * - Click events to view/edit/delete
 * - Export to Google Calendar, Outlook, Apple Calendar
 * - Recurring events support
 * - Responsive and accessible
 * 
 * PHASE 1: View + "Add to Calendar" integration
 * PHASE 2: Event creation, editing, recurring events, agenda view
 */

'use client'

import * as React from 'react'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Stack, Flex } from '../primitives/Layout'
import { Button } from '@/components/ui/button'
import { MaintenanceEvent } from './types'
import { MonthView } from './components/MonthView'
import { AgendaView } from './components/AgendaView'
import { EventCard } from './components/EventCard'
import { AddToCalendarButton } from './components/AddToCalendarButton'
import { EventFormModal, EventFormData } from './components/EventFormModal'

export interface CalendarProps {
  /** Array of maintenance events to display */
  events: MaintenanceEvent[]
  
  /** Initially selected date */
  initialDate?: Date
  
  /** Callback when a date is selected */
  onDateSelect?: (date: Date) => void
  
  /** Callback when an event is clicked */
  onEventClick?: (event: MaintenanceEvent) => void
  
  /** Show event details panel */
  showEventDetails?: boolean
  
  /** Custom className */
  className?: string
  
  // PHASE 2: Event Management
  /** Callback when creating a new event */
  onEventCreate?: (data: EventFormData) => Promise<void> | void
  
  /** Callback when updating an event */
  onEventUpdate?: (id: string, data: EventFormData) => Promise<void> | void
  
  /** Callback when deleting an event */
  onEventDelete?: (id: string) => Promise<void> | void
  
  /** Current view mode */
  view?: 'month' | 'agenda'
  
  /** Callback when view changes */
  onViewChange?: (view: 'month' | 'agenda') => void
  
  /** Available vehicles for selection */
  vehicles?: Array<{ id: string; name: string }>
}

export function Calendar({
  events,
  initialDate,
  onDateSelect,
  onEventClick,
  showEventDetails = true,
  className,
  // Phase 2
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  view: controlledView,
  onViewChange,
  vehicles
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(initialDate || new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(initialDate)
  const [selectedEvent, setSelectedEvent] = React.useState<MaintenanceEvent | undefined>()
  
  // Phase 2: Event form state
  const [showEventForm, setShowEventForm] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<MaintenanceEvent | undefined>()
  const [formInitialDate, setFormInitialDate] = React.useState<Date | undefined>()
  
  // Phase 2: View state (controlled or uncontrolled)
  const [internalView, setInternalView] = React.useState<'month' | 'agenda'>('month')
  const currentView = controlledView !== undefined ? controlledView : internalView
  
  // Get events for selected date
  const selectedDateEvents = React.useMemo(() => {
    if (!selectedDate) return []
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate)
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      )
    })
  }, [events, selectedDate])
  
  // Phase 2: Event handlers
  const handleViewChange = (view: 'month' | 'agenda') => {
    if (controlledView === undefined) {
      setInternalView(view)
    }
    onViewChange?.(view)
  }
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(undefined)
    onDateSelect?.(date)
    
    // Phase 2: If onEventCreate provided, clicking empty date opens form
    if (onEventCreate) {
      setFormInitialDate(date)
      setEditingEvent(undefined)
      setShowEventForm(true)
    }
  }
  
  const handleEventClick = (event: MaintenanceEvent) => {
    setSelectedEvent(event)
    onEventClick?.(event)
    
    // Phase 2: If onEventUpdate provided, open edit form
    if (onEventUpdate) {
      setEditingEvent(event)
      setShowEventForm(true)
    }
  }
  
  const handleEventFormSubmit = async (data: EventFormData) => {
    try {
      if (editingEvent) {
        await onEventUpdate?.(editingEvent.id, data)
      } else {
        await onEventCreate?.(data)
      }
      setShowEventForm(false)
      setEditingEvent(undefined)
      setFormInitialDate(undefined)
    } catch (error) {
      console.error('Failed to save event:', error)
      // Error handling could be enhanced with a toast/notification
    }
  }
  
  const handleEventDelete = async () => {
    if (editingEvent) {
      try {
        await onEventDelete?.(editingEvent.id)
        setShowEventForm(false)
        setEditingEvent(undefined)
        setSelectedEvent(undefined)
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }
  
  return (
    <>
      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6", className)}>
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Stack spacing="md">
            {/* Phase 2: View Switcher */}
            <Flex gap="xs">
              <Button
                variant={currentView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('month')}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Month
              </Button>
              <Button
                variant={currentView === 'agenda' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewChange('agenda')}
              >
                <List className="h-4 w-4 mr-2" />
                Agenda
              </Button>
            </Flex>
            
            {/* Conditional View Rendering */}
            {currentView === 'month' ? (
              <MonthView
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                events={events}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
              />
            ) : (
              <AgendaView
                events={events}
                onEventClick={handleEventClick}
                daysToShow={90}
              />
            )}
          </Stack>
        </div>
      
      {/* Event Details Sidebar */}
      {showEventDetails && (
        <div className="lg:col-span-1">
          <Stack spacing="md">
            {/* Selected Event Details */}
            {selectedEvent ? (
              <Stack spacing="md">
                <h3 className="text-lg font-semibold">Event Details</h3>
                <EventCard
                  event={selectedEvent}
                  showActions={false}
                />
                <AddToCalendarButton event={selectedEvent} />
              </Stack>
            ) : selectedDate && selectedDateEvents.length > 0 ? (
              /* Events for selected date */
              <Stack spacing="md">
                <h3 className="text-lg font-semibold">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                {selectedDateEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact={true}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </Stack>
            ) : selectedDate ? (
              /* No events for selected date */
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">No events scheduled</p>
                <p className="text-xs mt-1">
                  {selectedDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            ) : (
              /* No date selected */
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm">Select a date to view events</p>
              </div>
            )}
          </Stack>
        </div>
      )}
      </div>
      
      {/* Phase 2: Event Form Modal */}
      {(onEventCreate || onEventUpdate) && (
        <EventFormModal
          isOpen={showEventForm}
          onClose={() => {
            setShowEventForm(false)
            setEditingEvent(undefined)
            setFormInitialDate(undefined)
          }}
          onSubmit={handleEventFormSubmit}
          onDelete={editingEvent && onEventDelete ? handleEventDelete : undefined}
          initialData={editingEvent || (formInitialDate ? { startDate: formInitialDate } : undefined)}
          mode={editingEvent ? 'edit' : 'create'}
          vehicles={vehicles}
        />
      )}
    </>
  )
}

// Re-export sub-components for advanced usage
export { EventCard } from './components/EventCard'
export { AddToCalendarButton } from './components/AddToCalendarButton'
export { MonthView } from './components/MonthView'

// Re-export types
export type {
  MaintenanceEvent,
  MaintenanceType,
  CalendarViewProps
} from './types'

// Re-export utilities
export {
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateICS,
  downloadICS,
  openCalendarLink
} from './utils/addToCalendar'

export { MAINTENANCE_TYPES } from './types'
