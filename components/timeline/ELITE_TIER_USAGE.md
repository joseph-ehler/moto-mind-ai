# 🏆 **ELITE TIER COMPONENTS - USAGE GUIDE**

## **✅ ALL FEATURES IMPLEMENTED!**

We now have a complete, production-ready elite-tier timeline card system with:

1. ✅ **Quality Indicators** - Show extraction confidence
2. ✅ **Source Images** - Display uploaded photos
3. ✅ **Progressive Disclosure** - Collapsible details
4. ✅ **Quick Actions** - Edit, Flag, Share buttons
5. ✅ **Skeleton Loading** - Smooth loading states
6. ✅ **Extraction Warnings** - Transparent about data quality

---

## **📦 COMPLETE COMPONENT LIST:**

### **Core Components:**
- `EventCard` - Enhanced shell with all features
- `HeroMetric` - Primary value display
- `DataDisplay` - Adaptive 1-2 column layout
- `StatusBadge` - Status indicators
- `AlertBox` - Warning/error boxes
- `AISummary` - AI insights with confidence

### **Elite Tier Components:**
- `QualityIndicator` - Extraction quality dots/badge
- `SourceImage` - Image display with lightbox
- `CollapsibleData` - Progressive disclosure
- `EventCardSkeleton` - Loading placeholders
- `ExtractionWarning` - Inline warnings
- `InlineWarning` - Subtle row warnings

---

## **🎯 COMPLETE EXAMPLE: Data-Rich Fuel Event**

```tsx
import {
  EventCard,
  HeroMetric,
  DataDisplay,
  CollapsibleData,
  SourceImage,
  AISummary,
  StatusBadge,
  ExtractionWarning
} from '@/components/timeline/card-components'
import { Fuel, TrendingUp } from 'lucide-react'

// Complete example with ALL features
<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Shell"
  time="8:00 PM"
  
  // ELITE: Quality indicator
  quality={{
    level: 'high',
    details: {
      fieldsExtracted: 5,
      fieldsMissing: 1,
      imageQuality: 92
    }
  }}
  
  // ELITE: Quick actions
  actions={{
    onEdit: () => console.log('Edit event'),
    onFlag: () => console.log('Flag for review'),
    onShare: () => console.log('Share event')
  }}
>
  {/* ELITE: Source image */}
  <SourceImage
    url="https://example.com/receipt.jpg"
    thumbnail="https://example.com/receipt-thumb.jpg"
    alt="Fuel receipt from Shell"
  />
  
  {/* Hero metric */}
  <HeroMetric
    value="$42.50"
    context="13.2 gal × $3.22/gal"
  />
  
  {/* ELITE: Progressive disclosure */}
  <CollapsibleData
    summary={[
      { label: 'Odometer', value: '77,306 mi' },
      { label: 'Efficiency', value: '32.5 MPG', highlight: true }
    ]}
    details={[
      { label: 'Fuel type', value: 'Regular (87)' },
      { label: 'Payment', value: 'Credit Card' },
      { label: 'Receipt #', value: '4829-3847' }
    ]}
  />
  
  {/* ELITE: Extraction warning */}
  <ExtractionWarning
    type="estimated"
    message="Efficiency calculated from distance and volume"
  />
  
  {/* AI Summary */}
  <AISummary
    summary="Fuel efficiency is 8% above your 6-month average. This station typically has competitive pricing in your area."
    confidence="high"
  />
  
  {/* Status badge */}
  <StatusBadge variant="success" icon={<TrendingUp className="w-4 h-4" />}>
    Exceptional efficiency
  </StatusBadge>
</EventCard>
```

---

## **📊 EXAMPLE 2: Data-Sparse Event (Low Quality)**

```tsx
<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Location unknown"
  time="8:00 PM"
  
  // Low quality extraction
  quality={{
    level: 'low',
    details: {
      fieldsExtracted: 1,
      fieldsMissing: 4,
      imageQuality: 42
    }
  }}
  
  actions={{
    onEdit: () => correctData()
  }}
>
  {/* Blurry image */}
  <SourceImage
    url="https://example.com/blurry-receipt.jpg"
    alt="Fuel receipt (blurry)"
  />
  
  {/* Only cost extracted */}
  <HeroMetric value="$42.50" />
  
  {/* Warning about data quality */}
  <ExtractionWarning
    type="missing"
    message="Image too blurry to extract volume, location, or fuel type"
    action={{
      label: "Upload clearer photo",
      onClick: () => retakePhoto()
    }}
  />
  
  {/* AI explains situation */}
  <AISummary
    summary="Receipt partially visible. Consider uploading a clearer image for full data extraction."
    confidence="low"
  />
</EventCard>
```

