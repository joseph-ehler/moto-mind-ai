/**
 * Calendar Component Showcase
 * 
 * Demonstrates all Calendar features:
 * - Phase 1: View events, export to external calendars
 * - Phase 2: Create, edit, delete events, recurring events, agenda view
 */

'use client'

import * as React from 'react'
import {
  Container,
  Section,
  Stack,
  Flex,
  Heading,
  Text,
  Card,
  Button,
  Calendar,
  EventFormData,
  MaintenanceEvent,
  MAINTENANCE_TYPES
} from '@/components/design-system'
import { Sparkles, Plus, Trash2 } from 'lucide-react'

export default function CalendarShowcasePage() {
  // Sample events state
  const [events, setEvents] = React.useState<MaintenanceEvent[]>([
    {
      id: '1',
      title: 'Oil Change',
      description: '5W-30 synthetic oil change with filter replacement',
      type: 'oil_change',
      startDate: new Date('2025-01-15T10:00:00'),
      allDay: false,
      vehicleId: 'vehicle-1',
      vehicleName: '2022 Honda Accord',
      serviceProvider: 'Honda Service Center',
      location: '123 Main St, City, ST 12345',
      estimatedCost: 75.00,
      mileage: 35000,
      status: 'scheduled',
      reminderEnabled: true,
      reminderDays: 3,
      createdAt: new Date('2024-12-01')
    },
    {
      id: '2',
      title: 'Tire Rotation',
      type: 'tire_rotation',
      startDate: new Date('2025-02-01T09:00:00'),
      allDay: true,
      vehicleId: 'vehicle-1',
      vehicleName: '2022 Honda Accord',
      serviceProvider: 'Discount Tire',
      estimatedCost: 40.00,
      status: 'scheduled',
      createdAt: new Date('2024-12-15')
    },
    {
      id: '3',
      title: 'State Inspection',
      type: 'inspection',
      startDate: new Date('2025-03-01T14:00:00'),
      allDay: false,
      vehicleId: 'vehicle-1',
      vehicleName: '2022 Honda Accord',
      serviceProvider: 'Quick Lube',
      estimatedCost: 25.00,
      status: 'scheduled',
      createdAt: new Date('2024-12-20')
    },
    {
      id: '4',
      title: 'Brake Inspection',
      description: 'Check brake pads and rotors',
      type: 'brake_service',
      startDate: new Date('2024-12-15T11:00:00'),
      allDay: false,
      vehicleId: 'vehicle-1',
      vehicleName: '2022 Honda Accord',
      status: 'overdue',
      estimatedCost: 150.00,
      createdAt: new Date('2024-11-01')
    }
  ])
  
  const [showDemo, setShowDemo] = React.useState(true)
  
  // Sample vehicles
  const vehicles = [
    { id: 'vehicle-1', name: '2022 Honda Accord' },
    { id: 'vehicle-2', name: '2019 Toyota Camry' },
    { id: 'vehicle-3', name: '2021 Ford F-150' }
  ]
  
  // Event handlers
  const handleCreate = async (data: EventFormData) => {
    const newEvent: MaintenanceEvent = {
      id: `event-${Date.now()}`,
      ...data,
      status: 'scheduled',
      createdAt: new Date()
    }
    
    setEvents(prev => [...prev, newEvent])
    console.log('Created event:', newEvent)
  }
  
  const handleUpdate = async (id: string, data: EventFormData) => {
    setEvents(prev => prev.map(e => 
      e.id === id 
        ? { ...e, ...data, updatedAt: new Date() } 
        : e
    ))
    console.log('Updated event:', id, data)
  }
  
  const handleDelete = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    console.log('Deleted event:', id)
  }
  
  const handleClearAll = () => {
    setEvents([])
  }
  
  const handleAddSampleData = () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const nextMonth = new Date(today)
    nextMonth.setMonth(today.getMonth() + 1)
    
    const sampleEvents: MaintenanceEvent[] = [
      {
        id: `sample-${Date.now()}-1`,
        title: 'Battery Check',
        type: 'battery_check',
        startDate: nextWeek,
        allDay: true,
        vehicleId: 'vehicle-2',
        vehicleName: '2019 Toyota Camry',
        status: 'scheduled',
        estimatedCost: 30.00,
        createdAt: new Date()
      },
      {
        id: `sample-${Date.now()}-2`,
        title: 'Filter Replacement',
        type: 'filter_replacement',
        startDate: nextMonth,
        allDay: true,
        vehicleId: 'vehicle-3',
        vehicleName: '2021 Ford F-150',
        status: 'scheduled',
        estimatedCost: 45.00,
        createdAt: new Date()
      }
    ]
    
    setEvents(prev => [...prev, ...sampleEvents])
  }
  
  return (
    <Container 
      size="xl" 
      useCase="data_tables"
      override={{
        reason: "Calendar requires wide layout for month grid and sidebar",
        approvedBy: "Calendar Showcase"
      }}
    >
      <Section spacing="xl">
        {/* Header */}
        <Stack spacing="md">
          <Flex align="center" gap="sm">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <Heading level="hero">Calendar Component Showcase</Heading>
          </Flex>
          <Text className="text-lg text-slate-600">
            Complete maintenance scheduling system with Phase 1 & 2 features
          </Text>
        </Stack>
        
        {/* Demo Controls */}
        {showDemo && (
          <Card className="border-blue-200 bg-blue-50">
            <Stack spacing="md">
              <Flex align="center" justify="between">
                <div>
                  <Heading level="title" className="text-blue-900">
                    🎯 Demo Mode
                  </Heading>
                  <Text className="text-sm text-blue-700 mt-1">
                    Try all features: Click dates to create, click events to edit
                  </Text>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDemo(false)}
                >
                  Hide
                </Button>
              </Flex>
              
              <Flex gap="sm" className="flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSampleData}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample Events
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Events
                </Button>
              </Flex>
            </Stack>
          </Card>
        )}
        
        {/* Features List */}
        <Card>
          <Stack spacing="md">
            <Heading level="title">✨ Features Demonstrated</Heading>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Stack spacing="xs">
                <Text className="font-semibold text-sm">Phase 1 Features:</Text>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• Month view with event indicators</li>
                  <li>• Event cards with full details</li>
                  <li>• Export to Google Calendar, Outlook, Apple</li>
                  <li>• Status badges (scheduled, overdue, completed)</li>
                  <li>• Maintenance type icons and colors</li>
                </ul>
              </Stack>
              
              <Stack spacing="xs">
                <Text className="font-semibold text-sm">Phase 2 Features:</Text>
                <ul className="text-sm text-slate-600 space-y-1 ml-4">
                  <li>• Click empty dates to create events</li>
                  <li>• Click events to edit or delete</li>
                  <li>• Recurring event configuration</li>
                  <li>• Agenda view (upcoming list)</li>
                  <li>• Form validation and error handling</li>
                  <li>• Vehicle selection and mileage tracking</li>
                </ul>
              </Stack>
            </div>
          </Stack>
        </Card>
        
        {/* Event Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <Stack spacing="xs">
              <Text className="text-sm text-slate-600">Total Events</Text>
              <Text className="text-2xl font-bold">{events.length}</Text>
            </Stack>
          </Card>
          
          <Card>
            <Stack spacing="xs">
              <Text className="text-sm text-slate-600">Scheduled</Text>
              <Text className="text-2xl font-bold text-blue-600">
                {events.filter(e => e.status === 'scheduled').length}
              </Text>
            </Stack>
          </Card>
          
          <Card>
            <Stack spacing="xs">
              <Text className="text-sm text-slate-600">Overdue</Text>
              <Text className="text-2xl font-bold text-red-600">
                {events.filter(e => e.status === 'overdue').length}
              </Text>
            </Stack>
          </Card>
          
          <Card>
            <Stack spacing="xs">
              <Text className="text-sm text-slate-600">This Month</Text>
              <Text className="text-2xl font-bold text-green-600">
                {events.filter(e => {
                  const eventDate = new Date(e.startDate)
                  const now = new Date()
                  return eventDate.getMonth() === now.getMonth() &&
                         eventDate.getFullYear() === now.getFullYear()
                }).length}
              </Text>
            </Stack>
          </Card>
        </div>
        
        {/* Calendar Component */}
        <Card>
          <Calendar
            events={events}
            onEventCreate={handleCreate}
            onEventUpdate={handleUpdate}
            onEventDelete={handleDelete}
            vehicles={vehicles}
          />
        </Card>
        
        {/* Maintenance Types Reference */}
        <Card>
          <Stack spacing="md">
            <Heading level="title">🔧 Maintenance Types</Heading>
            <Text className="text-sm text-slate-600">
              10 pre-configured maintenance types with icons, colors, and default intervals
            </Text>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.values(MAINTENANCE_TYPES).map(type => {
                const IconComponent = type.icon
                return (
                  <div
                    key={type.type}
                    className="p-3 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <Stack spacing="xs">
                      <IconComponent className="w-8 h-8" />
                      <Text className="text-xs font-medium">{type.label}</Text>
                    {type.defaultIntervalMonths && (
                      <Text className="text-xs text-slate-500">
                        Every {type.defaultIntervalMonths} mo
                      </Text>
                    )}
                  </Stack>
                </div>
                )
              })}
            </div>
          </Stack>
        </Card>
        
        {/* Usage Example */}
        <Card className="bg-slate-900 text-white">
          <Stack spacing="md">
            <Heading level="title" className="text-white">💻 Usage Example</Heading>
            <pre className="text-xs overflow-x-auto bg-slate-800 p-4 rounded">
{`import { Calendar, EventFormData } from '@/components/design-system'

function MaintenancePage() {
  const [events, setEvents] = useState<MaintenanceEvent[]>([])
  
  const handleCreate = async (data: EventFormData) => {
    const newEvent = {
      id: generateId(),
      ...data,
      status: 'scheduled',
      createdAt: new Date()
    }
    await api.createEvent(newEvent)
    setEvents(prev => [...prev, newEvent])
  }
  
  return (
    <Calendar
      events={events}
      onEventCreate={handleCreate}
      onEventUpdate={handleUpdate}
      onEventDelete={handleDelete}
      vehicles={vehicles}
    />
  )
}`}
            </pre>
          </Stack>
        </Card>
        
        {/* Footer Info */}
        <Card className="border-green-200 bg-green-50">
          <Stack spacing="sm">
            <Flex align="center" gap="sm">
              <span className="text-2xl">✅</span>
              <Heading level="subtitle" className="text-green-900">
                Production Ready
              </Heading>
            </Flex>
            <Text className="text-sm text-green-700">
              All features are fully functional, typed, validated, and ready for production use.
              The Calendar integrates seamlessly with your backend through the provided callbacks.
            </Text>
          </Stack>
        </Card>
      </Section>
    </Container>
  )
}
