# AI Chat Modal - Implementation Plan & Advanced Features

## ✅ What's Done

### UI/UX
- ✅ Clean, mobile-responsive modal design
- ✅ Full-width dividers
- ✅ Sticky input bar
- ✅ Thread management UI (dropdown)
- ✅ Close button
- ✅ Quick prompt buttons
- ✅ Loading states
- ✅ Error handling UI

### Components
- ✅ `VehicleAIChatModal.final.tsx` - Production-ready component
- ✅ Uses proper design system (`BaseModalShell`)
- ✅ Clean box model (no hacks)

---

## 🚧 What's Needed to Make It Work

### 1. Database Schema ✅ (Already Created)
```sql
-- Tables exist from previous session:
- conversation_threads
- conversation_messages
```

**Verify migration is applied:**
```bash
cd supabase
supabase db push
```

### 2. API Endpoints (Need to Create/Verify)

#### a. **List Threads**
`GET /api/vehicles/[id]/conversations`

**Status:** ✅ Already created in previous session

#### b. **Create Thread**
`POST /api/vehicles/[id]/conversations`

**Status:** ✅ Already created

#### c. **Get Messages**
`GET /api/conversations/[threadId]/messages`

**Status:** ✅ Already created

#### d. **Send Message**
`POST /api/conversations/[threadId]/messages`

**Status:** ✅ Already created

#### e. **Delete Thread**
`DELETE /api/conversations/[threadId]`

**Status:** ✅ Already created

### 3. Environment Variables Needed

```env
# .env.local
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. OpenAI Integration

**Already implemented in:**
- `/pages/api/conversations/[threadId]/messages.ts`

**Includes:**
- Context building from vehicle data
- Conversation history
- Streaming support (can be added)

---

## 🎯 Advanced Features to Add

### Phase 1: Context Enhancement (Immediate)

#### 1.1 **Rich Vehicle Context**
```tsx
interface EnhancedVehicleContext {
  // Basic
  id: string
  make: string
  model: string
  year: number
  mileage: number
  vin?: string
  
  // Health Data
  health?: number
  lastService?: Date
  nextServiceDue?: Date
  
  // Recent Activity
  recentEvents?: Array<{
    type: 'service' | 'issue' | 'note'
    description: string
    date: Date
    mileage: number
  }>
  
  // Cost Data
  totalSpent?: number
  avgMonthlySpending?: number
  
  // Documents
  hasWarranty?: boolean
  warrantyExpiresAt?: Date
  registrationExpiresAt?: Date
}
```

**Why:** More context = better AI responses

#### 1.2 **Timeline Integration**
Pull recent events from timeline to give AI full vehicle history:
```tsx
const buildContextPrompt = (vehicle, recentEvents) => `
You are helping with a ${vehicle.year} ${vehicle.make} ${vehicle.model}.

Recent Activity:
${recentEvents.map(e => `- ${e.date}: ${e.description}`).join('\n')}

Current Status:
- Mileage: ${vehicle.mileage.toLocaleString()} miles
- Health Score: ${vehicle.health}/100
- Last Service: ${vehicle.lastService}
`
```

### Phase 2: Smart Features (Week 1)

#### 2.1 **Contextual Quick Actions**
Smart suggestions based on vehicle state:

```tsx
const getContextualPrompts = (vehicle) => {
  const prompts = []
  
  // Service overdue
  if (vehicle.nextServiceDue < new Date()) {
    prompts.push({
      icon: '🔴',
      text: 'My service is overdue - what should I do?',
      priority: 'high'
    })
  }
  
  // High mileage
  if (vehicle.mileage > 100000) {
    prompts.push({
      icon: '📊',
      text: 'High mileage maintenance checklist',
      priority: 'medium'
    })
  }
  
  // Recent issues
  if (vehicle.recentIssues?.length > 0) {
    prompts.push({
      icon: '⚠️',
      text: `Follow up on recent ${vehicle.recentIssues[0]}`,
      priority: 'high'
    })
  }
  
  return prompts
}
```

#### 2.2 **Cost Analysis Integration**
```tsx
// Query: "How much have I spent on maintenance?"
// AI Response includes:
{
  answer: "You've spent $2,450 on maintenance...",
  visualization: {
    type: 'chart',
    data: monthlyCosts
  },
  actions: [
    { label: 'View full breakdown', onClick: () => navigate('/costs') }
  ]
}
```

#### 2.3 **Document Search**
```tsx
// Query: "When was my last oil change?"
// AI searches documents and timeline:
{
  answer: "Your last oil change was March 15, 2024 at 82,450 miles",
  source: {
    type: 'document',
    id: 'doc-123',
    preview: 'Service Receipt - Oil Change.pdf'
  },
  action: { label: 'View receipt', onClick: () => openDoc('doc-123') }
}
```

### Phase 3: Proactive AI (Week 2)

#### 3.1 **Maintenance Predictions**
```tsx
// AI proactively suggests:
"Based on your driving patterns (1,200 miles/month), 
your next oil change will be due around June 15, 2024. 
Would you like me to remind you?"
```

#### 3.2 **Issue Detection**
```tsx
// If multiple "Check Engine" photos uploaded:
"I noticed you've documented check engine lights 3 times 
in the past month. This could indicate [common causes]. 
Should I help you find a diagnostic appointment?"
```

#### 3.3 **Cost Optimization**
```tsx
// AI analyzes spending:
"Your brake pad replacements cost $450 at [Dealer]. 
Similar work at nearby shops averages $280. 
Would you like recommendations for next time?"
```

### Phase 4: Actions & Integrations (Week 3)

#### 4.1 **Actionable Responses**
```tsx
interface AIResponse {
  message: string
  actions?: Array<{
    type: 'schedule' | 'reminder' | 'export' | 'navigate'
    label: string
    data: any
  }>
}