---

## **⏳ EXAMPLE 3: Loading State**

```tsx
<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Processing..."
  time="Just now"
  loading={true}  // Shows skeleton
>
  {/* Content ignored during loading */}
</EventCard>
```

**Renders:**
```
┌────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓           ▓▓▓▓▓▓          │
│    ▓▓▓▓▓▓▓                            │
├────────────────────────────────────────┤
│          ▓▓▓▓▓▓▓▓▓▓▓▓▓                │
│        (Extracting data...)            │
└────────────────────────────────────────┘
```

---

## **❌ EXAMPLE 4: Error State**

```tsx
<EventCard
  icon={<Fuel className="w-5 h-5" />}
  iconBg="bg-blue-50"
  iconColor="text-blue-600"
  title="Fuel Fill-Up"
  subtitle="Failed to process"
  time="2 min ago"
  error="Couldn't read this image"
>
  {/* Content replaced with error message */}
</EventCard>
```

---

## **📊 EXAMPLE 5: Dashboard Snapshot (Many Fields)**

```tsx
<EventCard
  icon={<Gauge className="w-5 h-5" />}
  iconBg="bg-gray-50"
  iconColor="text-gray-600"
  title="Dashboard Snapshot"
  subtitle="All systems normal"
  time="6:31 PM"
  
  quality={{
    level: 'high',
    details: {
      fieldsExtracted: 7,
      fieldsMissing: 0,
      imageQuality: 95
    }
  }}
>
  <SourceImage
    url="https://example.com/dashboard.jpg"
    alt="Dashboard photo"
  />
  
  {/* Many fields with progressive disclosure */}
  <CollapsibleData
    summary={[
      { label: 'Mileage', value: '77,306 mi' },
      { label: 'Fuel level', value: '65%' },
      { label: 'Oil life', value: '42%', highlight: true }
    ]}
    details={[
      { label: 'Tire pressure', value: 'Normal' },
      { label: 'Engine temp', value: '195°F' },
      { label: 'Coolant temp', value: 'Normal' },
      { label: 'Battery voltage', value: '14.2V' }
    ]}
    compact={true}
  />
  
  <AISummary
    summary="All readings within normal range. Oil life at 42% - consider scheduling service within the next 1,000 miles."
    confidence="high"
  />
</EventCard>
```

---

## **🎨 QUALITY INDICATOR VARIANTS:**

### **Dots (Subtle - in header):**
```tsx
quality={{
  level: 'high',  // or 'medium' or 'low'
  details: {
    fieldsExtracted: 5,
    fieldsMissing: 1,
    imageQuality: 92
  }
}}
```

**Visual:**
```
Fuel Fill-Up  ●●●●● 
```

### **Badge (Prominent - below title):**
```tsx
<QualityIndicator
  level="medium"
  variant="badge"
/>
```

**Visual:**
```
[Medium Quality]
```

---

## **🔧 PROGRESSIVE DISCLOSURE PATTERNS:**

### **Pattern 1: Summary + Details**
```tsx
<CollapsibleData
  summary={[/* 2-4 key items */]}
  details={[/* Additional items */]}
/>
```

### **Pattern 2: All Visible (No Collapse)**
```tsx
<DataDisplay items={allItems} />
```

### **Pattern 3: Start Expanded**
```tsx
<CollapsibleData
  summary={summaryItems}
  details={detailItems}
  defaultExpanded={true}
/>
```

---

## **⚡ QUICK ACTIONS PATTERNS:**

### **All Actions:**
```tsx
actions={{
  onEdit: () => handleEdit(),
  onFlag: () => handleFlag(),
  onShare: () => handleShare()
}}
```

### **Edit Only:**
```tsx
actions={{
  onEdit: () => handleEdit()
}}
```

### **Custom Action Handlers:**
```tsx
actions={{
  onEdit: () => {
    // Open edit modal
    setEditModalOpen(true)
    setSelectedEvent(event)
  },
  onFlag: () => {
    // Flag for manual review
    flagForReview(event.id, 'incorrect_extraction')
  },
  onShare: () => {
    // Copy to clipboard
    navigator.clipboard.writeText(generateShareText(event))
    toast.success('Copied to clipboard!')
  }
}}
```

