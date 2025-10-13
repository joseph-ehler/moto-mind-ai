# 🏗️ **CAPTURE FLOW ARCHITECTURE**

## **SYSTEM OVERVIEW:**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER WANTS TO LOG EVENT                   │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │   CAPTURE METHOD SELECTION     │
        └───────────────┬───────────────┘
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
        ↓                               ↓
   📷 VISION          💬 AI CHAT      ✍️ MANUAL
    (70%)              (20%)           (10%)
        ↓                ↓               ↓
        └────────────────┴───────────────┘
                        ↓
            🤖 AI PROPOSAL REVIEW
            (Always required)
                        ↓
            ✓ USER VALIDATES
                        ↓
            💾 EVENT SAVED
                        ↓
            📋 APPEARS ON TIMELINE
```

---

## **1. VISION CAPTURE FLOW**

### **A. Single Photo Events** (Fuel, Service, Odometer)

```
START
  ↓
┌─────────────────────────────────────┐
│  🏠 Home / Timeline                 │
│                                      │
│  [+ Add Event] button               │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📸 CAPTURE METHOD SELECTOR          │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ 📷 Camera (Recommended)     │   │ ← Default/highlighted
│  ├─────────────────────────────┤   │
│  │ 💬 Tell AI                  │   │
│  ├─────────────────────────────┤   │
│  │ ✍️  Enter Manually          │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               ↓ [User selects Camera]
┌─────────────────────────────────────┐
│  📸 EVENT TYPE SELECTOR             │
│                                      │
│  "What are you capturing?"          │
│                                      │
│  ⛽ Fuel Receipt                    │
│  🔧 Service Invoice                 │
│  📏 Odometer                        │
│  ⚠️  Dashboard Warning              │
│  🛞 Tires                           │
│  📄 Document                        │
│  [...more types]                    │
└──────────────┬──────────────────────┘
               ↓ [User selects "Fuel"]
┌─────────────────────────────────────┐
│  📷 CAMERA VIEW                     │
│                                      │
│  [Live camera feed]                 │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   Center your fuel receipt  │   │ ← Overlay guide
│  │   in this area              │   │
│  └─────────────────────────────┘   │
│                                      │
│  💡 Tip: Include all numbers        │
│                                      │
│  [Gallery] [●] [Flash]              │
└──────────────┬──────────────────────┘
               ↓ [User taps capture button]
┌─────────────────────────────────────┐
│  🔄 PROCESSING...                   │
│                                      │
│  [Loading animation]                │
│                                      │
│  Analyzing your receipt with AI...  │
│                                      │
│  ⏱️ Usually takes 2-3 seconds       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  🤖 AI PROPOSAL REVIEW              │
│                                      │
│  [Receipt thumbnail] 👁️            │
│                                      │
│  Quality: ●●●●● Excellent (95%)   │
│                                      │
│  HIGH CONFIDENCE ✓                  │
│  ✓ Cost         $42.50   [Edit]    │
│  ✓ Gallons      13.2     [Edit]    │
│  ✓ Price/gal    $3.22    [Edit]    │
│  ✓ Station      Shell    [Edit]    │
│  ✓ Date         Jan 9    [Edit]    │
│                                      │
│  NOT FOUND ✗                        │
│  ✗ Odometer     —        [Add]     │
│                                      │
│  💡 Add odometer for tracking       │
│                                      │
│  ✅ Looks good!                     │
│  ✏️  Needs corrections              │
│  📷 Retake photo                    │
│                                      │
│  [✓ Confirm & Save]                │
└──────────────┬──────────────────────┘
               ↓ [User confirms]
┌─────────────────────────────────────┐
│  ✅ EVENT SAVED!                    │
│                                      │
│  [Success animation]                │
│                                      │
│  Your fuel fill-up has been logged  │
│                                      │
│  [View Event] [Add Another]         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📋 TIMELINE (Updated)              │
│                                      │
│  [New fuel event appears at top]    │
│                                      │
│  ⛽ Fuel Fill-Up  ●●●●● 8:00 PM    │
│     Shell - $42.50                  │
│  [...]                              │
└─────────────────────────────────────┘
```

---

### **B. Multi-Photo Events** (Dashboard Snapshot)

```
START (User selected "Dashboard Snapshot")
  ↓
