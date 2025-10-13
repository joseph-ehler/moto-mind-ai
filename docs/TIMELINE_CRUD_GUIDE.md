# 📋 Timeline Events CRUD Implementation Guide

## ✅ What's Already Built

### **Backend APIs** ✅
- `PUT /api/vehicles/[id]/events/[eventId]` - Update event
- `DELETE /api/vehicles/[id]/events/[eventId]` - Delete event (soft delete)

### **UI Components** ✅
- `EditEventModal.tsx` - Full-featured edit modal
- `DeleteEventConfirmation.tsx` - Delete confirmation dialog
- `UnifiedEventDetail.tsx` - Event detail view

---

## 🎯 Integration Steps

### **Step 1: Add Edit/Delete Buttons to Timeline Events**

Find where timeline events are rendered (likely in `/components/timeline/Timeline.tsx` or similar) and add action buttons:

```tsx
import { Edit2, Trash2 } from 'lucide-react'
import { EditEventModal } from '@/components/vehicle/EditEventModal'
import { DeleteEventConfirmation } from '@/components/vehicle/DeleteEventConfirmation'

// In your component:
const [editingEvent, setEditingEvent] = useState(null)
const [deletingEvent, setDeletingEvent] = useState(null)

// Add action buttons to each event card:
<Flex gap="sm" className="mt-2">
  <Button
    size="sm"
    variant="outline"
    onClick={() => setEditingEvent(event)}
  >
    <Edit2 className="w-4 h-4" />
    <span>Edit</span>
  </Button>
  <Button
    size="sm"
    variant="outline"
    className="text-red-600 hover:bg-red-50"
    onClick={() => setDeletingEvent(event)}
  >
    <Trash2 className="w-4 h-4" />
    <span>Delete</span>
  </Button>
</Flex>

// Add modals to component:
<EditEventModal
  isOpen={!!editingEvent}
  onClose={() => setEditingEvent(null)}
  event={editingEvent}
  vehicleId={vehicleId}
  onSuccess={() => {
    refreshTimeline()
    setEditingEvent(null)
  }}
/>

<DeleteEventConfirmation
  isOpen={!!deletingEvent}
  onClose={() => setDeletingEvent(null)}
  event={deletingEvent}
  vehicleId={vehicleId}
  onSuccess={() => {
    refreshTimeline()
    setDeletingEvent(null)
  }}
/>
```

---

### **Step 2: Event Detail View Integration**

If you have an event detail page/modal, add edit/delete actions:

```tsx
// In UnifiedEventDetail or similar component:
<Flex justify="end" gap="sm">
  <Button
    variant="outline"
    onClick={onEdit}
  >
    <Edit2 className="w-4 h-4" />
    <span>Edit Event</span>
  </Button>
  <Button
    variant="outline"
    className="text-red-600"
    onClick={onDelete}
  >
    <Trash2 className="w-4 h-4" />
    <span>Delete</span>
  </Button>
</Flex>
```

---

## 🎨 **User Experience Flow**

### **Edit Flow:**
```
1. User clicks "Edit" on timeline event
2. EditEventModal opens with pre-filled data
3. User modifies fields
4. Click "Save Changes"
5. API updates event
6. Timeline refreshes
7. Modal closes
8. Success notification
```

### **Delete Flow:**
```
1. User clicks "Delete" on timeline event
2. DeleteEventConfirmation shows warning
3. User confirms deletion
4. API soft deletes event (sets deleted_at)
5. Timeline refreshes (event disappears)
6. Modal closes
7. Success notification
```

---

## 🔧 **Supported Event Types**

### **EditEventModal handles:**
- **Service/Maintenance** - Service type, vendor, cost
- **Fuel** - Gallons, station, cost
- **Damage** - Type, severity, location
- **Dashboard Snapshot** - Mileage, fuel level, warnings
- **Common fields** - Date, mileage, notes, cost

---

## 🛡️ **Features Included**

### **Edit Modal:**
- ✅ Pre-filled form data
- ✅ Type-specific fields
- ✅ Validation
- ✅ Loading states
- ✅ Error handling
- ✅ Success callback

### **Delete Confirmation:**
- ✅ Warning message
- ✅ Event preview
- ✅ Cannot undo warning
- ✅ Soft delete (preserves data)
- ✅ Success callback

### **API Features:**
- ✅ Soft delete (sets `deleted_at`)
- ✅ Edit tracking (sets `edited_at`)
- ✅ Payload merging (preserves existing data)
- ✅ Vehicle ownership validation

---

## 📍 **Where to Integrate**

### **Priority Locations:**

1. **Vehicle Details Page** (`/app/(authenticated)/vehicles/[id]/page.tsx`)
   - Add edit/delete to timeline events
   - Most important integration point

2. **Timeline Component** (`/components/timeline/Timeline.tsx`)
   - Add action buttons to each event card

3. **Event Detail Modal/Page**
   - Add edit/delete buttons to header

4. **Vehicle History Page** (`/app/(authenticated)/vehicles/[id]/history/page.tsx`)
   - Add bulk actions if needed

---

## 🚀 **Quick Start**

### **1. Import Components:**
```tsx
import { EditEventModal } from '@/components/vehicle/EditEventModal'
import { DeleteEventConfirmation } from '@/components/vehicle/DeleteEventConfirmation'
```

### **2. Add State:**
```tsx
const [editingEvent, setEditingEvent] = useState<any>(null)
const [deletingEvent, setDeletingEvent] = useState<any>(null)
```

### **3. Add Modals:**
```tsx
<EditEventModal
  isOpen={!!editingEvent}
  onClose={() => setEditingEvent(null)}
  event={editingEvent}
  vehicleId={vehicleId}
  onSuccess={refreshData}
/>

<DeleteEventConfirmation
  isOpen={!!deletingEvent}
  onClose={() => setDeletingEvent(null)}
  event={deletingEvent}
  vehicleId={vehicleId}
  onSuccess={refreshData}
/>
```

### **4. Add Buttons:**
```tsx
<Button onClick={() => setEditingEvent(event)}>Edit</Button>
<Button onClick={() => setDeletingEvent(event)}>Delete</Button>
```

---

## 🎯 **Next Steps**

1. **Find timeline rendering** - Locate where events are displayed
2. **Add action buttons** - Edit & Delete buttons on each event
3. **Wire up modals** - Connect EditEventModal and DeleteEventConfirmation
4. **Test flow** - Create → Edit → Delete
5. **Add permissions** - Ensure only vehicle owner can edit/delete
6. **Add audit log** - Track who edited/deleted what (future)

---

## 🔒 **Security Notes**

- API validates vehicle ownership
- Soft delete preserves data
- `edited_at` timestamp tracks changes
- Ready for audit logging (TODO: add `edited_by`)

---

## 📱 **Mobile Considerations**

- Edit modal is responsive
- Touch-friendly buttons
- Confirmation prevents accidental deletes
- Swipe gestures (future enhancement)

---

## ✨ **Enhancement Ideas**

- [ ] Bulk edit/delete
- [ ] Restore deleted events
- [ ] Edit history/changelog
- [ ] Duplicate event
- [ ] Export event data
- [ ] Share event

---

**All components are ready - just needs integration into your timeline UI!** 🎉
