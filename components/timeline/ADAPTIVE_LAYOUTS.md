# 🎨 **ADAPTIVE DATA DISPLAY LAYOUTS**

## **🎯 INTELLIGENT LAYOUT SELECTION**

The `DataDisplay` component automatically chooses the best layout based on your data:

1. **2-Column Grid** - For 2-4 items with short values (clean, compact)
2. **Single-Column List** - For 1 item, 5+ items, or long values (scannable, clear)

**Both layouts maintain: Label LEFT, Value RIGHT in every column.**

---

## **📊 LAYOUT 1: TWO-COLUMN GRID**

### **When to Use:**
- ✅ 2-4 data items
- ✅ Values are short (<20 characters)
- ✅ Want compact, balanced display

### **Visual Structure:**
```
┌─────────────────────────────────────────────────┐
│  Label 1      Value 1  │  Label 3      Value 3 │
├─────────────────────────┼─────────────────────────┤
│  Label 2      Value 2  │  Label 4      Value 4 │
└─────────────────────────┴─────────────────────────┘
```
✅ Horizontal dividers between rows for clarity

### **Example: Fuel Event (2 items)**
```tsx
<DataDisplay
  items={[
    { label: 'Odometer', value: '77,306 mi' },
    { label: 'Efficiency', value: '32.5 MPG' }
  ]}
/>
```

**Renders as:**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Efficiency   32.5 MPG│
└─────────────────────────┴─────────────────────────┘
```
✨ Single row, no divider needed

### **Example: Service Event (4 items)**
```tsx
<DataDisplay
  items={[
    { label: 'Odometer', value: '77,306 mi' },
    { label: 'Labor', value: '2.5 hours' },
    { label: 'Warranty', value: '12 months' },
    { label: 'Status', value: 'Complete' }
  ]}
/>
```

**Renders as:**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Warranty   12 months │
├─────────────────────────┼─────────────────────────┤
│  Labor        2.5 hours │  Status     Complete  │
└─────────────────────────┴─────────────────────────┘
```
✅ Divider between the two rows

**Benefits:**
- ✅ Compact and balanced
- ✅ Great use of horizontal space
- ✅ Horizontal dividers between rows for clarity
- ✅ Easy to scan both columns
- ✅ Each column maintains label/value relationship

---

## **📊 LAYOUT 2: SINGLE-COLUMN LIST**

### **When to Use:**
- ✅ 1 item (minimal data)
- ✅ 5+ items (lots of data)
- ✅ Long values (>20 characters)
- ✅ Need maximum clarity

### **Visual Structure:**
```
┌─────────────────────────────────────────────────┐
│  Label 1                              Value 1   │
├─────────────────────────────────────────────────┤
│  Label 2                              Value 2   │
├─────────────────────────────────────────────────┤
│  Label 3                              Value 3   │
└─────────────────────────────────────────────────┘
```

### **Example: Sparse Data (1 item)**
```tsx
<DataDisplay
  items={[
    { label: 'Location', value: 'Shell Station' }
  ]}
/>
```

**Renders as:**
```
┌─────────────────────────────────────────────────┐
│  Location                      Shell Station    │
└─────────────────────────────────────────────────┘
```

### **Example: Rich Data (7 items)**
```tsx
<DataDisplay
  items={[
    { label: 'Mileage', value: '77,306 mi' },
    { label: 'Fuel level', value: '65%' },
    { label: 'Oil life', value: '42%' },
    { label: 'Tire pressure', value: 'Normal' },
    { label: 'Engine temp', value: '195°F' },
    { label: 'Coolant temp', value: 'Normal' },
    { label: 'Battery voltage', value: '14.2V' }
  ]}
  compact={true}
/>
```

