# Conversation Thread Management - User Guide

## ✅ What's Been Implemented

Your AI chat modal now has **full conversation thread management** with persistent history!

---

## 🎯 Features

### 1. **Thread Sidebar (Desktop)**
- Always visible on left side (256px width)
- Shows all conversation threads for the current vehicle
- Click any thread to switch conversations
- Delete threads with menu button

### 2. **Mobile Support**
- Full-screen modal on mobile
- Hamburger menu (☰) to access threads
- Slide-in sidebar
- Thread list slides out after selection

### 3. **Thread Management**
- ✅ **Create new thread** - "+ New Conversation" button
- ✅ **Switch threads** - Click any thread in sidebar
- ✅ **Delete threads** - Menu (⋮) → Delete (with confirmation)
- ✅ **Auto-generated titles** - First message becomes thread title
- ✅ **Thread metadata** - Message count + last activity timestamp

### 4. **Persistent Storage**
- All conversations saved to database
- Survive page reloads, browser closes
- Associated with specific vehicle
- Searchable history (future enhancement)

### 5. **Optimistic UI**
- Messages appear instantly
- No blocking while AI thinks
- Graceful error recovery

---

## 📱 User Experience

### First Time Opening Modal
```
1. Modal opens
2. Checks for existing threads
3. If none: Auto-creates first thread
4. If exists: Shows most recent thread
5. Displays previous messages
```

### Desktop Layout
```
┌────────────────────────────────────────────┐
│ [Sidebar]          │ [Chat Area]           │
│                    │                       │
│ Conversations (3)  │  ☰ 2015 Honda Accord  │
│ [+ New]            │  85,234 mi • 87/100   │
│                    │  ─────────────────     │
│ ● When is my...    │                       │
│   4 msg • 2h ago   │  Messages             │
│                    │  ↓                    │
│   Estimate costs   │  ↓                    │
│   2 msg • 1d ago   │                       │
│                    │  ─────────────────     │
│   Common issues    │  [Input]      [Send]  │
│   6 msg • 3d ago   │                       │
└────────────────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────────────┐
│ ☰ 2015 Honda Accord  │  ← Tap ☰ to show threads
├──────────────────────┤
│                      │
│   Messages           │
│   ↓                  │
│   ↓                  │
│                      │
├──────────────────────┤
│ [Input]       [Send] │
└──────────────────────┘

Tap ☰ → Thread sidebar slides in
```

---

## 🔄 User Flows

### Creating New Conversation
```
1. Click "+ New Conversation"
2. Empty chat area appears
3. Type first message
4. Thread title auto-generates from message
5. Thread appears in sidebar
```

### Switching Between Threads
```
1. Click thread in sidebar
2. Current messages fade out
3. New messages load and fade in
4. Active thread highlighted in blue
5. On mobile: Sidebar auto-closes
```

### Deleting Thread
```
1. Hover over thread (desktop)
2. Click menu button (⋮)
3. Click "Delete"
4. Confirmation dialog appears
5. If confirmed: Thread removed
6. If current thread: Switches to next available
7. If last thread: Creates new empty thread
```

---

## 🎨 Visual Indicators

### Active Thread
- **Background:** Blue-50 (light blue)
- **Border:** 2px blue-500 (solid blue)
- **Left indicator:** Blue vertical bar
- **Text:** Blue-900

### Inactive Thread
- **Background:** White
- **Border:** 2px gray-200
- **Hover:** Border gray-300, shadow-sm
- **Text:** Gray-900

### Thread Metadata
- **Message count:** With MessageSquare icon
- **Timestamp:** Relative time ("2h ago", "Just now")
- **Separator:** Gray dot between items

---

## 🗄️ Database Structure

```sql
conversation_threads
├─ id (UUID)
├─ vehicle_id (UUID) → Foreign key
├─ user_id (UUID) → Foreign key
├─ title (TEXT) → Auto-generated
├─ created_at (TIMESTAMP)
├─ updated_at (TIMESTAMP) → Auto-updated
├─ last_message_at (TIMESTAMP)
├─ message_count (INT) → Auto-incremented
└─ is_archived (BOOLEAN)

conversation_messages
├─ id (UUID)
├─ thread_id (UUID) → Foreign key
├─ role ('user' | 'assistant' | 'system')
├─ content (TEXT)
├─ created_at (TIMESTAMP)
├─ tokens_used (INT)
├─ feedback_rating (INT 1-5)
└─ feedback_comment (TEXT)
```

