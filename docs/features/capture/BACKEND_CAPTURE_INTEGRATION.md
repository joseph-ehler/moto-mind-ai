# Backend Integration for Capture System

**Status:** Ready to implement  
**Priority:** P0 - Required before capture system launch  
**Estimated Time:** 2-3 hours total

---

## 🎯 Executive Summary

Your **99/100 capture system** is feature-complete, but your backend has critical gaps:

- ❌ No capture metadata storage (GPS, quality, compression stats)
- ❌ No multi-photo event support (guided flows need 4+ photos per event)
- ❌ Disorganized storage structure (mixed purposes, no context)
- ❌ No session tracking (can't detect abandonment or measure UX)

**We've created migrations to fix all of these.** Just run them and update your upload logic.

---

## ✅ What We Built (3 Migrations + 1 Utility)

### **1. Photo Metadata Table** (`photo_metadata`)
**File:** `supabase/migrations/20250113_add_capture_metadata.sql`  
**Time to run:** < 1 second  
**Purpose:** Store all capture metadata (GPS, quality, compression, behavior)

**Fields Added:**
```sql
- GPS: latitude, longitude, accuracy, timestamp
- Quality: score (0-100), issues array
- Compression: original size, compressed size, ratio, format
- Resolution: width, height, aspect_ratio
- Camera: flash_mode, facing_mode
- Behavior: retake_count, capture_duration_ms, warnings_shown
- Device: platform, user_agent
- HEIC: was_heic_converted, heic_original_size
- Editing: was_edited, edit_operations
```

**Usage:**
```typescript
// After uploading photo
await supabase.from('photo_metadata').insert({
  image_id: uploadedImage.id,
  tenant_id: currentTenant.id,
  captured_at: metadata.timestamp,
  capture_method: 'camera',
  event_type: 'fuel',
  step_id: 'receipt',
  gps_latitude: metadata.location.latitude,
  gps_longitude: metadata.location.longitude,
  quality_score: metadata.qualityScore,
  quality_issues: metadata.qualityIssues,
  compression_ratio: metadata.compressionRatio,
  retake_count: metadata.retakeCount,
  // ... etc
})
```

---

### **2. Multi-Photo Events Table** (`event_photos`)
**File:** `supabase/migrations/20250113_add_multi_photo_events.sql`  
**Time to run:** < 1 second  
**Purpose:** Link multiple photos to a single event (fuel = 4 photos)

**Fields Added:**
```sql
- event_id: Which event this photo belongs to
- image_id: The photo being linked
- sequence: Display order (1, 2, 3, 4)
- step_id: 'receipt', 'odometer', 'gauge', 'additives'
- is_primary: Hero photo for event
```

**Usage:**
```typescript
// After creating event
const event = await supabase.from('vehicle_events').insert({ ... }).single()

// Link all 4 photos to event
for (let i = 0; i < capturedPhotos.length; i++) {
  await supabase.from('event_photos').insert({
    event_id: event.id,
    image_id: capturedPhotos[i].imageId,
    tenant_id: currentTenant.id,
    sequence: i + 1,
    step_id: capturedPhotos[i].stepId,
    is_primary: i === 0  // First photo is primary
  })
}

// Query all photos for event (using helper function)
const photos = await supabase.rpc('get_event_photos', {
  p_event_id: event.id
})
// Returns: [{ photo_id, sequence, step_id, public_url, quality_score, ... }]
```

---

### **3. Capture Sessions Table** (`capture_sessions`)
**File:** `supabase/migrations/20250113_add_capture_sessions.sql`  
**Time to run:** < 1 second  
**Purpose:** Track capture sessions for abandonment detection and UX analytics

**Fields Added:**
```sql
- vehicle_id, tenant_id, event_type, capture_path ('quick' | 'guided')
- status: 'active' | 'completed' | 'abandoned'
- total_steps, completed_steps, photos_captured
- started_at, completed_at, abandoned_at, total_duration_ms
- event_id (if completed)
- abandoned_at_step, abandonment_reason
```

**Usage:**
```typescript
// When user opens capture flow
const session = await supabase.from('capture_sessions').insert({
  vehicle_id: currentVehicle.id,
  tenant_id: currentTenant.id,
  event_type: 'fuel',
  capture_path: 'guided',
  total_steps: 4,
  status: 'active'
}).single()

// Store session ID in component state
const [sessionId, setSessionId] = useState(session.id)

// Update on each photo capture
await supabase.from('capture_sessions').update({
  completed_steps: 2,
  photos_captured: 2,
  completed_step_ids: ['receipt', 'odometer']
}).eq('id', sessionId)

// Mark complete on save
await supabase.from('capture_sessions').update({
  status: 'completed',
  completed_at: new Date().toISOString(),
  event_id: savedEvent.id
}).eq('id', sessionId)

// Or mark abandoned if user quits
await supabase.from('capture_sessions').update({
  status: 'abandoned',
  abandoned_at: new Date().toISOString(),
  abandoned_at_step: 'gauge',
  abandonment_reason: 'back_button'
}).eq('id', sessionId)
```

**Analytics Queries:**
```sql
-- Completion rate by event type
SELECT * FROM capture_session_analytics;

-- Where do users abandon?
SELECT * FROM capture_abandonment_analysis;
```

---

### **4. Storage Path Utilities** (`lib/storage-paths.ts`)
**File:** `lib/storage-paths.ts`  
**Purpose:** Centralized storage path generation (organized, consistent)

**Usage:**
```typescript
import { getEventPhotoPath, getCompressedPath } from '@/lib/storage-paths'

// Generate path for event photo
const originalPath = getEventPhotoPath({
  vehicleId: '75bf28ae-b576-4628-abb0-9728dfc01ec0',
  eventId: 'abc-123',
  stepId: 'receipt',
  version: 'original',
  timestamp: Date.now(),
  format: 'jpg'
})
// Result: vehicles/75bf28ae.../events/abc-123/receipt_original_1760047360956.jpg

// Upload original
await supabase.storage
  .from('vehicle-events')
  .upload(originalPath, originalBlob)

// Get compressed path
const compressedPath = getCompressedPath(originalPath)
// Result: vehicles/75bf28ae.../events/abc-123/receipt_compressed_1760047360956.jpg

// Upload compressed
await supabase.storage
  .from('vehicle-events')
  .upload(compressedPath, compressedBlob)
```

**New Storage Structure:**
```
vehicle-events/
  vehicles/
    {vehicle_id}/
      events/
        {event_id}/
          receipt_original_1760047360956.jpg      (2.5 MB)
          receipt_compressed_1760047360956.jpg    (450 KB) ← Save this URL to DB
          odometer_original_1760048321091.jpg
          odometer_compressed_1760048321091.jpg
          gauge_original_1760048493043.jpg
          gauge_compressed_1760048493043.jpg
          metadata.json
      
      chat/
        {thread_id}/
          {message_id}_{timestamp}.jpg
      
      general/
        dashboards/
          {timestamp}.jpg
```

---

## 🚀 Implementation Plan

### **Phase 1: Run Migrations** (5 minutes)

```bash
# Navigate to project
cd /Users/josephehler/Desktop/Desktop/apps/motomind-ai

# Run migrations in order
supabase db push supabase/migrations/20250113_add_capture_metadata.sql
supabase db push supabase/migrations/20250113_add_multi_photo_events.sql
supabase db push supabase/migrations/20250113_add_capture_sessions.sql

# Or apply all at once
supabase db reset  # Resets and applies all migrations
```

**Verify migrations:**
```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photo_metadata', 'event_photos', 'capture_sessions');

-- Should return 3 rows
```

---

### **Phase 2: Update GuidedCaptureFlow** (1 hour)

**File:** `components/capture/GuidedCaptureFlow.tsx`

**Changes needed:**

1. **Create session on flow open:**
```typescript
const [sessionId, setSessionId] = useState<string | null>(null)

useEffect(() => {
  // Create capture session
  const createSession = async () => {
    const { data: session } = await supabase
      .from('capture_sessions')
      .insert({
        vehicle_id: vehicleId,
        tenant_id: currentTenant.id,
        event_type: eventType,
        capture_path: 'guided',
        total_steps: flowConfig.steps.length,
        status: 'active'
      })
      .select()
      .single()
    
    setSessionId(session.id)
  }
  
  createSession()
}, [])
```

2. **Update session on photo capture:**
```typescript
const handlePhotoCapture = async (file: File, preview: string, metadata: CaptureMetadata) => {
  // ... existing logic ...
  
  // Update session
  if (sessionId) {
    await supabase
      .from('capture_sessions')
      .update({
        completed_steps: capturedPhotos.length + 1,
        photos_captured: capturedPhotos.length + 1,
        completed_step_ids: [...capturedPhotos.map(p => p.stepId), currentStep.id]
      })
      .eq('id', sessionId)
  }
}
```

3. **Upload with new storage structure:**
```typescript
import { getEventPhotoPath } from '@/lib/storage-paths'

const handleSave = async () => {
  // Create event first
  const { data: event } = await supabase
    .from('vehicle_events')
    .insert({
      vehicle_id: vehicleId,
      tenant_id: currentTenant.id,
      type: eventType,
      date: new Date().toISOString(),
      // ... other fields
    })
    .select()
    .single()
  
  // Process and upload all photos
  const result = await bulkProcessPhotos(capturedPhotos.map(p => p.file), {
    targetSizeKB: 500,
    analyzeQuality: false
  })
  
  // Upload each photo
  for (let i = 0; i < result.photos.length; i++) {
    const photo = result.photos[i]
    if (!photo.success) continue
    
    const capturedPhoto = capturedPhotos[i]
    const timestamp = Date.now()
    
    // Generate storage paths
    const originalPath = getEventPhotoPath({
      vehicleId,
      eventId: event.id,
      stepId: capturedPhoto.stepId,
      version: 'original',
      timestamp,
      format: 'jpg'
    })
    
    const compressedPath = getEventPhotoPath({
      vehicleId,
      eventId: event.id,
      stepId: capturedPhoto.stepId,
      version: 'compressed',
      timestamp,
      format: photo.format === 'image/webp' ? 'webp' : 'jpg'
    })
    
    // Upload original (for 30-day retention)
    await supabase.storage
      .from('vehicle-events')
      .upload(originalPath, capturedPhoto.file)
    
    // Upload compressed (this is what we use)
    const { data: uploadData } = await supabase.storage
      .from('vehicle-events')
      .upload(compressedPath, photo.compressedBlob)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vehicle-events')
      .getPublicUrl(compressedPath)
    
    // Save to vehicle_images
    const { data: imageRecord } = await supabase
      .from('vehicle_images')
      .insert({
        vehicle_id: vehicleId,
        tenant_id: currentTenant.id,
        storage_path: compressedPath,
        public_url: urlData.publicUrl,
        filename: capturedPhoto.file.name,
        image_type: eventType,
        is_primary: i === 0
      })
      .select()
      .single()
    
    // Save photo_metadata
    await supabase.from('photo_metadata').insert({
      image_id: imageRecord.id,
      tenant_id: currentTenant.id,
      captured_at: capturedPhoto.metadata.timestamp,
      capture_method: 'camera',
      event_type: eventType,
      step_id: capturedPhoto.stepId,
      gps_latitude: capturedPhoto.metadata.location?.latitude,
      gps_longitude: capturedPhoto.metadata.location?.longitude,
      gps_accuracy: capturedPhoto.metadata.location?.accuracy,
      quality_score: capturedPhoto.metadata.qualityScore,
      quality_issues: capturedPhoto.metadata.qualityIssues,
      original_size_bytes: capturedPhoto.metadata.originalSize,
      compressed_size_bytes: capturedPhoto.metadata.compressedSize,
      compression_ratio: capturedPhoto.metadata.compressionRatio,
      output_format: photo.format,
      width: capturedPhoto.metadata.resolution.width,
      height: capturedPhoto.metadata.resolution.height,
      flash_mode: capturedPhoto.metadata.cameraSettings.flashMode,
      facing_mode: capturedPhoto.metadata.cameraSettings.facingMode,
      retake_count: capturedPhoto.metadata.retakeCount,
      capture_duration_ms: capturedPhoto.metadata.captureDuration,
      platform: capturedPhoto.metadata.deviceInfo.platform,
      user_agent: capturedPhoto.metadata.deviceInfo.userAgent
    })
    
    // Link to event via event_photos
    await supabase.from('event_photos').insert({
      event_id: event.id,
      image_id: imageRecord.id,
      tenant_id: currentTenant.id,
      sequence: i + 1,
      step_id: capturedPhoto.stepId,
      is_primary: i === 0
    })
  }
  
  // Mark session as completed
  if (sessionId) {
    await supabase
      .from('capture_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        event_id: event.id
      })
      .eq('id', sessionId)
  }
  
  // Navigate to event page
  router.push(`/vehicles/${vehicleId}/events/${event.id}`)
}
```

4. **Handle abandonment:**
```typescript
useEffect(() => {
  // Mark session as abandoned when user navigates away
  return () => {
    if (sessionId && capturedPhotos.length < flowConfig.steps.filter(s => s.required).length) {
      supabase
        .from('capture_sessions')
        .update({
          status: 'abandoned',
          abandoned_at: new Date().toISOString(),
          abandoned_at_step: currentStep.id,
          abandonment_reason: 'navigation'
        })
        .eq('id', sessionId)
        .then(() => {
          console.log('Session marked as abandoned')
        })
    }
  }
}, [sessionId, capturedPhotos.length])
```

---

### **Phase 3: Query Photos in Timeline** (30 minutes)

**File:** `app/(authenticated)/vehicles/[id]/page.tsx` or wherever you display events

**Update event query to include photos:**
```typescript
// Get events with photos
const { data: events } = await supabase
  .from('vehicle_events')
  .select(`
    *,
    event_photos (
      sequence,
      step_id,
      is_primary,
      vehicle_images (
        id,
        public_url,
        storage_path,
        photo_metadata (
          quality_score,
          captured_at,
          gps_latitude,
          gps_longitude
        )
      )
    )
  `)
  .eq('vehicle_id', vehicleId)
  .order('date', { ascending: false })

// Or use helper function
const { data: eventPhotos } = await supabase
  .rpc('get_event_photos', { p_event_id: event.id })
```

**Display in timeline card:**
```typescript
{event.event_photos.map(ep => (
  <img 
    key={ep.vehicle_images.id}
    src={ep.vehicle_images.public_url}
    alt={ep.step_id}
    className="w-20 h-20 object-cover rounded"
  />
))}
```

---

## 📊 Analytics & Monitoring

### **Session Analytics Dashboard**

Query completion rates:
```sql
SELECT * FROM capture_session_analytics
WHERE event_type = 'fuel';

-- Example output:
-- event_type | capture_path | total_sessions | completed | abandoned | completion_rate | avg_time_ms
-- fuel       | guided       | 150            | 120       | 30        | 80.00%          | 45000
```

Query abandonment patterns:
```sql
SELECT * FROM capture_abandonment_analysis
WHERE event_type = 'fuel';

-- Example output:
-- event_type | abandoned_at_step | abandonment_reason | count | avg_steps_before | avg_time_ms
-- fuel       | gauge             | back_button        | 12    | 2.5              | 30000
-- fuel       | additives         | timeout            | 8     | 3.0              | 120000
```

### **Photo Quality Metrics**

Average quality by step:
```sql
SELECT 
  pm.step_id,
  AVG(pm.quality_score) as avg_quality,
  COUNT(*) as photo_count,
  COUNT(*) FILTER (WHERE pm.quality_score < 50) as low_quality_count
FROM photo_metadata pm
WHERE pm.event_type = 'fuel'
  AND pm.captured_at > NOW() - INTERVAL '30 days'
GROUP BY pm.step_id
ORDER BY avg_quality DESC;
```

### **Compression Effectiveness**

Average compression by event type:
```sql
SELECT 
  pm.event_type,
  AVG(pm.compression_ratio) as avg_ratio,
  AVG(pm.original_size_bytes) / 1024 / 1024 as avg_original_mb,
  AVG(pm.compressed_size_bytes) / 1024 as avg_compressed_kb
FROM photo_metadata pm
WHERE pm.captured_at > NOW() - INTERVAL '30 days'
GROUP BY pm.event_type;
```

---

## 🧹 Cleanup & Maintenance

### **Auto-abandon Stale Sessions** (Cron Job)

Set up a cron job to run every hour:
```sql
SELECT auto_abandon_inactive_sessions();
```

Or in Next.js API route:
```typescript
// app/api/cron/abandon-sessions/route.ts
export async function GET(request: Request) {
  const { data, error } = await supabase.rpc('auto_abandon_inactive_sessions')
  return Response.json({ success: !error })
}
```

### **Delete Old Original Photos** (Cost Savings)

After 30 days, delete original photos (keep compressed):
```sql
-- Find old originals
SELECT storage_path
FROM vehicle_images vi
JOIN photo_metadata pm ON vi.id = pm.image_id
WHERE pm.captured_at < NOW() - INTERVAL '30 days'
  AND vi.storage_path LIKE '%_original_%';

-- Delete from storage (run this as a cron job)
```

---

## ✅ Testing Checklist

After implementing:

- [ ] Run migrations successfully
- [ ] Create capture session on flow open
- [ ] Update session on each photo capture
- [ ] Upload photos to new storage structure
- [ ] Save photo_metadata for each photo
- [ ] Link photos to event via event_photos
- [ ] Mark session as completed on save
- [ ] Mark session as abandoned on navigation away
- [ ] Query event photos in timeline
- [ ] Display photos in correct sequence
- [ ] View analytics dashboards
- [ ] Test abandonment detection (quit halfway through)
- [ ] Verify GPS coordinates saved
- [ ] Verify quality scores saved
- [ ] Verify compression ratios saved

---

## 🎯 Success Metrics

After launch, monitor:

1. **Completion Rate** → Target: >80% for guided flows
2. **Average Time** → Target: <60 seconds per flow
3. **Photo Quality** → Target: >75 avg quality score
4. **Compression Ratio** → Target: >5x compression
5. **Abandonment Points** → Identify friction in flows

---

## 🚀 Next Steps

1. **Now:** Run migrations (5 min)
2. **Next:** Update GuidedCaptureFlow upload logic (1 hour)
3. **Then:** Update timeline queries (30 min)
4. **Finally:** Set up analytics dashboard (30 min)

**Total time: 2-3 hours**

---

**Your capture system is 99/100. Your backend will be too after this.** 🏆