**Renders as:**
```
┌─────────────────────────────────────────────────┐
│  Mileage                            77,306 mi   │
├─────────────────────────────────────────────────┤
│  Fuel level                              65%    │
├─────────────────────────────────────────────────┤
│  Oil life                                42%    │
├─────────────────────────────────────────────────┤
│  Tire pressure                         Normal   │
├─────────────────────────────────────────────────┤
│  Engine temp                            195°F   │
├─────────────────────────────────────────────────┤
│  Coolant temp                          Normal   │
├─────────────────────────────────────────────────┤
│  Battery voltage                        14.2V   │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Clear dividers between rows
- ✅ Easy to scan down the list
- ✅ Handles long values gracefully
- ✅ Compact mode for many items

---

## **🎯 AUTO-DETECTION LOGIC:**

```typescript
// Automatic layout selection
const shouldUseGrid = 
  items.length >= 2 &&           // At least 2 items
  items.length <= 4 &&           // At most 4 items
  items.every(item => 
    String(item.value).length < 20  // All values short
  )

if (shouldUseGrid) {
  // Use 2-column grid
} else {
  // Use single-column list with dividers
}
```

---

## **📐 COMPARISON: ALL SCENARIOS**

### **1 Item (Always List):**
```
┌─────────────────────────────────────────────────┐
│  Odometer                           77,306 mi   │
└─────────────────────────────────────────────────┘
```

### **2 Items with Short Values (Grid):**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Efficiency   32.5 MPG│
└─────────────────────────┴─────────────────────────┘
```

### **2 Items with Long Values (List):**
```
┌─────────────────────────────────────────────────┐
│  Service           Oil Change + Air Filter      │
├─────────────────────────────────────────────────┤
│  Provider          Joe's Auto Repair & Service  │
└─────────────────────────────────────────────────┘
```

### **3 Items (Grid):**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Fuel type    Regular │
├─────────────────────────┼─────────────────────────┤
│  Efficiency   32.5 MPG  │                       │
└─────────────────────────┴─────────────────────────┘
```

### **4 Items (Grid):**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Warranty   12 months │
├─────────────────────────┼─────────────────────────┤
│  Labor        2.5 hours │  Status     Complete  │
└─────────────────────────┴─────────────────────────┘
```

### **5+ Items (Always List):**
```
┌─────────────────────────────────────────────────┐
│  Mileage                            77,306 mi   │
├─────────────────────────────────────────────────┤
│  Fuel level                              65%    │
├─────────────────────────────────────────────────┤
│  Oil life                                42%    │
├─────────────────────────────────────────────────┤
│  Tire pressure                         Normal   │
├─────────────────────────────────────────────────┤
│  Engine temp                            195°F   │
└─────────────────────────────────────────────────┘
```

---

## **🎨 DESIGN TOKENS:**

### **2-Column Grid:**
```css
Layout:          grid grid-cols-2 gap-x-6
Row spacing:     py-3
Row divider:     border-b border-gray-100 (except last row)
Label:           text-xs text-gray-500 font-medium pr-3
Value:           text-sm font-semibold text-gray-900 text-right
Highlight:       bg-blue-50/50 -mx-2 px-2 rounded
```

### **Single-Column List:**
```css
Layout:          divide-y divide-gray-100
Row spacing:     py-3 (default) or py-2 (compact)
Label:           text-xs text-gray-500 font-medium pr-4
Value:           text-sm font-semibold text-gray-900 text-right
Divider:         border-gray-100
Highlight:       bg-blue-50/50 -mx-1 px-1 rounded
```

---

## **🔧 MANUAL OVERRIDE:**

You can force a specific layout if needed:

```tsx
// Force grid (even with 5+ items or long values)
<DataDisplay
  items={items}
  layout="grid"
/>

// Force list (even with 2-4 short items)
<DataDisplay
  items={items}
  layout="list"
/>

// Auto-detect (default)
<DataDisplay
  items={items}
  layout="auto"
/>
```

---

## **💡 BEST PRACTICES:**

### **When Auto-Detection Works Best:**
1. ✅ **Let it decide** - The algorithm handles 95% of cases perfectly
2. ✅ **Fuel events** - 2 items (Odometer + Efficiency) = Grid
3. ✅ **Service events** - 2-4 items = Grid, 5+ items = List
4. ✅ **Dashboard snapshots** - 7+ items = List with compact mode