---

## 🔌 API Endpoints

### 1. List Threads
```
GET /api/vehicles/[vehicleId]/conversations

Response:
{
  threads: [
    {
      id: "uuid",
      vehicle_id: "uuid",
      title: "When is my next service due?",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T11:00:00Z",
      last_message_at: "2024-01-15T11:00:00Z",
      message_count: 4,
      is_archived: false
    }
  ]
}
```

### 2. Create Thread
```
POST /api/vehicles/[vehicleId]/conversations
Body: { vehicleContext: {...} }

Response:
{
  thread: { id, vehicle_id, created_at, ... }
}
```

### 3. Get Messages
```
GET /api/conversations/[threadId]/messages

Response:
{
  messages: [
    {
      id: "uuid",
      threadId: "uuid",
      role: "user",
      content: "When should I change my oil?",
      timestamp: "2024-01-15T10:00:00Z",
      tokensUsed: 12
    }
  ]
}
```

### 4. Send Message
```
POST /api/conversations/[threadId]/messages
Body: {
  message: "When should I change my oil?",
  vehicleContext: {...}
}

Response:
{
  userMessage: {...},
  assistantMessage: {...},
  totalTokens: 245
}
```

### 5. Delete Thread
```
DELETE /api/conversations/[threadId]

Response:
{ success: true }
```

---

## 📊 Component Architecture

```
VehicleAIChatModal.tsx (Main Component)
├─ Thread Management State
│  ├─ threads: ConversationThread[]
│  ├─ currentThreadId: string | null
│  ├─ showThreads: boolean (mobile)
│  └─ threadsLoading: boolean
│
├─ Message State
│  ├─ messages: Message[]
│  ├─ input: string
│  ├─ isLoading: boolean
│  └─ error: string | null
│
├─ Functions
│  ├─ loadThreads() → Fetch from API
│  ├─ loadMessages(threadId) → Fetch messages
│  ├─ createNewThread() → POST new thread
│  ├─ handleDeleteThread(id) → DELETE thread
│  └─ handleSendMessage(text) → POST message
│
└─ UI Structure
   ├─ Thread Sidebar (ConversationThreadList)
   │  ├─ Header + New Button
   │  └─ Thread items (with actions)
   │
   └─ Chat Area
      ├─ Header (vehicle context)
      ├─ Messages
      └─ Input

ConversationThreadList.tsx (Reusable Component)
├─ Props
│  ├─ threads
│  ├─ currentThreadId
│  ├─ onSelectThread
│  ├─ onNewThread
│  ├─ onDeleteThread
│  └─ isLoading
│
└─ ThreadListItem
   ├─ Title (truncated)
   ├─ Metadata (count + time)
   ├─ Active indicator
   └─ Menu button
```

---

## ✅ Testing Checklist

- [ ] Open modal → Auto-loads threads
- [ ] First time user → Auto-creates thread
- [ ] Send message → Appears instantly (optimistic)
- [ ] Send message → AI responds
- [ ] Message persists on reload
- [ ] Click "+ New Conversation" → Creates thread
- [ ] Switch threads → Messages load correctly
- [ ] Delete thread → Confirmation shown
- [ ] Delete last thread → Creates new one
- [ ] Mobile: Hamburger menu works
- [ ] Mobile: Thread selection closes sidebar
- [ ] Desktop: Sidebar always visible
- [ ] Thread title auto-generates from first message

---

## 🚀 Usage Example

```tsx
// In vehicle details page
import { VehicleAIChatModal } from '@/components/vehicle/VehicleAIChatModal'

<VehicleAIChatModal
  isOpen={showAIModal}
  onClose={() => setShowAIModal(false)}
  vehicleContext={{
    id: vehicleId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    mileage: vehicle.current_mileage,
    health: 87,
    recentIssues: ['Oil Change Due'],
    lastService: 'Sep 15, 2024'
  }}
/>
```

---

## 💡 Future Enhancements

### Phase 2
- [ ] Search threads
- [ ] Archive threads
- [ ] Export conversation
- [ ] Share thread (copy link)
- [ ] Thread categories/tags

### Phase 3
- [ ] Multi-vehicle thread switching
- [ ] Thread templates
- [ ] Suggested questions per thread
- [ ] Voice input/output
- [ ] Image attachments

---

**Conversations are now fully managed and persistent!** 🎉

Users can create unlimited threads, switch between them, and all history is preserved in the database.
