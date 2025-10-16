# ✅ **BASE COMPONENTS COMPLETE - LOCKED SPECIFICATION**

## **🎯 WHAT I BUILT:**

### **6 Base Components That ENFORCE Consistency:**

1. **✅ EventCard** - Shell for every card
2. **✅ HeroMetric** - Primary numeric values
3. **✅ DataGrid** - 2-column data (2-4 items)
4. **✅ DataList** - Key-value list (3+ items)
5. **✅ StatusBadge** - Status indicators
6. **✅ AlertBox** - Warning/error boxes

---

## **📐 LOCKED SPECIFICATIONS:**

### **1. EventCard - The Shell**

**EVERY card uses this. NO exceptions.**

```tsx
<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Shell"
  time="9:00 PM"
  variant="normal" // or 'warning' or 'error'
>
  {/* Body content goes here */}
</EventCard>
```

**Structure:**
- Header: px-6 py-4
- Icon: w-10 h-10 (40x40px)
- Title: text-sm font-semibold
- Subtitle: text-xs text-gray-500
- Time: text-xs font-semibold text-gray-600
- Divider: border-t border-gray-100
- Body: p-6 space-y-6

---

### **2. HeroMetric - Primary Value**

**Use ONLY for primary numeric values.**

```tsx
<HeroMetric
  value="$42.50"
  context="12.6 gal × $3.37/gal"
/>
```

**Rules:**
- Value: ALWAYS text-4xl font-bold
- Context: ALWAYS text-sm text-gray-500 mt-2
- Background: ALWAYS bg-gray-50
- Padding: ALWAYS py-6 -mx-6 px-6 (full width)

**Use for:**
- ✅ Cost (Fuel, Service, Damage)
- ✅ Readings (Odometer, Tire Tread)
- ✅ Single count

**DON'T use for:**
- ❌ Status words (Checked, Pending)
- ❌ Multiple equal values

---

### **3. DataGrid - 2 Columns**

**For 2-4 data points with short values.**

```tsx
<DataGrid
  items={[
    { label: 'Odometer', value: '77,338 mi' },
    { label: 'Efficiency', value: '32.1 MPG' }
  ]}
/>
```

**Output:**
```
Odometer          Efficiency
77,338 mi         32.1 MPG
```

**Rules:**
- Layout: grid grid-cols-2 gap-x-4 gap-y-3
- Label: text-xs text-gray-500 mb-1
- Value: text-sm font-semibold text-gray-900

---

### **4. DataList - Key-Value**

**For 3+ data points or longer values.**

```tsx
<DataList
  items={[
    { label: 'Odometer', value: '77,338 mi' },
    { label: 'Next service due', value: 'In 5,000 mi' },
    { label: 'Provider', value: 'Jiffy Lube' }
  ]}
/>
```

**Output:**
```
Odometer            77,338 mi
Next service due    In 5,000 mi
Provider            Jiffy Lube
```

**Rules:**
- Layout: space-y-3, justify-between
- Label: text-xs text-gray-500
- Value: text-sm font-semibold text-gray-900

---

### **5. StatusBadge - Status Indicators**

**ALWAYS at bottom of card. NEVER in header.**

```tsx
<StatusBadge variant="success" icon={<TrendingUp className="w-4 h-4" />}>
  Exceptional efficiency
</StatusBadge>
```

**Variants:**
- `success` - Green (good status)
- `warning` - Orange (caution)
- `error` - Red (critical)
- `info` - Blue (informational)

**Rules:**
- Text: text-xs font-semibold
- Icon: w-4 h-4
- Padding: px-3 py-2
- Always inline-flex

---

### **6. AlertBox - Warnings/Errors**

**For dashboard warnings, recalls, critical notices.**

```tsx
<AlertBox
  variant="error"
  icon={<AlertCircle className="w-5 h-5" />}
  title="Check Engine"
  description="Multiple systems warning detected"
/>
```

**Variants:**
- `error` - Red box
- `warning` - Orange box
- `info` - Blue box

**Rules:**
- Icon: w-5 h-5, flex-shrink-0, mt-0.5
- Title: text-sm font-semibold
- Description: text-xs mt-1
- Padding: p-4

---

## **🎨 DESIGN TOKENS (LOCKED):**