---

## **⚠️ EXTRACTION WARNING PATTERNS:**

### **Missing Data:**
```tsx
<ExtractionWarning
  type="missing"
  message="Could not extract fuel type from receipt"
  action={{
    label: "Add manually",
    onClick: () => openEditModal('fuel_type')
  }}
/>
```

### **Estimated Value:**
```tsx
<ExtractionWarning
  type="estimated"
  message="Efficiency calculated from distance and volume"
/>
```

### **Low Confidence:**
```tsx
<ExtractionWarning
  type="low-confidence"
  message="Image quality was poor. Please verify extracted data."
  action={{
    label: "Upload clearer photo",
    onClick: () => retakePhoto()
  }}
/>
```

### **Inline Warning (Subtle):**
```tsx
<DataDisplay items={[
  { label: 'Efficiency', value: '32.5 MPG' }
]} />
<InlineWarning message="Calculated from trip data" />
```

---

## **📸 SOURCE IMAGE PATTERNS:**

### **With Thumbnail:**
```tsx
<SourceImage
  url="https://cdn.example.com/receipt-full.jpg"
  thumbnail="https://cdn.example.com/receipt-thumb.jpg"
  alt="Fuel receipt from Shell"
/>
```

### **Without Thumbnail (uses main image):**
```tsx
<SourceImage
  url="https://example.com/receipt.jpg"
  alt="Fuel receipt"
/>
```

### **Custom Click Handler:**
```tsx
<SourceImage
  url={imageUrl}
  alt="Receipt"
  onView={() => {
    // Custom lightbox or modal
    openCustomLightbox(imageUrl)
  }}
/>
```

---

## **🎯 BEST PRACTICES:**

### **1. Always Show Quality When Available**
```tsx
// ✅ Good
quality={{
  level: extractionQuality,
  details: extractionMetadata
}}

// ❌ Don't hide quality info
quality={undefined}
```

### **2. Use Progressive Disclosure for 5+ Fields**
```tsx
// ✅ Good - cleaner timeline
<CollapsibleData
  summary={keyFields.slice(0, 4)}
  details={keyFields.slice(4)}
/>

// ❌ Shows everything - too long
<DataDisplay items={allFields} />
```

### **3. Be Transparent with Warnings**
```tsx
// ✅ Good - builds trust
<ExtractionWarning
  type="estimated"
  message="This value was calculated, not directly extracted"
/>

// ❌ Don't hide uncertainty
// (no warning shown)
```

### **4. Provide Clear Actions**
```tsx
// ✅ Good - actionable
<ExtractionWarning
  type="missing"
  message="Could not extract fuel type"
  action={{
    label: "Add manually",
    onClick: openEditModal
  }}
/>

// ❌ No way to fix
<ExtractionWarning
  type="missing"
  message="Could not extract fuel type"
  // No action provided
/>
```

### **5. Show Source Images**
```tsx
// ✅ Good - transparency
<SourceImage
  url={item.image_url}
  alt={`${item.type} image`}
/>

// ❌ User can't verify
// (no image shown)
```

---

## **✅ MIGRATION CHECKLIST:**

### **From Basic to Elite:**

1. **Add Quality Indicators:**
   ```tsx
   // Add to extracted_data
   {
     ...existingData,
     extraction_quality: {
       level: 'high',
       fields_extracted: 5,
       fields_missing: 1,
       image_quality: 92
     }
   }
   ```

2. **Store Source Images:**
   ```tsx
   {
     ...timelineItem,
     image_url: uploadedImageUrl,
     thumbnail_url: thumbnailUrl
   }
   ```

3. **Update Renderers:**
   ```tsx
   getCardData: (item): EventCardData => {
     return {
       data: [...],
       quality: item.extracted_data.extraction_quality,
       sourceImage: {
         url: item.image_url,
         thumbnail: item.thumbnail_url,
         alt: `${item.type} image`
       }
     }
   }
   ```

4. **Add Actions:**
   ```tsx
   <EventCard
     ...
     actions={{
       onEdit: () => handleEdit(item),
       onFlag: () => handleFlag(item)
     }}
   />
   ```

---

## **🚀 READY FOR PRODUCTION!**

All elite-tier features are now implemented and ready to use! 

**Next Steps:**
1. Update OpenAI Vision extraction to populate `extraction_quality`
2. Store source images with timeline items
3. Test with real user photos
4. Monitor quality metrics

**Your timeline cards are now production-grade!** 🎉✨