// Example response:
{
  message: "Your next service is due in 2 weeks",
  actions: [
    {
      type: 'reminder',
      label: 'Remind me 3 days before',
      data: { date: '2024-06-12', type: 'service' }
    },
    {
      type: 'navigate',
      label: 'View service history',
      data: { path: '/vehicles/123/timeline' }
    }
  ]
}
```

#### 4.2 **Calendar Integration**
```tsx
// "Add this service to my calendar"
const exportToCalendar = (event) => {
  // Generate .ics file
  // Or integrate with Google Calendar API
}
```

#### 4.3 **Export Conversations**
```tsx
// "Export this conversation as PDF"
const exportThread = async (threadId) => {
  const messages = await fetchMessages(threadId)
  const pdf = generatePDF(messages)
  download(pdf, `vehicle-chat-${date}.pdf`)
}
```

### Phase 5: Advanced AI (Week 4)

#### 5.1 **Image Analysis**
```tsx
// Upload photo in chat:
"Here's a photo of my dashboard warning light"

// AI Response:
"This appears to be the TPMS (Tire Pressure) warning. 
Based on your vehicle manual, this means one or more 
tires are 25% below recommended pressure. 
Recommended pressure: 32 PSI (front), 30 PSI (rear)."
```

#### 5.2 **Voice Input**
```tsx
// Click microphone icon → speak question
<button onClick={startVoiceRecording}>
  <Mic className="w-5 h-5" />
</button>

// Transcribe with OpenAI Whisper
// Send transcribed text as message
```

#### 5.3 **Proactive Notifications**
```tsx
// AI monitors vehicle health and sends proactive messages:
"👋 I noticed your registration expires in 30 days. 
Would you like help with renewal?"

