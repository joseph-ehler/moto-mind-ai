# User-Editable Specifications System

## Overview
Complete system for users to fill in missing specification data with smart ordering that prioritizes completed categories.

---

## Components Created

### 1. **EditSpecCategoryModal Component**
`components/vehicle/EditSpecCategoryModal.tsx`

**Purpose:** Reusable modal for editing any specification category

**Features:**
- Category-specific field definitions
- Form validation
- Loading states
- Error handling
- User education tooltip

**Usage:**
```tsx
<EditSpecCategoryModal
  isOpen={modalState.isOpen}
  onClose={() => setModalState({ isOpen: false })}
  category="engine"
  categoryLabel="Engine Performance"
  fields={getCategoryFields('engine')}
  currentData={engineData}
  onSave={handleSaveCategory}
/>
```

---

### 2. **API Endpoint**
`pages/api/vehicles/[id]/specs/update-category.ts`

**Method:** POST

**Payload:**
```json
{
  "category": "engine",
  "data": {
    "horsepower": 182,
    "torque": 176,
    "displacement": "2.5"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "engine",
    "data": { ... },
    "sources": ["nhtsa", "user_override"],
    "confidence": "high"
  }
}
```

**Features:**
- Merges user data with existing AI data
- Adds `user_override` to sources array
- Marks confidence as "high" for user-provided data
- Preserves existing data not being edited

---

### 3. **Smart Ordering System**
`lib/utils/spec-ordering.ts`

**Purpose:** Sort categories by completion status and importance

**Importance Hierarchy:**
```typescript
1. Maintenance Intervals (9) - Most critical
2. Fluids & Capacities (8)  - Essential for maintenance
3. Engine (7)               - Core performance
4. Drivetrain (6)           - Core function
5. Fuel Economy (5)         - Daily concern
6. Tire Specifications (4)  - Safety/maintenance
7. Safety (3)               - Important reference
8. Dimensions (2)           - Reference info
9. Features (1)             - Nice to know
```

**Sorting Logic:**
1. **Primary sort:** Filled vs Empty
   - Categories with data appear first
   - Empty categories pushed to bottom
   
2. **Secondary sort:** Importance (within each group)
   - Filled categories sorted by importance (9→1)
   - Empty categories sorted by importance (9→1)

**Functions:**
```typescript
sortSpecCategories(categories) 
// Returns sorted array with metadata

categoryHasData(data)
// Returns true if category has at least one non-null field

getCategoryLabel(category)
// Returns display label

getCategoryFields(category)
// Returns field definitions for editing
```

---

## Implementation in Specifications Page

### Step 1: Add Edit Buttons

Add "Edit" button to each category header:

```tsx
<div className="px-8 py-4 border-b border-black/5 flex items-center justify-between">
  <div>
    <h3 className="text-lg font-semibold text-black">Engine Performance</h3>
  </div>
  <button
    onClick={() => handleEditCategory('engine')}
    className="text-sm text-blue-600 hover:underline"
  >
    Edit
  </button>
</div>
```

### Step 2: Implement Sort Logic

```tsx
import { sortSpecCategories, getCategoryFields } from '@/lib/utils/spec-ordering'

// Sort categories by filled status and importance
const sortedCategories = sortSpecCategories(nhtsaSpecs)

// Render in sorted order
{sortedCategories.map(cat => (
  <CategorySection 
    key={cat.category}
    category={cat.category}
    label={cat.label}
    data={cat.data}
    hasData={cat.hasData}
  />
))}
```

### Step 3: Handle Edit Flow

```tsx
const [editModal, setEditModal] = useState({
  isOpen: false,
  category: '',
  categoryLabel: '',
  currentData: {}
})

const handleEditCategory = (category: string) => {
  setEditModal({
    isOpen: true,
    category,
    categoryLabel: getCategoryLabel(category),
    currentData: getSpecData(category)
  })
}

const handleSaveCategory = async (data: Record<string, any>) => {
  const response = await fetch(`/api/vehicles/${id}/specs/update-category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: editModal.category,
      data
    })
  })
  
  if (response.ok) {
    // Refresh specs data
    mutate(`/api/vehicles/${id}/specs`)
  }
}
```

---

## User Experience Flow

### Scenario 1: Empty Category
```
[Tire Specifications] (empty state showing)
   ↓