┌─────────────────────────────────────┐
│  📸 MULTI-PHOTO GUIDE               │
│                                      │
│  Dashboard Snapshot requires        │
│  5 photos for accurate reading:     │
│                                      │
│  1️⃣ Odometer                        │
│  2️⃣ Fuel gauge                      │
│  3️⃣ Coolant temp                    │
│  4️⃣ Oil pressure                    │
│  5️⃣ Overall dashboard               │
│                                      │
│  💡 Don't worry - you can skip      │
│     any step if needed              │
│                                      │
│  [Let's Go!] [Switch to Manual]     │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📸 STEP 1 OF 5: ODOMETER           │
│                                      │
│  [Camera with overlay guide]        │
│                                      │
│  ┌─────────────────────────────┐   │
│  │  📏 Center your odometer    │   │
│  │     reading here            │   │
│  └─────────────────────────────┘   │
│                                      │
│  Progress: ●○○○○                   │
│                                      │
│  💡 Zoom in close for clarity       │
│                                      │
│  [📷 Capture]  [Skip]  [Cancel]    │
└──────────────┬──────────────────────┘
               ↓ [Photo 1 captured]
┌─────────────────────────────────────┐
│  ✅ Odometer captured!              │
│                                      │
│  [Thumbnail preview]                │
│                                      │
│  [✓ Looks good]  [← Retake]        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📸 STEP 2 OF 5: FUEL GAUGE         │
│                                      │
│  [Camera with overlay]              │
│                                      │
│  ⛽ Center your fuel gauge          │
│                                      │
│  Progress: ●●○○○                   │
│                                      │
│  [📷 Capture]  [Skip]  [← Back]    │
└──────────────┬──────────────────────┘
               ↓ [Photos 2-4 captured]
┌─────────────────────────────────────┐
│  📸 STEP 5 OF 5: OVERALL VIEW       │
│                                      │
│  [Camera]                           │
│                                      │
│  📸 Take final OVERALL shot of      │
│     entire dashboard                │
│                                      │
│  Progress: ●●●●○                   │
│                                      │
│  [📷 Capture & Finish]              │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📸 REVIEW ALL PHOTOS               │
│                                      │
│  [Thumb 1] [Thumb 2] [Thumb 3]      │
│  [Thumb 4] [Thumb 5]                │
│                                      │
│  ✅ All 5 photos captured!          │
│                                      │
│  💡 AI will analyze all photos      │
│     together for best accuracy      │
│                                      │
│  [Continue to Review →]             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  🔄 PROCESSING 5 IMAGES...          │
│                                      │
│  [Progress bar]                     │
│                                      │
│  ⏱️ This may take 5-10 seconds      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  🤖 AI PROPOSAL REVIEW              │
│                                      │
│  [Gallery: 5 thumbnails]            │
│                                      │
│  Quality: ●●●●● Excellent (94%)   │
│                                      │
│  FROM ODOMETER PHOTO:               │
│  ✓ Mileage      77,306 mi [Edit]   │
│  ✓ Trip A       324.5 mi  [Edit]   │
│                                      │
│  FROM FUEL GAUGE PHOTO:             │
│  ✓ Fuel level   3/4 full  [Edit]   │
│  ✓ Range        285 mi    [Edit]   │
│                                      │
│  FROM COOLANT PHOTO:                │
│  ✓ Temp         Normal    [Edit]   │
│                                      │
│  FROM OIL PHOTO:                    │
│  ⚠️ Oil level   Low       [Edit]   │
│                                      │
│  ⚠️ WARNING: Low oil detected       │
│     Consider adding oil soon        │
│                                      │
│  [✓ Confirm & Save]                │
└──────────────┬──────────────────────┘
               ↓
SAVED WITH 5 IMAGES ATTACHED
```

---

## **2. AI CHAT CAPTURE FLOW**

```
START
  ↓
┌─────────────────────────────────────┐
│  🏠 Home with Chat Interface        │
│                                      │
│  💬 "Tell me what you did..."       │
│  [Type or speak...]  🎤             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  💬 CONVERSATION                    │
│                                      │
│  YOU: I just filled up gas for      │
│       $42.50 at Shell               │
│                                      │
│  AI: Great! Let me help log that.   │
│      A few quick questions:         │
│                                      │
│      • How many gallons did you     │
│        pump? 🤔                     │
│                                      │
│  [Type answer...]                   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  💬 CONVERSATION (Continued)        │
│                                      │
│  YOU: About 13 gallons              │
│                                      │
│  AI: Perfect! And what's your       │
│      current mileage? 📏            │
│                                      │
│  YOU: 77,306                        │
│                                      │
│  AI: Excellent! Here's what I       │
│      captured. Does this look       │
│      correct? 👇                    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  🤖 AI PROPOSAL (In Chat)           │
│                                      │
│  ⛽ Fuel Fill-Up Summary:           │
│                                      │
│  Cost            $42.50   [Edit]    │
│  Gallons         13.0     [Edit]    │
│  Price/gallon    $3.27    [Edit]    │
│  Station         Shell    [Edit]    │
│  Odometer        77,306   [Edit]    │
│  Date            Today, now [Edit]  │
│                                      │
│  📸 Missing: Receipt photo          │
│                                      │
│  💡 Would you like to add a photo   │
│     for proof and better tracking?  │
│                                      │
│  [📷 Add Photo]                     │
│  [✓ Save Without Photo]             │
│  [✏️  Edit Details]                 │
└──────────────┬──────────────────────┘
               ↓ [User: "Save without photo"]
┌─────────────────────────────────────┐
│  ✅ EVENT SAVED!                    │
│                                      │
│  Your fuel fill-up is logged.       │
│                                      │
│  💡 Remember: You can add a photo   │
│     anytime by editing the event    │
│                                      │
│  [View on Timeline] [Add Another]   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  📋 TIMELINE                        │
│                                      │
│  ⛽ Fuel Fill-Up   8:00 PM          │
│     Shell - $42.50                  │
│     📷 No photo - Add later?        │ ← Gentle nudge
│  [...]                              │
└─────────────────────────────────────┘
```

---

## **3. MANUAL ENTRY FLOW**

```
START
  ↓
┌─────────────────────────────────────┐
│  📋 EVENT TYPE SELECTOR             │
│                                      │
│  Select event type:                 │
│                                      │
│  ⛽ Fuel Fill-Up                    │
│  🔧 Service/Maintenance             │
│  📏 Odometer Reading                │
│  [...more]                          │
└──────────────┬──────────────────────┘
               ↓ [User selects Fuel]
┌─────────────────────────────────────┐
│  ✍️  MANUAL FUEL ENTRY              │
│                                      │
│  💡 TIP: Camera is faster & more    │
│     accurate!                       │
│     [Switch to Camera 📷]           │
│  ────────────────────────────────   │
│                                      │
│  Cost *          [$ 42.50    ]      │
│  Gallons *       [  13.2 gal ]      │
│  Station         [  Shell    ]      │
│  Fuel type       [▼ Regular  ]      │
│  Odometer        [  77,306   ]      │
│  Date & time     [📅 Jan 9   ]      │
│                                      │
│  Receipt Photo (recommended)        │
│  [📷 Add Photo] or [Drop here]     │
│                                      │
│  Notes (optional)                   │
│  [                       ]          │
└──────────────┬──────────────────────┘
               ↓ [User fills & clicks Next]
┌─────────────────────────────────────┐
│  🤖 PREVIEW (Manual Entry)          │
│                                      │
│  Please review before saving:       │
│                                      │
│  ⛽ Fuel Fill-Up on Jan 9           │
│  $42.50 • 13.2 gal • Shell          │
│  77,306 miles                       │
│                                      │
│  ⚠️ No photo attached               │
│                                      │
│  💡 Add a receipt photo for:        │
│     • Proof of purchase             │
│     • Easier expense tracking       │
│     • Better AI insights            │
│                                      │
│  [📷 Add Photo Now]                 │
│  [✓ Save Anyway]                   │
│  [← Back to Edit]                   │
└──────────────┬──────────────────────┘
               ↓ [User: "Save anyway"]
┌─────────────────────────────────────┐
│  ✅ EVENT SAVED!                    │
│                                      │
│  [Success animation]                │
│                                      │
│  💡 Don't forget: You can add a     │
│     photo later from the event      │
│     details page                    │
│                                      │
│  [View Event] [Add Another]         │
└──────────────┬──────────────────────┘
               ↓
SAVED (Manual entry, no photo)
```

---

## **4. EVIDENCE NUDGE SYSTEM**

### **Timeline Display for Events Without Photos:**

```
┌─────────────────────────────────────┐
│ ⛽ Fuel Fill-Up   📷 [!]  8:00 PM  │ ← Red camera icon
│    Shell - $42.50                   │
│    Manual entry - No photo          │
├─────────────────────────────────────┤
│              $42.50                 │
│          13.2 gal × $3.22/gal      │
├─────────────────────────────────────┤
│ 📸 Add receipt photo?               │ ← Gentle nudge
│ [📷 Upload Photo]                  │
└─────────────────────────────────────┘
```

### **Weekly Reminder (Optional):**

```
┌─────────────────────────────────────┐
│  💡 WEEKLY TIP                      │
│                                      │
│  You have 3 events without photos   │
│  this week. Add photos for:         │
│                                      │
│  • Proof & warranty claims          │
│  • Better AI insights               │
│  • Accurate expense tracking        │
│                                      │
│  [Review Events] [Dismiss]          │
└─────────────────────────────────────┘
```

---

## **5. EDIT AFTER SAVE FLOW**

```
User views event on timeline (collapsed)
  ↓
Clicks to expand inline
  ↓
Sees all details
  ↓
Clicks "View full details & edit"
  ↓
┌─────────────────────────────────────┐
│  EVENT DETAIL PAGE                  │
│                                      │
│  [All sections with inline edit     │
│   buttons per field]                │
│                                      │
│  Cost         $42.50    [Edit ✏️]  │
│  Gallons      13.2      [Edit ✏️]  │
│  Station      Shell     [Edit ✏️]  │
│  [...]                              │
└──────────────┬──────────────────────┘
               ↓ [User clicks Edit on "Cost"]
┌─────────────────────────────────────┐
│  ✏️  EDIT FIELD: Cost               │
│                                      │
│  Current value: $42.50              │
│                                      │
│  New value:  [$ 45.00    ]          │
│                                      │
│  Reason for change (optional):      │
│  [Noticed error on receipt]         │
│                                      │
│  [✓ Save Change]  [Cancel]         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  ✅ CHANGE SAVED                    │
│                                      │
│  Cost updated: $42.50 → $45.00      │
│                                      │
│  This change was logged in the      │
│  event history.                     │
│                                      │
│  [Continue Editing]  [Done]         │
└─────────────────────────────────────┘
```

---

## **🎯 KEY PRINCIPLES:**

1. **AI Proposes, Human Disposes** - Never auto-save
2. **Progressive Disclosure** - Show less, reveal more
3. **Multiple Entry Points** - Vision > Chat > Manual
4. **Always Validate** - Review before save
5. **Gentle Nudges** - Encourage photos, don't force
6. **User Control** - Easy edits, clear history
7. **Skip Anytime** - Never block users
8. **Evidence Matters** - Photos = proof, but optional

---

**This architecture puts users in complete control while guiding them to best practices!** 🚀✨
