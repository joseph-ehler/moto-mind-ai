# 🎨 Event Header - Vehicle Page Alignment

## Final Design Philosophy
**"More prominent, aligns with vehicle details header, not shouty, matches in many ways"**

---

## ✅ Key Changes

### 1. **Receipt Photo in Header** 📸
**Just like vehicle page has vehicle photo!**

**With Photo:**
```
┌─────────────────────────────────────────────┐
│ [Large Receipt Image - aspect 21/9]         │
│ [Gradient overlay bottom]                   │
└─────────────────────────────────────────────┘
```

**Without Photo:**
```
┌─────────────────────────────────────────────┐
│           🧾                                 │
│     No Receipt Photo                        │
│  [Dashed border placeholder]                │
└─────────────────────────────────────────────┘
```

**Like Vehicle:**
- Same `aspect-[21/9]` ratio
- Same `rounded-2xl`
- Same gradient overlay
- Same dashed placeholder pattern

---

### 2. **Hero Typography** ✍️
**Matches vehicle page exactly:**

```tsx
// Vendor Name (like vehicle "2020 Honda Civic")
<Heading level="hero" className="text-white text-3xl md:text-4xl font-bold tracking-tight">
  Shell Gas Station
</Heading>

// Subtitle (like vehicle trim/garage)
<Text className="text-lg text-white/70 font-medium">
  ⛽ Fuel Fill-Up • Thu, Jul 10, 2020 • 10:40 AM
</Text>
```

**Result:**
- Large, bold vendor name (3xl/4xl)
- Subtle subtitle with metadata
- Same text sizes as vehicle
- Same hierarchy

---

### 3. **Prominent Stat Pills** 🏷️
**Just like vehicle page!**

**Fuel Event Pills:**
```
[$98.55] [33.18 gal] [$2.970/gal] [90,000 mi] [✓ Complete]
```

**Like Vehicle Pills:**
```
[85,034 mi] [2 alerts] [87/100 health]
```

**Same Design:**
- `px-4 py-2.5` padding
- `bg-white/15` semi-transparent
- `rounded-full` pill shape
- `border border-white/10` subtle border
- Icon + text in each pill

**Special Completion Pill:**
- Complete → Green `bg-green-500` with ✓
- Incomplete → Amber `bg-amber-500` with number

---

### 4. **Height & Proportions** 📏

**Now:**
- Height: `500px` (vehicle ~500px with photo)
- Padding: `py-12` (same as vehicle)
- Spacing: `Stack spacing="lg"` (matches vehicle)

**Structure:**
```
500px hero section
├─ Back button & actions
├─ Receipt photo (aspect 21/9)
└─ Title + subtitle + stats
```

---

## 🎨 Side-by-Side Comparison

### **Vehicle Page Header**
```
┌──────────────────────────────────────────┐
│ ~500px Dark Slate Gradient               │
│                                           │
│ ← Back to garage                         │
│                                           │
│ [Vehicle Photo - aspect 21/9]            │
│                                           │
│ 2020 Honda Civic                         │
│ LX • My Daily • Garage Name              │
│                                           │
│ [85,034 mi] [2 alerts] [87/100 health]   │
│                                           │
│ [Specs] [Docs]                           │
└──────────────────────────────────────────┘
```

### **Event Page Header (NEW)**
```
┌──────────────────────────────────────────┐
│ ~500px Dark Slate Gradient               │
│                                           │
│ ← Back to timeline                       │
│                                           │
│ [Receipt Photo - aspect 21/9]            │
│                                           │
│ Shell Gas Station                        │
│ ⛽ Fuel Fill-Up • Thu, Jul 10, 2020      │
│                                           │
│ [$98.55] [33.18 gal] [$2.970/gal] [✓]   │
│                                           │
│ [📍 1 Goodsprings Rd, Jean, NV]          │
└──────────────────────────────────────────┘
```

---

## 🎯 Matching Elements

### **✅ Same Structure**
1. Dark gradient background
2. Back button (top-left)
3. Action buttons (top-right)
4. Large photo/placeholder (aspect 21/9)
5. Hero title (3xl/4xl)
6. Subtitle (text-lg)
7. Stat pills
8. Optional secondary info

### **✅ Same Spacing**
- Container: `max-w-4xl` ← Same
- Padding: `px-4 sm:px-6 lg:px-8` ← Same
- Vertical: `py-12` ← Same
- Stack: `spacing="lg"` ← Same

### **✅ Same Visual Weight**
- Photo: Prominent, same size
- Title: Large and bold (hero level)
- Pills: Eye-catching, semi-transparent
- Overall: Substantial, professional

---

## 🔄 What Makes It Distinct?

### **Vehicle Page:**
- **Photo:** Vehicle image
- **Title:** "2020 Honda Civic"
- **Subtitle:** Trim, nickname, garage
- **Pills:** Mileage, alerts, health
- **Actions:** Specs, Docs buttons

### **Event Page:**
- **Photo:** Receipt image
- **Title:** "Shell Gas Station"
- **Subtitle:** Event type, date, time
- **Pills:** Cost, gallons, price, completion
- **Actions:** Location badge

---

## 💡 Why This Works

### **1. Familiar Pattern**
Users who know the vehicle page will feel at home

### **2. Visual Hierarchy**
Photo → Title → Pills (same hierarchy)

### **3. Information Density**
Same amount of info, same prominence

### **4. Professional Feel**
Matches the polished vehicle page aesthetic

### **5. Not Shouty**
- Neutral slate gradient (not bright)
- Semi-transparent pills (not solid)
- Proper spacing (not cramped)
- Balanced (not overwhelming)

---

## 📊 Technical Details

### **Photo Handling**
```tsx
{hasReceipt ? (
  <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-white/10 backdrop-blur">
    <img src={receiptUrl} className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80..." />
  </div>
) : (
  <div className="w-full aspect-[21/9] rounded-2xl bg-white/5 border-2 border-dashed...">
    <Receipt icon placeholder />
  </div>
)}
```

### **Title Hierarchy**
```tsx
<Heading level="hero" className="text-white text-3xl md:text-4xl font-bold tracking-tight">
  {event.display_vendor || event.vendor || 'Event Details'}
</Heading>
```

### **Stat Pills**
```tsx
<Flex align="center" gap="sm" className="flex-wrap">
  <Flex align="center" gap="xs" className="px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10">
    <DollarSign className="w-4 h-4 text-white" />
    <Text className="text-sm font-semibold text-white">${amount}</Text>
  </Flex>
  {/* More pills... */}
</Flex>
```

---

## ✅ Result

**The event header now:**
- ✅ Matches vehicle page structure
- ✅ Same visual weight & prominence
- ✅ Same typography scale
- ✅ Same photo treatment
- ✅ Same pill design
- ✅ Not shouty (neutral colors)
- ✅ Professional & polished
- ✅ Distinct but familiar

**Users will immediately understand the pattern from the vehicle page and feel at home!** 🏠✨

---

## 📸 What Changed from Previous

### **Before (V2):**
- No photo in header
- Smaller title (2xl/3xl)
- Inline text metrics
- Subtle completion note
- 280-400px tall

### **After (V3 - Vehicle-Aligned):**
- Receipt photo in header (21/9)
- Hero title (3xl/4xl)
- Prominent stat pills
- Colored completion badge
- 500px tall

**Result:** More substantial, matches vehicle page, but still refined and not shouty! 🎨
