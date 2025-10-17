# Calendar Component - Usage Guide

## 🚀 Quick Start

```tsx
import { Calendar, MaintenanceEvent, MAINTENANCE_TYPES } from '@/components/design-system'

// Sample maintenance events
const events: MaintenanceEvent[] = [
  {
    id: '1',
    title: 'Oil Change',
    description: '5W-30 synthetic oil change',
    type: 'oil_change',
    startDate: new Date('2025-01-15T10:00:00'),
    allDay: false,
    vehicleId: 'vehicle-123',
    vehicleName: '2022 Honda Accord',
    serviceProvider: 'Honda Service Center',
    location: '123 Main St, City, ST 12345',
    estimatedCost: 75.00,
    mileage: 35000,
    status: 'scheduled',
    reminderEnabled: true,
    reminderDays: 3,
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Tire Rotation',
    type: 'tire_rotation',
    startDate: new Date('2025-02-01T09:00:00'),
    allDay: true,
    vehicleName: '2022 Honda Accord',
    serviceProvider: 'Discount Tire',
    estimatedCost: 40.00,
    status: 'scheduled',
    createdAt: new Date()
  }
]

// Basic usage
function MaintenancePage() {
  return (
    <Container size="lg" useCase="data_tables">
      <Stack spacing="lg">
        <Heading level="h1">Maintenance Schedule</Heading>
        
        <Calendar
          events={events}
          onDateSelect={(date) => console.log('Selected:', date)}
          onEventClick={(event) => console.log('Event clicked:', event)}
        />
      </Stack>
    </Container>
  )
}
```

---

## 📋 Component Props

### **Calendar**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `events` | `MaintenanceEvent[]` | **required** | Array of maintenance events |
| `initialDate` | `Date` | `new Date()` | Initially selected date |
| `onDateSelect` | `(date: Date) => void` | - | Callback when date is clicked |
| `onEventClick` | `(event: MaintenanceEvent) => void` | - | Callback when event is clicked |
| `showEventDetails` | `boolean` | `true` | Show right sidebar with event details |
| `className` | `string` | - | Custom CSS class |

---

## 🎨 Sub-Components

### **EventCard**

Display individual maintenance event:

```tsx
import { EventCard } from '@/components/design-system'

<EventCard
  event={maintenanceEvent}
  onClick={() => console.log('Clicked')}
  showActions={true}
  compact={false}
/>
```

### **AddToCalendarButton**

Export event to external calendar:

```tsx
import { AddToCalendarButton } from '@/components/design-system'

<AddToCalendarButton 
  event={maintenanceEvent}
  variant="outline"
  size="default"
/>
```

---

## 🔧 Maintenance Types

Pre-configured types with icons and colors:

```tsx
import { MAINTENANCE_TYPES } from '@/components/design-system'

// Available types:
MAINTENANCE_TYPES.oil_change        // 🛢️ Oil Change (blue)
MAINTENANCE_TYPES.tire_rotation     // 🔄 Tire Rotation (purple)
MAINTENANCE_TYPES.inspection        // 🔍 Inspection (green)
MAINTENANCE_TYPES.brake_service     // 🛑 Brake Service (red)
MAINTENANCE_TYPES.battery_check     // 🔋 Battery Check (yellow)
MAINTENANCE_TYPES.filter_replacement // 🌬️ Filter Replacement (cyan)
MAINTENANCE_TYPES.fluid_check       // 💧 Fluid Check (indigo)
MAINTENANCE_TYPES.general_maintenance // 🔧 General Maintenance (slate)
MAINTENANCE_TYPES.recall            // ⚠️ Recall Service (orange)
MAINTENANCE_TYPES.custom            // 📝 Custom (gray)

// Each type has:
{
  type: 'oil_change',
  label: 'Oil Change',
  icon: '🛢️',
  color: 'blue',
  defaultIntervalMonths: 3,
  defaultIntervalMiles: 3000,
  description: 'Regular oil and filter change'
}
```

---

## 📅 Calendar Integration

### **Export to Google Calendar**

```tsx
import { openCalendarLink } from '@/components/design-system'

openCalendarLink(event, 'google')
```

### **Export to Outlook**

```tsx
openCalendarLink(event, 'outlook')
```

### **Download .ics (Apple Calendar, etc.)**

```tsx
import { downloadICS } from '@/components/design-system'

downloadICS(event, 'oil-change.ics')
```

### **Generate .ics Content**

```tsx
import { generateICS } from '@/components/design-system'

const icsContent = generateICS(event)
// Use for API endpoints, email attachments, etc.
```

---

## 🎯 Advanced Usage

### **Custom Layout (No Sidebar)**

```tsx
<Calendar
  events={events}
  showEventDetails={false}
  className="max-w-4xl mx-auto"
/>
```

### **With Event Modal**

```tsx
function CalendarWithModal() {
  const [selectedEvent, setSelectedEvent] = useState<MaintenanceEvent>()
  
  return (
    <>
      <Calendar
        events={events}
        onEventClick={setSelectedEvent}
      />
      
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(undefined)}
        title={selectedEvent?.title}
      >
        <EventCard event={selectedEvent!} showActions={true} />
        <AddToCalendarButton event={selectedEvent!} />
      </Modal>
    </>
  )
}
```

### **Dashboard Widget (Upcoming Events)**

```tsx
function UpcomingMaintenance({ events }: { events: MaintenanceEvent[] }) {
  const upcoming = events
    .filter(e => e.status === 'scheduled')
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3)
  
  return (
    <Card>
      <Stack spacing="md">
        <Heading level="h3">Upcoming Maintenance</Heading>
        {upcoming.map(event => (
          <EventCard
            key={event.id}
            event={event}
            compact={true}
            onClick={() => router.push(`/maintenance/${event.id}`)}
          />
        ))}
      </Stack>
    </Card>
  )
}
```

---

## 🔄 Recurring Events (Future Phase)

Structure is already in place:

```tsx
const recurringEvent: MaintenanceEvent = {
  // ...other fields
  isRecurring: true,
  recurrence: {
    frequency: 'monthly',
    interval: 3,  // Every 3 months
    endDate: new Date('2026-01-01')
  }
}
```

The `.ics` export already supports RRULE format!

---

## 📱 Responsive Design

- **Mobile (< 640px):** Single column, stacked layout
- **Tablet (640px - 1024px):** Calendar with compact sidebar
- **Desktop (> 1024px):** Full 2-column layout (calendar + details)

Grid automatically adjusts using `lg:grid-cols-3`

---

## ♿ Accessibility

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ ARIA labels for screen readers
- ✅ Focus management
- ✅ Color + text (not color alone) for status
- ✅ Touch-friendly buttons (44px minimum)

---

## 🎨 Styling

Uses Tailwind + design system tokens:

```tsx
// Custom styling
<Calendar
  className="shadow-lg rounded-xl border"
  events={events}
/>

// Event status colors
'scheduled' → blue
'completed' → green
'cancelled' → gray
'overdue' → red
```

---

## 🚀 Next Phase Features

**Phase 2 will add:**
- Event creation modal (click empty date → create event)
- Edit/delete events
- Mileage-based reminders ("every 3,000 miles")
- Bulk export all events
- Agenda/list view
- Week/day view options

---

## 💡 Pro Tips

1. **Sort events server-side** - Don't send thousands of events to the client
2. **Use status 'overdue'** - Automatically highlight past incomplete events
3. **Enable reminders** - Users' calendars will remind them
4. **Estimate costs** - Helps users budget maintenance
5. **Link to vehicles** - Filter by vehicle in multi-car households

---

**Calendar Component is production-ready for Phase 1!** 🎉📅✨
