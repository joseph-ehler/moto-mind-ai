# 🎯 **PROGRESSIVE DISCLOSURE & CAPTURE SYSTEM**

> **Philosophy:** Keep timeline clean, allow deep dives when needed, maintain user control, encourage best practices.

---

## **📋 TABLE OF CONTENTS**
1. [Progressive Disclosure Design](#1-progressive-disclosure-design)
2. [Event Detail Page Architecture](#2-event-detail-page-architecture)
3. [Multi-Modal Capture System](#3-multi-modal-capture-system)
4. [AI Proposal & Validation](#4-ai-proposal--validation)
5. [Guided Multi-Photo Capture](#5-guided-multi-photo-capture)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## **1. PROGRESSIVE DISCLOSURE DESIGN**

### **Timeline Card States:**

#### **A. Collapsed (Default) - Quick Scan Mode**
```
┌─────────────────────────────────────────────────┐
│ ⛽ Fuel Fill-Up  ●●●●● [Quality]      8:00 PM  │
│    Shell Station - $42.50                       │
├─────────────────────────────────────────────────┤
│                  $42.50                          │
│              13.2 gal × $3.22/gal               │
├─────────────────────────────────────────────────┤
│ ✨ Efficiency 8% above your 6-month average    │
├─────────────────────────────────────────────────┤
│ 📊 4 data fields  •  🎯 1 badge                │
│                                                  │
│ [Click to view full details →]                  │
└─────────────────────────────────────────────────┘
```

**Shows:**
- Icon + title + quality dots + time
- Subtitle (key info)
- Hero metric (if present)
- AI summary (key insight)
- Preview: "4 data fields • 1 badge"
- CTA: "Click to view full details"

**Hides:**
- Full data grid
- Source images
- Badges
- Warnings
- Action buttons

---

#### **B. Expanded (Inline) - Quick Details**
```
┌─────────────────────────────────────────────────┐
│ ⛽ Fuel Fill-Up  ●●●●● [Quality]      8:00 PM  │
│    Shell Station - $42.50                       │
├─────────────────────────────────────────────────┤
│  [📷 Receipt thumbnail] 👁️ View full image     │
├─────────────────────────────────────────────────┤
│                  $42.50                          │
│              13.2 gal × $3.22/gal               │
├─────────────────────────────────────────────────┤
│ ✨ Efficiency 8% above your 6-month average    │
├─────────────────────────────────────────────────┤
│  Odometer     77,306 mi  │  Efficiency  32 MPG │
│  Station          Shell  │  Fuel type   Regular│
├─────────────────────────────────────────────────┤
│  ⓘ Exceptional   🌟 Best MPG this month        │
├─────────────────────────────────────────────────┤
│ [View full details & edit →]  [Quick actions ⚡]│
└─────────────────────────────────────────────────┘
```

**Shows:**
- Everything from collapsed
- Thumbnail (not full image)
- Full data grid
- Badges
- Quick actions bar
- "View full details & edit" CTA

**Still Hides:**
- Full editing interface
- History/revisions
- Related events
- Advanced analytics

---

#### **C. Detail Page - Full Context**
Opens in modal or new route: `/events/[id]`

```
┌─────────────────────────────────────────────────┐
│ ⛽ Fuel Fill-Up                        [✕ Close]│
│ January 9, 2025 at 8:00 PM                     │
│ 77,306 miles                                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  [🖼️ FULL SOURCE IMAGE with zoom/pan]         │
│                                                  │
├─────────────────────────────────────────────────┤
│ 📊 Extraction Quality: ●●●●● High (95%)       │
│                                                  │
│ ✓ All 7 fields extracted with high confidence  │
│   ├─ Cost: 98% ✓                               │
│   ├─ Gallons: 95% ✓                            │
│   ├─ Price/gal: 97% ✓                          │
│   └─ Station: 92% ✓                            │
├─────────────────────────────────────────────────┤
│ 💰 COST BREAKDOWN                               │
│                                                  │
│     $42.50                                      │
│     13.2 gal × $3.22/gal                       │
│                                                  │
│ [Edit ✏️]                                      │
├─────────────────────────────────────────────────┤
│ 📋 DETAILS                                      │
│                                                  │
│ Odometer        77,306 mi      [Edit ✏️]       │
│ Station         Shell          [Edit ✏️]       │
│ Fuel type       Regular        [Edit ✏️]       │
│ Efficiency      32.5 MPG       [Edit ✏️]       │
│ Payment         Credit Card    [Edit ✏️]       │
│ Receipt #       4829-3847      [Edit ✏️]       │
│                                                  │
│ [+ Add field]                                   │
├─────────────────────────────────────────────────┤
│ ✨ AI INSIGHTS                                  │
│                                                  │
│ Fuel efficiency is 8% above your 6-month       │
│ average. This station typically has             │
│ competitive pricing in your area.               │
│                                                  │
│ 💡 Tip: Your MPG improves on highway trips     │
├─────────────────────────────────────────────────┤
│ 🔗 RELATED EVENTS                               │
│                                                  │
│ • Odometer Reading (same day) →                │
│ • Previous Fuel (5 days ago) →                 │
│ • Service Due (in 500 miles) →                 │
├─────────────────────────────────────────────────┤
│ 📝 NOTES                                        │
│                                                  │
│ Regular gas, Shell station                      │
│                                                  │
│ [Edit notes]                                    │
├─────────────────────────────────────────────────┤
│ 🕐 HISTORY (2 revisions)                        │
│                                                  │
│ • Jan 10, 8:15 PM - You edited cost            │
│ • Jan 9, 8:00 PM - Auto-extracted from image   │
│                                                  │
│ [View all changes]                              │
├─────────────────────────────────────────────────┤
│ ⚡ ACTIONS                                      │
│                                                  │
│ [📤 Share]  [📄 Export PDF]  [🗑️ Delete]     │
└─────────────────────────────────────────────────┘
```

---

### **User Interaction Flow:**

```
Timeline (Collapsed)
       ↓ [Click anywhere on card]
Timeline (Expanded inline)
       ↓ [Click "View full details"]
Detail Page Modal/Route
       ↓ [Edit any field]
Edit Mode (on detail page)
       ↓ [Save]
Back to Detail Page
       ↓ [Close]
Back to Timeline (updated)
```

---

## **2. EVENT DETAIL PAGE ARCHITECTURE**

### **URL Structure:**
```
/events/[eventId]           // Full page
/events/[eventId]?modal=true  // Modal overlay
```

### **Sections (Top to Bottom):**

1. **Header**
   - Event type + icon
   - Date/time
   - Mileage (if applicable)
   - Close button

2. **Source Image Gallery**
   - Primary image (zoomable)
   - Additional images (carousel)
   - "No image" state with prompt to add

3. **Quality Score (expandable)**
   - Overall quality: ●●●●● with %
   - Per-field confidence breakdown
   - "What does this mean?" tooltip

4. **Hero Metric (if applicable)**
   - Large, prominent display
   - With edit button

5. **Details Grid**
   - All extracted fields
   - Inline edit buttons per field
   - Add custom fields

6. **AI Insights (expandable)**
   - Summary
   - Tips/recommendations
   - Predictions

7. **Related Events**
   - Linked/connected events
   - Smart suggestions

8. **Notes**
   - User notes (editable)
   - Markdown support

9. **History/Audit Trail**
   - All changes with timestamps
   - Who made changes
   - Revert capability

10. **Actions Bar**
    - Share, Export, Delete
    - Archive, Duplicate

---

## **3. MULTI-MODAL CAPTURE SYSTEM**

### **Capture Priority Hierarchy:**

```
1. 📷 Vision Capture (BEST) - AI extracts everything
   ↓ if user skips or AI fails
2. 💬 AI Chat (GOOD) - Conversational input
   ↓ if user prefers manual
3. ✍️ Manual Entry (OKAY) - User types everything
```

### **A. Vision Capture (Primary Method)**

#### **Flow:**
```
User opens camera
       ↓
Takes photo of receipt/dashboard
       ↓
AI processes image
       ↓
Shows PROPOSAL with all extracted fields
       ↓
User REVIEWS & VALIDATES
       ↓
User confirms or edits
       ↓
Event saved with image attached
```

#### **UI Design:**
```
┌─────────────────────────────────────────────────┐
│ 📷 Review Your Fuel Receipt                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Receipt thumbnail]                            │
│                                                  │
│  Quality: ●●●●● Excellent (95%)               │
├─────────────────────────────────────────────────┤
│ 🤖 AI EXTRACTED:                                │
│                                                  │
│ ✓ Cost            $42.50           [Edit ✏️]   │
│ ✓ Gallons         13.2 gal         [Edit ✏️]   │
│ ✓ Price/gallon    $3.22            [Edit ✏️]   │
│ ✓ Station         Shell            [Edit ✏️]   │
│ ✓ Date            Jan 9, 2025      [Edit ✏️]   │
│ ⚠️ Odometer       —                [Add ✏️]    │
│                                                  │
│ 💡 Tip: Add odometer for better tracking       │
├─────────────────────────────────────────────────┤
│ ✅ This looks correct!                          │
│                                                  │
│ [✓ Save Event]  [← Retake Photo]  [✏️ Edit All]│
└─────────────────────────────────────────────────┘
```

**Key Principles:**
- ✅ Show what AI found with confidence
- ⚠️ Highlight missing/low-confidence fields
- 💡 Gentle nudges for best practices
- ✏️ Easy inline editing
- 🔄 Option to retake photo
- ✓ Clear "save" action

---

### **B. AI Chat Capture (Secondary Method)**

#### **Flow:**
```
User: "I just filled up gas for $42.50"
       ↓
AI: "Great! Let me help you log that.
     I need a few more details:
     • How many gallons?
     • What station?
     • Current mileage?"
       ↓
User provides details via conversation
       ↓
AI shows PROPOSAL
       ↓
User confirms
       ↓
Event saved (WITHOUT image - gentle nudge to add)
```

#### **UI Design:**
```
┌─────────────────────────────────────────────────┐
│ 💬 Log Fuel Fill-Up                            │
├─────────────────────────────────────────────────┤
│ YOU: I just filled up gas for $42.50           │
│                                                  │
│ AI: Great! Let me capture that. A few          │
│     quick questions:                            │
│                                                  │
│     • How many gallons? 🤔                     │
│                                                  │
│ [Type here or speak...] 🎤                      │
├─────────────────────────────────────────────────┤
│ ... conversation continues ...                  │
├─────────────────────────────────────────────────┤
│ AI: Perfect! Here's what I captured:           │
│                                                  │
│ 🤖 PROPOSAL:                                    │
│                                                  │
│ Cost            $42.50           [Edit ✏️]     │
│ Gallons         13.2 gal         [Edit ✏️]     │
│ Price/gallon    $3.22 (calculated) [Edit ✏️]   │
│ Station         Shell            [Edit ✏️]     │
│ Date            Today, 8:00 PM   [Edit ✏️]     │
│                                                  │
│ 📸 Missing: Receipt photo                       │
│ 💡 Add a photo for proof & better tracking?    │
│                                                  │
│ [📷 Add Photo]  [✓ Save Anyway]                │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Natural conversation
- Guided questions
- Shows proposal before saving
- Gentle nudge for photo
- Still saves without photo

---

### **C. Manual Entry (Tertiary Method)**

#### **Flow:**
```
User clicks "+ Add Event"
       ↓
Selects event type (Fuel, Service, etc.)
       ↓
Form with all fields
       ↓
User fills out manually
       ↓
Shows PROPOSAL/preview
       ↓
User confirms
       ↓
Event saved (WITHOUT image - nudge to add)
```

#### **UI Design:**
```
┌─────────────────────────────────────────────────┐
│ ✍️ Add Fuel Fill-Up Manually                   │
├─────────────────────────────────────────────────┤
│ 💡 TIP: Use camera for faster, more accurate   │
│    entry! [Switch to Camera 📷]                │
├─────────────────────────────────────────────────┤
│ Cost *           [$ 42.50        ]              │
│ Gallons *        [  13.2 gal     ]              │
│ Station          [  Shell        ]              │
│ Fuel type        [▼ Regular      ]              │
│ Odometer         [  77,306 mi    ]              │
│ Date & time      [📅 Jan 9, 8:00 PM]           │
│ Receipt #        [  4829-3847    ]              │
│                                                  │
│ Notes (optional)                                 │
│ [                                  ]             │
│                                                  │
│ 📸 Receipt Photo (recommended)                  │
│ [📷 Add Photo] or [Drop here]                  │
├─────────────────────────────────────────────────┤
│ 🤖 PREVIEW:                                     │
│                                                  │
│ Fuel Fill-Up on Jan 9                          │
│ $42.50 • 13.2 gal • Shell                      │
│                                                  │
│ ⚠️ No photo attached - add later?              │
├─────────────────────────────────────────────────┤
│ [✓ Save Event]  [Cancel]                       │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Clear form with required fields
- Dropdown suggestions
- Always show preview before saving
- Prominent camera nudge
- Still allows saving without photo

---

## **4. AI PROPOSAL & VALIDATION**

### **Core Principle:**
> **"AI proposes, human disposes."**
> Never auto-save. Always show what AI extracted. Always require user confirmation.

### **Proposal UI Pattern:**

```
┌─────────────────────────────────────────────────┐
│ 🤖 AI PROPOSAL - Please Review                 │
├─────────────────────────────────────────────────┤
│ Based on your receipt photo, I extracted:      │
│                                                  │
│ [Thumbnail of source image]                     │
├─────────────────────────────────────────────────┤
│ HIGH CONFIDENCE (●●●●●)                        │
│ ✓ Cost            $42.50           [Edit ✏️]   │
│ ✓ Gallons         13.2 gal         [Edit ✏️]   │
│ ✓ Price/gallon    $3.22            [Edit ✏️]   │
│                                                  │
│ MEDIUM CONFIDENCE (●●●○○)                      │
│ ⚠️ Date           Jan 9, 2025      [Edit ✏️]   │
│ ⚠️ Station        Shel (typo?)     [Edit ✏️]   │
│                                                  │
│ NOT FOUND (○○○○○)                              │
│ ✗ Odometer        —                [Add ✏️]    │
│ ✗ Receipt #       —                [Add ✏️]    │
├─────────────────────────────────────────────────┤
│ 💡 SUGGESTIONS:                                 │
│ • Fix "Shel" → "Shell"?                        │
│ • Add odometer for better mileage tracking     │
├─────────────────────────────────────────────────┤
│ ✅ Looks good!                                  │
│ ✏️ Needs corrections                            │
│ 📷 Retake photo                                 │
│                                                  │
│ [✓ Confirm & Save]  [← Back]                   │
└─────────────────────────────────────────────────┘
```

### **Validation States:**

1. **High Confidence (●●●●●)** - Green checkmark, auto-filled
2. **Medium Confidence (●●●○○)** - Orange warning, suggest review
3. **Low Confidence (●○○○○)** - Red warning, prompt for correction
4. **Not Found (○○○○○)** - Gray, prompt to add manually

### **User Actions:**

- **Quick approve:** "Looks good!" → Save immediately
- **Quick fix:** Edit individual fields inline
- **Deep edit:** "Edit all" → Open full form
- **Retry:** "Retake photo" → Back to camera

---

## **5. GUIDED MULTI-PHOTO CAPTURE**

### **Why Multi-Photo?**
- Better AI accuracy (focused images)
- Step-by-step guidance
- Progressive capture (user can stop anytime)
- Richer data (before/after, multiple angles)

### **Events Requiring Multi-Photo:**

| Event Type | Photos Needed | Sequence |
|------------|---------------|----------|
| **Dashboard Snapshot** | 4-5 | Odometer → Fuel gauge → Coolant → Oil → Overall |
| **Tire Tread** | 4 | FL → FR → RL → RR |
| **Tire Pressure** | 4 | FL → FR → RL → RR |
| **Damage** | 2-5 | Overall → Close-ups × N → License plate |
| **Modification** | 2 | Before → After |

---

### **A. Dashboard Snapshot (5-photo sequence)**

#### **Flow:**
```
Step 1: Odometer
  ↓
Step 2: Fuel gauge
  ↓
Step 3: Coolant temp
  ↓
Step 4: Oil pressure
  ↓
Step 5: Overall dashboard
  ↓
AI processes all 5 images
  ↓
Shows consolidated PROPOSAL
  ↓
User validates
  ↓
Single event with 5 images attached
```

#### **UI Design:**

**Step 1 of 5:**
```
┌─────────────────────────────────────────────────┐
│ 📸 Dashboard Snapshot - Step 1 of 5            │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Camera viewfinder with overlay guide]         │
│                                                  │
│  ┌───────────────────────────┐                 │
│  │                           │                 │
│  │   📏 Center your          │                 │
│  │      ODOMETER here        │                 │
│  │                           │                 │
│  └───────────────────────────┘                 │
│                                                  │
│  💡 TIP: Zoom in close for best results        │
├─────────────────────────────────────────────────┤
│ Progress: ●○○○○                                │
│                                                  │
│ [📷 Capture]  [Skip this step]  [Cancel]       │
└─────────────────────────────────────────────────┘
```

**Progress indicator:**
```
Step 1: ● Odometer
Step 2: ○ Fuel gauge  
Step 3: ○ Coolant temp
Step 4: ○ Oil pressure
Step 5: ○ Overall view
```

**Step 5 (Final):**
```
┌─────────────────────────────────────────────────┐
│ 📸 Dashboard Snapshot - Final Step              │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Camera viewfinder]                            │
│                                                  │
│  📸 Take a final OVERALL shot of your          │
│     entire dashboard for context               │
│                                                  │
│  💡 This helps AI understand the full picture   │
├─────────────────────────────────────────────────┤
│ Progress: ●●●●○                                │
│                                                  │
│ [📷 Capture & Finish]  [← Back]  [Skip]        │
└─────────────────────────────────────────────────┘
```

**Review All Photos:**
```
┌─────────────────────────────────────────────────┐
│ 📸 Review Your 5 Dashboard Photos              │
├─────────────────────────────────────────────────┤
│ [✓ Odometer]  [✓ Fuel]  [✓ Coolant]  [✓ Oil]  │
│ [✓ Overall]                                     │
│                                                  │
│ All photos captured! ✅                         │
│ Processing with AI...                           │
├─────────────────────────────────────────────────┤
│ [Continue to Review] →                          │
└─────────────────────────────────────────────────┘
```

---

### **B. Tire Tread (4-photo sequence)**

```
Step 1: Front Left   [Camera with guide: "FL"]
Step 2: Front Right  [Camera with guide: "FR"]
Step 3: Rear Left    [Camera with guide: "RL"]
Step 4: Rear Right   [Camera with guide: "RR"]
  ↓
AI extracts tread depth from all 4
  ↓
Shows consolidated PROPOSAL with per-tire data
  ↓
User validates
  ↓
Single "Tire Tread Check" event with 4 images
```

**UI Design:**
```
┌─────────────────────────────────────────────────┐
│ 📸 Tire Tread - Step 2 of 4                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  [Camera viewfinder]                            │
│                                                  │
│  🎯 FRONT RIGHT TIRE                           │
│                                                  │
│  Place penny in tread groove                    │
│  Lincoln's head should point down               │
│                                                  │
│  💡 Get close enough to see the tread clearly  │
├─────────────────────────────────────────────────┤
│ Progress: ●●○○  [FL✓] [FR] [RL] [RR]          │
│                                                  │
│ [📷 Capture]  [← Retake FL]  [Skip to manual]  │
└─────────────────────────────────────────────────┘
```

---

### **Key Multi-Photo Features:**

1. **Skip Anytime** - User can skip steps (manual entry for skipped)
2. **Retake** - Go back to previous step
3. **Progress Indicator** - Always show where user is
4. **Visual Guides** - Overlay guides for optimal framing
5. **Tips** - Context-specific tips per step
6. **Consolidated Review** - Review ALL photos before AI processing
7. **Single Event** - Multiple photos = 1 event (not 4 separate)

---

## **6. IMPLEMENTATION ROADMAP**

### **Phase 1: Progressive Disclosure (Week 1-2)**
- [ ] Update `TimelineItemCompact` to collapsed state
- [ ] Add expand/collapse toggle
- [ ] Show preview: "4 data fields • 1 badge"
- [ ] Add "View full details" CTA
- [ ] Test with all 17 event types

### **Phase 2: Detail Page (Week 2-3)**
- [ ] Create `/events/[id]` route
- [ ] Build detail page components:
  - [ ] Image gallery with zoom
  - [ ] Quality score breakdown
  - [ ] Inline field editing
  - [ ] Related events section
  - [ ] History/audit trail
- [ ] Add modal variant
- [ ] Test navigation flow

### **Phase 3: AI Proposal UI (Week 3-4)**
- [ ] Create `ProposalReview` component
- [ ] Build confidence indicators
- [ ] Add inline editing per field
- [ ] Implement "Looks good!" quick approve
- [ ] Add "Needs corrections" flow
- [ ] Test validation states

### **Phase 4: Multi-Modal Capture (Week 4-6)**
- [ ] Vision capture flow
  - [ ] Camera component
  - [ ] Upload component
  - [ ] AI processing loader
  - [ ] Proposal review
- [ ] AI chat capture
  - [ ] Conversational UI
  - [ ] Guided questions
  - [ ] Proposal generation
- [ ] Manual entry forms
  - [ ] Form per event type
  - [ ] Smart defaults
  - [ ] Preview mode

### **Phase 5: Guided Multi-Photo (Week 6-8)**
- [ ] Multi-step wizard component
- [ ] Photo sequence per event type:
  - [ ] Dashboard (5 photos)
  - [ ] Tire tread (4 photos)
  - [ ] Tire pressure (4 photos)
  - [ ] Damage (2-5 photos)
  - [ ] Modification (2 photos)
- [ ] Progress indicators
- [ ] Skip/retake logic
- [ ] Consolidated AI processing

### **Phase 6: Evidence Nudges (Week 8-9)**
- [ ] "Add photo later" prompts
- [ ] Missing evidence indicators on timeline
- [ ] Gentle reminders for manual entries
- [ ] Upload-later workflow

---

## **🎯 SUCCESS METRICS:**

### **User Control:**
- [ ] 100% of AI extractions shown before saving
- [ ] 0 auto-saves without user confirmation
- [ ] <2 seconds to override AI suggestion

### **Capture Method Adoption:**
- Target: 70% Vision, 20% Chat, 10% Manual
- Track: % with photos attached
- Nudge: Increase photo attachment rate

### **Data Quality:**
- [ ] +40% extraction accuracy (multi-photo)
- [ ] +50% field completion rate
- [ ] -60% support tickets about corrections

### **User Engagement:**
- [ ] +35% daily active usage
- [ ] +45% events logged per user
- [ ] +55% user retention (photos = stickiness)

---

**This system keeps users in control while gently guiding them to best practices!** 🎯✨