### **When to Use Manual Override:**
1. 🎯 **Consistency** - Want all cards of same type to use same layout
2. 🎯 **Design preference** - Prefer list for visual consistency
3. 🎯 **Special cases** - Custom business logic for layout

### **Highlight Usage:**
```tsx
// Highlight important or exceptional values
<DataDisplay
  items={[
    { label: 'Odometer', value: '77,306 mi' },
    { 
      label: 'Efficiency', 
      value: '32.5 MPG',
      highlight: true  // ← Blue background for exceptional MPG
    }
  ]}
/>
```

---

## **📱 RESPONSIVE BEHAVIOR:**

### **Desktop (≥768px):**
- Grid: Full 2 columns with gap-x-6
- List: Standard py-3 spacing

### **Mobile (<768px):**
- Grid: Maintains 2 columns (stacks naturally on very small screens)
- List: Slightly tighter spacing if needed
- Values text-wrap as needed

---

## **✅ BENEFITS OF ADAPTIVE LAYOUT:**

### **1. Automatic Optimization**
- ❌ Before: Choose DataGrid OR DataList manually
- ✅ After: One component, intelligent layout

### **2. Visual Balance**
- ❌ Before: Grid felt off-balanced, list was always vertical
- ✅ After: Grid for compact, list for clarity

### **3. Data Variance**
- ❌ Before: Hard to handle 1-10+ items gracefully
- ✅ After: Perfect layout for any count

### **4. Label/Value Clarity**
- ❌ Before: Grid had labels above values
- ✅ After: ALWAYS label left, value right (every column)

### **5. Developer Experience**
- ❌ Before: `if (items.length <= 4) <Grid /> else <List />`
- ✅ After: `<DataDisplay items={items} />` (done!)

---

## **🎉 EXAMPLES IN PRODUCTION:**

### **Fuel Event (Auto → Grid):**
```tsx
// 2 items, short values → 2-column grid with dividers
<EventCard ...>
  <HeroMetric value="$42.50" context="13.2 gal × $3.22/gal" />
  
  <DataDisplay items={[
    { label: 'Odometer', value: '77,306 mi' },
    { label: 'Efficiency', value: '32.5 MPG', highlight: true }
  ]} />
  
  <AISummary summary="..." />
  <StatusBadge>Exceptional efficiency</StatusBadge>
</EventCard>
```

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  Odometer     77,306 mi │  Efficiency   32.5 MPG│
└─────────────────────────┴─────────────────────────┘
```

### **Dashboard Snapshot (Auto → List):**
```tsx
// 7 items → List with compact
<EventCard ...>
  <DataDisplay
    items={[
      { label: 'Mileage', value: '77,306 mi' },
      { label: 'Fuel level', value: '65%' },
      { label: 'Oil life', value: '42%' },
      // ... 4 more
    ]}
    compact={true}
  />
  
  <AISummary summary="..." />
</EventCard>
```

### **Service Event (Auto → Grid if 2-4, List if 5+):**
```tsx
// Varies based on data extracted
<EventCard ...>
  <HeroMetric value="$250.00" context="Oil Change + Air Filter" />
  
  <DataDisplay items={extractedData} />  {/* Auto-adapts! */}
  
  <StatusBadge>Service overdue</StatusBadge>
</EventCard>
```

---

## **🚀 SUMMARY:**

The adaptive `DataDisplay` component:

1. ✅ **Auto-detects** the best layout (grid vs list)
2. ✅ **Maintains** label-left/value-right in every column
3. ✅ **Scales** from 1 to 20+ items gracefully
4. ✅ **Handles** short and long values intelligently
5. ✅ **Provides** manual override when needed

**Result:** Your timeline cards look perfect whether the user uploads a minimal receipt or a data-rich dashboard photo! 🎨✨