User clicks "Edit" button
   ↓
Modal opens with tire fields (all empty)
   ↓
User fills: 225/55R18 front, 225/55R18 rear, 33 PSI front, 32 PSI rear
   ↓
Clicks "Save Changes"
   ↓
API updates category with user_override source
   ↓
Category moves UP in display order (now has data)
   ↓
Shows data with "Custom" badge
```

### Scenario 2: Partial Data
```
[Engine Performance] (has horsepower from AI, missing torque)
   ↓
User clicks "Edit"
   ↓
Modal shows: HP=182 (pre-filled), Torque=(empty), etc.
   ↓
User adds: Torque=176
   ↓
Saves
   ↓
Merges with existing: {horsepower: 182, torque: 176}
   ↓
Sources: ["openai_web_search", "user_override"]
```

---

## Display Order Examples

### Before (Default Order):
1. Engine Performance (empty)
2. Fuel Economy (empty)
3. Dimensions (empty)
4. Features (empty)
5. Safety (has data)
6. Maintenance Intervals (has data)
7. Fluids & Capacities (empty)
8. Tire Specifications (empty)

### After Smart Ordering:
**Filled Categories (by importance):**
1. Maintenance Intervals ⭐ (9 - has data)
2. Safety ⭐ (3 - has data)

**Empty Categories (by importance):**
3. Fluids & Capacities (8 - empty)
4. Engine (7 - empty)
5. Fuel Economy (5 - empty)
6. Tire Specifications (4 - empty)
7. Dimensions (2 - empty)
8. Features (1 - empty)

---

## Source Attribution

User-edited data is clearly marked:

```tsx
<SourceBadge 
  sources={["nhtsa", "user_override"]} 
  hasValue={true} 
/>
// Shows: "Custom" badge in purple
```

**Badge Priority:**
1. ✅ NHTSA verified (green) - Official database
2. 🌐 Web research (blue) - AI-sourced
3. 💾 **Custom (purple)** - User-provided ← NEW
4. ⚠️ Not available (gray) - Missing

---

## Benefits

### For Users
✅ **Fill gaps** - Add missing data AI couldn't find  
✅ **Correct errors** - Fix AI misinterpretations  
✅ **See relevance** - Important categories appear first  
✅ **Track source** - "Custom" badge shows user edits  
✅ **Easy editing** - Clean modal with field labels  

### For System
✅ **Better data** - User contributions improve database  
✅ **Clear attribution** - `user_override` source tracked  
✅ **Merge logic** - User data doesn't overwrite all AI data  
✅ **Smart display** - Filled categories prioritized  
✅ **Crowdsourcing ready** - Foundation for community data  

---

## Future Enhancements (Optional)

### Phase 2: Verification
- "Is this correct?" prompts on AI data
- Vote up/down on crowdsourced values
- Confidence scores based on agreement

### Phase 3: Community Data
- Show "5 users reported..." for popular vehicles
- Suggest common values: "Most 2024 Foresters: 182 HP"
- Badge: "Verified by 12 users"

### Phase 4: Bulk Import
- "Import from owner's manual photo"
- Parse PDF and extract all specs
- Review screen before saving

---

## Technical Notes

### Data Merging
User data is merged with existing data, not replaced:
```typescript
const mergedData = {
  ...existingData,  // AI data preserved
  ...userData       // User edits override
}
```

### Source Tracking
```typescript
sources: ["nhtsa", "openai_web_search", "user_override"]
//        ↑         ↑                   ↑
//        Base      Enhanced            User-edited
```

### Empty Detection
Category is "empty" if ALL fields are null/undefined:
```typescript
Object.values(data).every(v => !v) // true = empty
```

---

## Success Criteria

✅ **Users can fill any category** - All 9 categories editable  
✅ **Smart ordering works** - Filled categories appear first  
✅ **Source attribution clear** - "Custom" badge visible  
✅ **Data persists** - Survives page refresh  
✅ **Merges correctly** - User data + AI data coexist  

---

**Status:** Ready to integrate into specifications page.

**Estimated implementation time:** 2-3 hours
- Add edit buttons to category headers
- Implement sorting logic
- Wire up modal state management
- Test edit flow across all categories