### **Typography:**
```
Hero value:   text-4xl font-bold text-gray-900
Hero context: text-sm text-gray-500 mt-2
Card title:   text-sm font-semibold text-gray-900
Subtitle:     text-xs text-gray-500
Time:         text-xs font-semibold text-gray-600
Data label:   text-xs text-gray-500 mb-1
Data value:   text-sm font-semibold text-gray-900
Badge text:   text-xs font-semibold
Alert title:  text-sm font-semibold
Alert desc:   text-xs
```

### **Spacing:**
```
Card header:  px-6 py-4
Card body:    p-6 space-y-6
Hero section: py-6 -mx-6 px-6
Data grid:    gap-x-4 gap-y-3
Data list:    space-y-3
Badge:        px-3 py-2
Alert box:    p-4
Icon circle:  w-10 h-10
Hero icon:    w-5 h-5
Badge icon:   w-4 h-4
Alert icon:   w-5 h-5
```

### **Colors:**
```
Normal cards:
- Border: border-gray-200
- Icon bg: bg-{color}-50
- Divider: border-gray-100
- Hero bg: bg-gray-50

Warning accent:
- Left border: border-l-4 border-l-orange-500
- Header bg: bg-orange-50/30
- Divider: border-orange-100

Error accent:
- Left border: border-l-4 border-l-red-500
- Header bg: bg-red-50/30
- Divider: border-red-100

Badges:
- Success: bg-green-50, border-green-200, text-green-700/600
- Warning: bg-orange-50, border-orange-200, text-orange-700/600
- Error: bg-red-50, border-red-200, text-red-700/600
- Info: bg-blue-50, border-blue-200, text-blue-700/600
```

---

## **📊 NEXT STEPS:**

### **Phase 2: Rebuild Event Renderers**

Now I'll rebuild each event type using ONLY these components:

1. ✅ **Fuel** - Already correct pattern
2. ✅ **Service** - Already correct pattern
3. ⏳ **Dashboard Warning** - Fix: Remove CTA button, use AlertBox + Badge
4. ⏳ **Odometer** - Apply components
5. ⏳ **Tire Tread** - Add hero metric (tread depth)
6. ⏳ **Tire Pressure** - Add pressure data
7. ⏳ **Damage** - Fix: Hero for cost, grid for severity/status
8. ⏳ **Parking** - Fix: Hero for spot, list for details
9. ⏳ **Inspection** - Fix: Remove "NEW!" from header, use hero for Pass/Fail
10. ⏳ **Recall** - Fix: Remove "NEW!", use AlertBox
11. ⏳ **Manual Note** - Fix: Truncate text properly
12. ⏳ **Dashboard Snapshot** - Fix: Use DataList
13. ⏳ **Document** - TBD

---

## **💡 HOW TO USE:**

### **Example: Fuel Card**

```tsx
import { EventCard, HeroMetric, DataGrid, StatusBadge } from '../card-components'
import { Fuel, TrendingUp } from 'lucide-react'

<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Shell"
  time="9:00 PM"
>
  <HeroMetric
    value="$42.50"
    context="12.6 gal × $3.37/gal"
  />
  
  <DataGrid
    items={[
      { label: 'Odometer', value: '77,338 mi' },
      { label: 'Efficiency', value: '32.1 MPG' }
    ]}
  />
  
  <StatusBadge variant="success" icon={<TrendingUp className="w-4 h-4" />}>
    Exceptional efficiency
  </StatusBadge>
</EventCard>
```

### **Example: Dashboard Warning**

```tsx
import { EventCard, AlertBox, StatusBadge } from '../card-components'
import { AlertTriangle, AlertCircle } from 'lucide-react'

<EventCard
  icon={<AlertTriangle className="w-5 h-5" />}
  iconBg="bg-orange-100"
  iconColor="text-orange-600"
  title="Dashboard Warning"
  subtitle="4 warnings active"
  time="6:21 PM"
  variant="warning"  // Orange left border
>
  <AlertBox
    variant="error"
    icon={<AlertCircle className="w-5 h-5" />}
    title="Check Engine"
    description="Multiple systems warning detected"
  />
  
  <div className="flex flex-wrap gap-2">
    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
      O2 Sensors
    </span>
    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
      Brake System
    </span>
  </div>
  
  <StatusBadge variant="warning">
    Diagnostic scan recommended
  </StatusBadge>
</EventCard>
```

---

## **✅ BENEFITS:**

1. **Enforced Consistency** - Can't deviate from spec
2. **Reusable** - Same components everywhere
3. **Maintainable** - Change once, updates all
4. **Documented** - Clear rules for each component
5. **Type-safe** - TypeScript ensures correct usage

---

**Ready to rebuild event renderers with these components!** 🚀✨