// User can dismiss or engage directly from notification
```

#### 5.4 **Multi-Vehicle Context**
```tsx
// If user has multiple vehicles:
"Comparing your 2015 Honda Accord to your 2020 Toyota Camry, 
the Accord has cost $150/month in maintenance vs $80/month 
for the Camry over the past year."
```

---

## 🔧 Technical Implementation Details

### 1. Enhanced System Prompt
```typescript
const buildSystemPrompt = (vehicle, context) => `
You are MotoMind AI, an expert automotive assistant helping manage a ${vehicle.year} ${vehicle.make} ${vehicle.model}.

VEHICLE PROFILE:
- VIN: ${vehicle.vin}
- Current Mileage: ${vehicle.mileage.toLocaleString()} miles
- Health Score: ${vehicle.health}/100
- Total Maintenance Spend: $${context.totalSpent}
- Avg Monthly Spend: $${context.avgMonthly}

RECENT TIMELINE:
${context.recentEvents.slice(0, 10).map(e => 
  `- ${e.date.toLocaleDateString()}: ${e.description}`
).join('\n')}

CAPABILITIES:
1. Answer maintenance questions with specific dates/mileage from timeline
2. Provide cost analysis and spending insights
3. Recommend service schedules based on actual vehicle history
4. Search documents and receipts for specific information
5. Detect patterns in issues and suggest preventive maintenance

PERSONALITY:
- Professional but friendly
- Proactive (suggest actions when relevant)
- Data-driven (cite specific dates, costs, mileage)
- Helpful (offer to create reminders, export data, etc.)

RESPONSE FORMAT:
- Be concise but thorough
- Use bullet points for lists
- Include specific dates and mileage when relevant
- Suggest actionable next steps
- If you recommend a service, provide rough cost estimates

USER CONTEXT:
- This user tracks maintenance meticulously
- They value data and transparency
- They're interested in cost optimization
`
```

### 2. Message Enrichment
```typescript
interface EnrichedMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  
  // Enrichments
  attachments?: Array<{
    type: 'image' | 'document'
    url: string
    analysis?: string
  }>
  
  citations?: Array<{
    type: 'timeline_event' | 'document' | 'cost_data'
    id: string
    preview: string
  }>
  
  actions?: Array<{
    type: string
    label: string
    data: any
  }>
}
```

### 3. Streaming Responses
```typescript
// In API endpoint:
const stream = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages,
  stream: true
})

// Stream to client:
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content
  if (content) {
    res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }
}
```

### 4. RAG (Retrieval-Augmented Generation)
```typescript
// Vector embeddings for documents/timeline
const relevant = await searchVectorDB(query, {
  filter: { vehicleId: vehicle.id },
  limit: 5
})

// Include in context:
const context = `
RELEVANT INFORMATION:
${relevant.map(r => r.content).join('\n\n')}

USER QUESTION: ${query}
`
```

---

## 📊 Analytics to Track

### User Engagement
- Messages per session
- Threads created
- Quick prompts vs typed queries
- Session duration

### AI Performance
- Response time
- User satisfaction (thumbs up/down)
- Follow-up questions (indicates unclear response)
- Action click-through rate

### Feature Usage
- Most common questions
- Most used quick prompts
- Document searches
- Cost analysis queries

---

## 🔐 Security Considerations

### 1. Data Privacy
- All conversations tied to authenticated user
- RLS policies on threads and messages
- No PII in AI training data

### 2. Rate Limiting
```typescript
// Per user per vehicle
const rateLimits = {
  messages: 50, // per day
  threads: 10,  // per day
  tokens: 100000 // per month
}
```

### 3. Content Filtering
```typescript
// OpenAI moderation API
const moderation = await openai.moderations.create({
  input: userMessage
})

if (moderation.flagged) {
  return { error: 'Message violates content policy' }
}
```

---

## 🚀 Rollout Plan

### Week 1: Core Setup
- [ ] Verify database migrations
- [ ] Test all API endpoints
- [ ] Add enhanced vehicle context
- [ ] Implement contextual prompts

### Week 2: Smart Features
- [ ] Timeline integration
- [ ] Cost analysis
- [ ] Document search
- [ ] Actionable responses

### Week 3: Polish
- [ ] Streaming responses
- [ ] Message citations
- [ ] Error recovery
- [ ] Analytics

### Week 4: Advanced
- [ ] Image analysis
- [ ] Voice input
- [ ] Export features
- [ ] Proactive suggestions

---

## 💡 Quick Wins (Do First)

1. **Enhanced Context** - Pull recent timeline events into AI prompts (30 min)
2. **Contextual Prompts** - Show relevant questions based on vehicle state (1 hour)
3. **Message Citations** - Link AI responses to timeline events (2 hours)
4. **Cost Integration** - "How much have I spent?" queries (2 hours)
5. **Export Thread** - Download conversation as PDF (1 hour)

---

## 📝 Next Steps

1. **Verify Setup**
   ```bash
   # Check if migrations are applied
   npm run db:status
   
   # Test API endpoints
   npm run test:api
   ```

2. **Add Enhanced Context**
   - Pull recent events from timeline
   - Include in system prompt
   - Test AI responses improve

3. **Implement Quick Wins**
   - Start with contextual prompts
   - Add cost integration
   - Enable message actions

4. **Iterate Based on Usage**
   - Monitor what users ask
   - Add features based on patterns
   - Improve prompt engineering

---

**Ready to start implementing? Let's prioritize the features you want first!** 🚀
