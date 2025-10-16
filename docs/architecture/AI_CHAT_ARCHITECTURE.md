# AI Chat Architecture

## Overview
Fully-featured contextual AI assistant modal within the vehicle details page. Provides vehicle-aware responses with conversation history.

## Components

### `VehicleAIChatModal`
**Location:** `/components/vehicle/VehicleAIChatModal.tsx`

**Features:**
- ✅ Conversation thread history (persistent during session)
- ✅ Contextual quick questions (4 preset prompts)
- ✅ Vehicle-aware context display
- ✅ Message timestamps
- ✅ Clear/New chat actions
- ✅ Loading states with spinner
- ✅ Error handling with fallbacks
- ✅ Auto-scroll to latest message
- ✅ Auto-focus input on open
- ✅ Enter key to send

**Props:**
```tsx
interface VehicleAIChatModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleContext: {
    id: string
    make: string
    model: string
    year: number
    mileage: number
    health?: number
    recentIssues?: string[]
    lastService?: string
  }
}
```

### Quick Questions (Contextual Prompts)
1. **When is my next service due?** - Maintenance scheduling
2. **Estimate annual maintenance cost** - Budget planning
3. **Check vehicle health** - Current assessment
4. **Common issues for this model** - Preventive awareness

## API Endpoint

### `POST /api/vehicles/[id]/chat`

**Request:**
```json
{
  "message": "When should I change my oil?",
  "conversationHistory": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ],
  "vehicleContext": {
    "id": "123",
    "make": "Honda",
    "model": "Accord",
    "year": 2015,
    "mileage": 85234,
    "health": 87,
    "recentIssues": ["Oil Change Due"],
    "lastService": "Sep 15, 2024"
  }
}
```

**Response:**
```json
{
  "response": "Based on your 2015 Honda Accord at 85,234 miles...",
  "tokensUsed": 245
}
```

**Error Response:**
```json
{
  "error": "Failed to generate response",
  "fallback": "I apologize, but I encountered an error..."
}
```

## System Prompt Strategy

The API builds a vehicle-specific system prompt:

```
You are a knowledgeable automotive AI assistant helping the owner of a 2015 Honda Accord.

VEHICLE CONTEXT:
- Make/Model: 2015 Honda Accord
- Current Mileage: 85,234 miles
- Health Score: 87/100
- Last Service: Sep 15, 2024
- Recent Issues: Oil Change Due

YOUR ROLE:
- Provide helpful, accurate information about this specific vehicle
- Answer questions about maintenance schedules, costs, common issues
- Reference the vehicle's current mileage when relevant
- Be conversational but concise (2-3 paragraphs max)

GUIDELINES:
- Use the owner's perspective (their vehicle, their mileage)
- Provide actionable advice when possible
- Reference manufacturer recommendations
- Warn about safety-critical issues
- Keep responses under 200 words unless asked for detail
```

## User Flow

```
1. User clicks AI Assistant FAB (bottom-left)
   ↓
2. Modal opens with vehicle context banner
   ↓
3. Empty state shows 4 quick questions
   ↓
4. User clicks quick question OR types custom question
   ↓
5. Loading spinner shows while API processes
   ↓
6. AI response appears as chat bubble with timestamp
   ↓
7. Conversation continues (history preserved)
   ↓
8. User can:
   - Continue conversation
   - Start new chat (clears history)
   - Clear history (with confirmation)
   - Close modal (preserves conversation)
```

## Message Structure

```tsx
interface Message {
  id: string              // timestamp-based ID
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
```

**User messages:** Black background, right-aligned  
**Assistant messages:** Gray background, left-aligned  
**Timestamps:** Small gray text below each bubble

## Integration Points

### Vehicle Details Page
```tsx
// State
const [showAIModal, setShowAIModal] = useState(false)

// FAB Button
<button onClick={() => setShowAIModal(true)}>
  <MessageSquare />
</button>

// Modal
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
    recentIssues: mockAlerts.map(a => 'Oil Change Due'),
    lastService: 'Sep 15, 2024'
  }}
/>
```

## Future Enhancements

### Phase 2 (Post-MVP)
- [ ] Streaming responses (SSE or WebSocket)
- [ ] Voice input/output
- [ ] Image attachments (photos of issues)
- [ ] Suggested follow-up questions
- [ ] Export conversation

### Phase 3 (Advanced)
- [ ] Multi-vehicle context switching
- [ ] Integration with timeline (reference specific captures)
- [ ] Integration with documents (search receipts, manuals)
- [ ] Proactive notifications ("Time for oil change!")
- [ ] Learning from user corrections

### Phase 4 (Enterprise)
- [ ] Fleet-wide insights
- [ ] Admin oversight panel
- [ ] Custom AI model fine-tuning
- [ ] Compliance reporting
- [ ] Cost optimization recommendations

## Technical Notes

### Why Modal vs Page?
**Modal Advantages:**
- ✅ Contextual (user stays on vehicle page)
- ✅ Faster (no navigation)
- ✅ Less cognitive load
- ✅ Can reference visible info while chatting

**Page Advantages:**
- ❌ Shareable URL
- ❌ More screen space
- ❌ Browser back button

**Decision:** Modal for MVP, consider page view for complex conversations later.

### Performance
- API response time: ~2-3 seconds (OpenAI)
- Modal render: <100ms
- Message history stored in component state (cleared on page reload)
- No database persistence (feature, not bug - privacy)

### Cost Control
- Max tokens per response: 500
- Temperature: 0.7 (balanced creativity/consistency)
- Model: `gpt-4o-mini` (cost-effective, fast)
- No conversation pruning yet (implement if costs spike)

## Error Handling

**Scenarios:**
1. **API timeout** → Show error + fallback message
2. **Invalid response** → Retry with simpler prompt
3. **Rate limit** → Show "Try again in a moment"
4. **Network error** → Show offline message

**User-facing errors:**
- Red card with AlertCircle icon
- Actionable message (not technical jargon)
- Always provide a path forward

## Accessibility

- Modal keyboard navigable (Tab, Esc)
- Input auto-focuses on open
- Screen reader labels on all buttons
- Color contrast meets WCAG AA
- Loading states announced

## Privacy & Security

- ✅ No PII sent to OpenAI (vehicle context only)
- ✅ Conversations not stored in database
- ✅ User can clear history anytime
- ✅ API authenticated via vehicle ownership
- ⚠️ Consider opt-in for conversation logging (analytics)

## Testing Checklist

- [ ] Empty state shows quick questions
- [ ] Quick questions populate input
- [ ] Custom questions work
- [ ] Conversation history persists
- [ ] Auto-scroll to new messages
- [ ] Clear history confirmation
- [ ] New chat clears state
- [ ] Loading states shown
- [ ] Error handling works
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Close modal preserves conversation
