# Calendar Phase 2 - Integration Guide

## 🎉 Phase 2 Components Built

### **1. EventFormModal** - Create & Edit Events
Full-featured form for maintenance event management.

**Features:**
- ✅ 10 maintenance type selector with icons
- ✅ Title, date, vehicle, location, service provider
- ✅ Cost and mileage tracking
- ✅ Reminder configuration (days before)
- ✅ Notes/description
- ✅ Form validation with error messages
- ✅ Edit mode with delete button
- ✅ Mobile responsive (grid layouts adapt)

### **2. RecurrenceSelector** - Recurring Events
UI for configuring repeating maintenance.

**Features:**
- ✅ Enable/disable recurring
- ✅ Frequency: Daily, Weekly, Monthly, Yearly
- ✅ Custom intervals (every N periods)
- ✅ Quick select for common intervals (3, 6, 12 months)
- ✅ Optional end date
- ✅ Human-readable description ("Every 3 months on the 15th")

### **3. AgendaView** - List View
Alternative view showing upcoming events chronologically.

**Features:**
- ✅ Grouped by date
- ✅ Shows next N days (configurable, default 90)
- ✅ Overdue events section (highlighted)
- ✅ Date headers with "Today", "Tomorrow", "In X days"
- ✅ Compact event cards
- ✅ Empty state

---

## 📋 Integration Steps

### **Step 1: Update EventFormModal to Include Recurrence**

Add RecurrenceSelector to the form:

```tsx
// In EventFormModal.tsx, add to imports:
import { RecurrenceSelector, RecurrenceConfig } from './RecurrenceSelector'

// Add to EventFormData interface:
export interface EventFormData {
  // ...existing fields
  isRecurring?: boolean
  recurrence?: RecurrenceConfig
}

// Add to form state:
const [formData, setFormData] = React.useState<EventFormData>(() => ({
  // ...existing fields
  isRecurring: initialData?.isRecurring || false,
  recurrence: initialData?.recurrence
}))

// Add to form JSX (after reminder section):
<RecurrenceSelector
  value={formData.isRecurring ? formData.recurrence || null : null}
  onChange={(config) => {
    handleFieldChange('isRecurring', !!config)
    handleFieldChange('recurrence', config || undefined)
  }}
  startDate={formData.startDate}
/>
```

### **Step 2: Update Calendar Component**

Add event management and view switching:

```tsx
// Add to Calendar.tsx imports:
import { EventFormModal, EventFormData } from './components/EventFormModal'
import { AgendaView } from './components/AgendaView'

// Add to CalendarProps:
export interface CalendarProps {
  // ...existing props
  onEventCreate?: (data: EventFormData) => Promise<void>
  onEventUpdate?: (id: string, data: EventFormData) => Promise<void>
  onEventDelete?: (id: string) => Promise<void>
  view?: 'month' | 'agenda'
  onViewChange?: (view: 'month' | 'agenda') => void
}

// Add state in Calendar component:
const [view, setView] = React.useState<'month' | 'agenda'>(props.view || 'month')
const [showEventForm, setShowEventForm] = React.useState(false)
const [editingEvent, setEditingEvent] = React.useState<MaintenanceEvent | undefined>()
const [formInitialDate, setFormInitialDate] = React.useState<Date | undefined>()

// Add handlers:
const handleDateClick = (date: Date) => {
  if (onEventCreate) {
    setFormInitialDate(date)
    setEditingEvent(undefined)
    setShowEventForm(true)
  }
}

const handleEventEdit = (event: MaintenanceEvent) => {
  setEditingEvent(event)
  setShowEventForm(true)
}

const handleEventFormSubmit = async (data: EventFormData) => {
  if (editingEvent) {
    await onEventUpdate?.(editingEvent.id, data)
  } else {
    await onEventCreate?.(data)
  }
  setShowEventForm(false)
}

const handleEventDelete = async () => {
  if (editingEvent) {
    await onEventDelete?.(editingEvent.id)
    setShowEventForm(false)
  }
}

// Add view switcher to JSX (before calendar grid):
<Flex gap="xs" className="mb-4">
  <Button
    variant={view === 'month' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setView('month')}
  >
    Month
  </Button>
  <Button
    variant={view === 'agenda' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setView('agenda')}
  >
    Agenda
  </Button>
</Flex>

// Replace calendar grid with conditional render:
{view === 'month' ? (
  <MonthView
    // ...existing props
    onDateSelect={handleDateClick}  // Changed
    onEventClick={handleEventEdit}  // Changed
  />
) : (
  <AgendaView
    events={events}
    onEventClick={handleEventEdit}
    daysToShow={90}
  />
)}

// Add EventFormModal at end:
<EventFormModal
  isOpen={showEventForm}
  onClose={() => setShowEventForm(false)}
  onSubmit={handleEventFormSubmit}
  onDelete={editingEvent ? handleEventDelete : undefined}
  initialData={editingEvent || { startDate: formInitialDate }}
  mode={editingEvent ? 'edit' : 'create'}
/>
```

