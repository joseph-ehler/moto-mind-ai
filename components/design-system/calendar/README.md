# Calendar Component - Phase 1

## 🎯 Architecture

**Modular design following FilePreview pattern:**
- `/types.ts` - Centralized type definitions
- `/utils/` - Utility functions (calendar links, date operations)
- `/components/` - Reusable sub-components
- `/Calendar.tsx` - Main component (to be created)

---

## ✅ Completed (Phase 1A)

### **1. Types & Interfaces** (`types.ts`)
- ✅ `MaintenanceEvent` - Full event data structure
- ✅ `MaintenanceType` - 10 predefined maintenance types
- ✅ `MAINTENANCE_TYPES` - Configuration with icons, colors, intervals
- ✅ Support for recurring events (future phase)
- ✅ Status tracking (scheduled, completed, cancelled, overdue)
- ✅ Vehicle association, cost estimates, locations

### **2. Add to Calendar Utilities** (`utils/addToCalendar.ts`)
- ✅ `generateGoogleCalendarUrl()` - Google Calendar deep link
- ✅ `generateOutlookUrl()` - Outlook Calendar deep link
- ✅ `generateICS()` - Universal .ics file format
- ✅ `downloadICS()` - Trigger .ics download
- ✅ Support for recurring events (RRULE)
- ✅ Support for reminders/alarms

### **3. Date Utilities** (`utils/dateUtils.ts`)
- ✅ `getMonthDays()` - Get all days for calendar grid
- ✅ `isSameDay()`, `isToday()`, `isPast()` - Date comparisons
- ✅ `formatDate()`, `formatTime()` - Display formatting
- ✅ `getRelativeTime()` - "in 3 days", "2 days ago"
- ✅ `addMonths()`, `addDays()` - Date manipulation

### **4. EventCard Component** (`components/EventCard.tsx`)
- ✅ Display maintenance event with all details
- ✅ Compact mode for list views
- ✅ Full mode with actions
- ✅ Status styling (scheduled, completed, overdue, cancelled)
- ✅ Icons and colors by maintenance type
- ✅ Relative time display
- ✅ Vehicle, location, cost display

### **5. AddToCalendarButton Component** (`components/AddToCalendarButton.tsx`)
- ✅ Dropdown menu with calendar options
- ✅ Google Calendar integration
- ✅ Outlook integration
- ✅ .ics download (Apple Calendar, etc.)
- ✅ Custom icons for each provider
- ✅ Accessible keyboard navigation

---

## 📋 Next Steps (Phase 1B)

### **To Complete Phase 1:**
1. **MonthView Component** - Display calendar grid with events
2. **Calendar Container** - Main wrapper component
3. **Export from design system** - Add to `index.tsx`
4. **Story/Demo** - Show usage examples

### **Estimated Time:**
- MonthView: 30 min
- Calendar Container: 20 min
- Integration & exports: 10 min
- **Total: ~1 hour**

---

## 🎨 Design System Compliance

**Following MotoMind patterns:**
- ✅ Uses `Stack`, `Flex` for layouts
- ✅ Uses design system `Button`
- ✅ Consistent spacing tokens
- ✅ No raw divs (uses layout components)
- ✅ TypeScript throughout
- ✅ Modular architecture (like FilePreview)

---

## 💡 Usage Example (Preview)

```tsx
import { Calendar, AddToCalendarButton } from '@/components/design-system'

// Display calendar with events
<Calendar
  events={maintenanceEvents}
  onEventClick={(event) => console.log(event)}
  onDateSelect={(date) => console.log('Selected:', date)}
/>

// Add single event to external calendar
<AddToCalendarButton event={maintenanceEvent} />
```

---

## 🚀 Phase 2 Planning

**Will add:**
- Event creation modal
- Edit/delete functionality
- Mileage-based reminders
- Integration with vehicle data
- Recurring event UI
- Agenda/list view

**Not building (external calendar handles):**
- Push notifications
- Complex recurring logic
- 2-way sync
- Time zone edge cases

---

**Status: Phase 1A Complete (60% of Phase 1)**  
**Ready for: Phase 1B - Visual Components**