### **Step 3: Wire Up to Your Backend**

Implement the event management callbacks:

```tsx
// In your page/container component:
function MaintenanceCalendarPage() {
  const [events, setEvents] = React.useState<MaintenanceEvent[]>([])
  
  const handleEventCreate = async (data: EventFormData) => {
    const newEvent: MaintenanceEvent = {
      id: generateId(), // Your ID generation
      ...data,
      status: 'scheduled',
      createdAt: new Date()
    }
    
    // API call
    await api.createMaintenanceEvent(newEvent)
    
    // Update local state
    setEvents(prev => [...prev, newEvent])
  }
  
  const handleEventUpdate = async (id: string, data: EventFormData) => {
    // API call
    await api.updateMaintenanceEvent(id, data)
    
    // Update local state
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, ...data, updatedAt: new Date() } : e
    ))
  }
  
  const handleEventDelete = async (id: string) => {
    // API call
    await api.deleteMaintenanceEvent(id)
    
    // Update local state
    setEvents(prev => prev.filter(e => e.id !== id))
  }
  
  return (
    <Container size="lg" useCase="data_tables">
      <Stack spacing="lg">
        <Heading level="h1">Maintenance Schedule</Heading>
        
        <Calendar
          events={events}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
        />
      </Stack>
    </Container>
  )
}
```

---

## 🚀 Mileage-Based Reminders

### **Add to EventFormModal**

Add mileage interval option:

```tsx
// Add after reminderDays field:
{formData.reminderEnabled && (
  <div className="mt-3">
    <Label className="text-xs text-slate-600">Reminder Type</Label>
    <Flex gap="xs" className="mt-1">
      <button
        type="button"
        className={`px-3 py-1 text-xs rounded ${
          !formData.reminderByMileage 
            ? 'bg-blue-100 text-blue-700' 
            : 'border'
        }`}
        onClick={() => handleFieldChange('reminderByMileage', false)}
      >
        Time-based
      </button>
      <button
        type="button"
        className={`px-3 py-1 text-xs rounded ${
          formData.reminderByMileage 
            ? 'bg-blue-100 text-blue-700' 
            : 'border'
        }`}
        onClick={() => handleFieldChange('reminderByMileage', true)}
      >
        Mileage-based
      </button>
    </Flex>
    
    {formData.reminderByMileage ? (
      <Input
        type="number"
        placeholder="e.g., 500 miles before"
        className="mt-2"
      />
    ) : (
      <Input
        type="number"
        value={formData.reminderDays || 3}
        className="mt-2"
      />
    )}
  </div>
)}
```

---

## 📊 Export Updates

Update the Calendar index.ts:

```tsx
// Add to Calendar/index.ts
export { EventFormModal } from './components/EventFormModal'
export type { EventFormData } from './components/EventFormModal'
export { RecurrenceSelector } from './components/RecurrenceSelector'
export type { RecurrenceConfig } from './components/RecurrenceSelector'
export { AgendaView } from './components/AgendaView'
```

Update main design system index:

```tsx
// Add to design-system/index.tsx
export {
  Calendar,
  EventCard,
  AddToCalendarButton,
  MonthView,
  EventFormModal,     // NEW
  AgendaView,         // NEW
  RecurrenceSelector, // NEW
  MAINTENANCE_TYPES
} from './Calendar'

export type {
  CalendarProps,
  MaintenanceEvent,
  MaintenanceType,
  CalendarViewProps,
  EventFormData,      // NEW
  RecurrenceConfig    // NEW
} from './Calendar'
```

---

## ✅ Phase 2 Checklist

- [x] EventFormModal component
- [x] Form validation
- [x] RecurrenceSelector component
- [x] AgendaView component
- [ ] Integrate EventFormModal into Calendar
- [ ] Add view switcher (Month/Agenda)
- [ ] Wire up create/edit/delete handlers
- [ ] Add mileage-based reminders
- [ ] Export new components
- [ ] Update documentation
- [ ] Test all features

---

## 🎯 Usage After Integration

```tsx
<Calendar
  events={events}
  
  // Phase 2 props:
  onEventCreate={handleCreate}
  onEventUpdate={handleUpdate}
  onEventDelete={handleDelete}
  view="month"  // or "agenda"
  onViewChange={setView}
  
  // Phase 1 props still work:
  onDateSelect={handleDateSelect}
  onEventClick={handleEventClick}
/>
```

---

## 🚀 What You Get

### **Create Events**
Click any empty date → Form opens → Fill details → Schedule

### **Edit Events**
Click event → View details → Edit button → Update → Save

### **Delete Events**
Edit event → Delete button → Confirm → Remove

### **Recurring Events**
Check "Recurring" → Configure frequency → Auto-generates .ics with RRULE

### **List View**
Switch to Agenda → See upcoming events chronologically

### **Mileage Reminders**
Set reminder → Choose mileage-based → Auto-remind at X miles

---

**Phase 2 is ready for integration!** All components are built and documented. 🎉📅✨
