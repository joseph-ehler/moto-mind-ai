# Capture System Integration - Quick Start Guide

**Time:** 1 hour  
**File to update:** `components/capture/GuidedCaptureFlow.tsx`  
**Goal:** Wire up backend to capture system

---

## 🎯 The 5 Critical API Calls

### **1. Create Session on Flow Open** (5 min)

```tsx
import { supabase } from '@/lib/supabase'
import { getEventPhotoPath } from '@/lib/storage-paths'

// Add state for session ID
const [sessionId, setSessionId] = useState<string | null>(null)

// Create session when component mounts
useEffect(() => {
  const createSession = async () => {
    const { data: session, error } = await supabase
      .from('capture_sessions')
      .insert({
        vehicle_id: vehicleId,
        tenant_id: currentUser.tenant_id, // Get from auth
        event_type: eventType,
        capture_path: 'guided',
        total_steps: flowConfig.steps.length,
        status: 'active'
      })
      .select()
      .single()
    
    if (!error && session) {
      setSessionId(session.id)
      console.log('✅ Session created:', session.id)
    } else {
      console.error('❌ Session creation failed:', error)
    }
  }
  
  createSession()
}, [vehicleId, eventType, currentUser])
```

---

### **2. Update Session on Each Photo** (5 min)

```tsx
// In handlePhotoCapture function, after adding photo to state:
const handlePhotoCapture = async (file: File, preview: string, metadata: CaptureMetadata) => {
  // ... existing photo capture logic ...
  
  // Update session progress
  if (sessionId) {
    const newCount = capturedPhotos.length + 1
    await supabase
      .from('capture_sessions')
      .update({
        completed_steps: newCount,
        photos_captured: newCount,
        completed_step_ids: [...capturedPhotos.map(p => p.stepId), currentStep.id]
      })
      .eq('id', sessionId)
    
    console.log(`✅ Session updated: ${newCount}/${flowConfig.steps.length} photos`)
  }
}
```

---

### **3. Upload Photos with Organized Paths** (20 min)

```tsx
// In handleSave function:
const handleSave = async () => {
  try {
    setIsSaving(true)
    
    // 1. Create vehicle event
    const { data: event, error: eventError } = await supabase
      .from('vehicle_events')
      .insert({
        vehicle_id: vehicleId,
        tenant_id: currentUser.tenant_id,
        type: eventType,
        date: new Date().toISOString(),
        miles: odometerReading, // If you captured it
      })
      .select()
      .single()
    
    if (eventError) throw eventError
    console.log('✅ Event created:', event.id)
    
    // 2. Process and upload all photos
    const uploadedPhotos = []
    
    for (let i = 0; i < capturedPhotos.length; i++) {
      const capturedPhoto = capturedPhotos[i]
      const timestamp = Date.now() + i // Ensure unique names
      
      // Generate storage path
      const compressedPath = getEventPhotoPath({
        vehicleId,
        eventId: event.id,
        stepId: capturedPhoto.stepId,
        version: 'compressed',
        timestamp,
        format: 'webp' // or 'jpg' based on your compression
      })
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('vehicle-events')
        .upload(compressedPath, capturedPhoto.file)
      
      if (uploadError) {
        console.error('❌ Upload failed:', uploadError)
        continue
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicle-events')
        .getPublicUrl(compressedPath)
      
      uploadedPhotos.push({
        capturedPhoto,
        storagePath: compressedPath,
        publicUrl: urlData.publicUrl,
        sequence: i + 1
      })
      
      console.log(`✅ Uploaded ${i + 1}/${capturedPhotos.length}: ${capturedPhoto.stepId}`)
    }
    
    console.log('✅ All photos uploaded')
    
    // Continue to step 4...
  } catch (error) {
    console.error('❌ Save failed:', error)
    alert('Failed to save. Please try again.')
  } finally {
    setIsSaving(false)
  }
}
```

---

### **4. Save Photo Metadata** (15 min)

```tsx
// After uploading photos, save metadata for each:
for (const uploaded of uploadedPhotos) {
  const { capturedPhoto, storagePath, publicUrl } = uploaded
  
  // 4a. Save to vehicle_images
  const { data: imageRecord, error: imageError } = await supabase
    .from('vehicle_images')
    .insert({
      vehicle_id: vehicleId,
      tenant_id: currentUser.tenant_id,
      storage_path: storagePath,
      public_url: publicUrl,
      filename: capturedPhoto.file.name,
      image_type: eventType,
      is_primary: uploaded.sequence === 1
    })
    .select()
    .single()
  
  if (imageError) {
    console.error('❌ Image record failed:', imageError)
    continue
  }
  
  // 4b. Save photo_metadata
  await supabase.from('photo_metadata').insert({
    image_id: imageRecord.id,
    tenant_id: currentUser.tenant_id,
    captured_at: capturedPhoto.metadata.timestamp,
    capture_method: 'camera',
    event_type: eventType,
    step_id: capturedPhoto.stepId,
    
    // GPS
    gps_latitude: capturedPhoto.metadata.location?.latitude,
    gps_longitude: capturedPhoto.metadata.location?.longitude,
    gps_accuracy: capturedPhoto.metadata.location?.accuracy,
    
    // Quality
    quality_score: capturedPhoto.metadata.qualityScore,
    quality_issues: capturedPhoto.metadata.qualityIssues,
    
    // Compression
    original_size_bytes: capturedPhoto.metadata.originalSize,
    compressed_size_bytes: capturedPhoto.metadata.compressedSize,
    compression_ratio: capturedPhoto.metadata.compressionRatio,
    output_format: 'image/webp', // or based on your compression
    
    // Resolution
    width: capturedPhoto.metadata.resolution.width,
    height: capturedPhoto.metadata.resolution.height,
    
    // Camera
    flash_mode: capturedPhoto.metadata.cameraSettings?.flashMode,
    facing_mode: capturedPhoto.metadata.cameraSettings?.facingMode,
    
    // Behavior
    retake_count: capturedPhoto.metadata.retakeCount || 0,
    capture_duration_ms: capturedPhoto.metadata.captureDuration,
    
    // Device
    platform: capturedPhoto.metadata.deviceInfo.platform,
    user_agent: capturedPhoto.metadata.deviceInfo.userAgent
  })
  
  console.log(`✅ Metadata saved for ${capturedPhoto.stepId}`)
}
```

---

### **5. Link Photos to Event** (10 min)

```tsx
// After saving metadata, link photos to event:
for (const uploaded of uploadedPhotos) {
  await supabase.from('event_photos').insert({
    event_id: event.id,
    image_id: uploaded.imageRecord.id, // Save this from step 4a
    tenant_id: currentUser.tenant_id,
    sequence: uploaded.sequence,
    step_id: uploaded.capturedPhoto.stepId,
    is_primary: uploaded.sequence === 1
  })
  
  console.log(`✅ Linked photo ${uploaded.sequence}/${uploadedPhotos.length}`)
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
  
  console.log('✅ Session completed')
}

// Navigate to event page
router.push(`/vehicles/${vehicleId}/events/${event.id}`)
```

---

## ⚠️ Bonus: Handle Abandonment (5 min)

```tsx
// Add cleanup on unmount:
useEffect(() => {
  return () => {
    // Mark session as abandoned if user leaves without saving
    if (sessionId && capturedPhotos.length > 0) {
      const requiredPhotos = flowConfig.steps.filter(s => s.required).length
      
      if (capturedPhotos.length < requiredPhotos) {
        supabase
          .from('capture_sessions')
          .update({
            status: 'abandoned',
            abandoned_at: new Date().toISOString(),
            abandoned_at_step: currentStep?.id,
            abandonment_reason: 'navigation'
          })
          .eq('id', sessionId)
          .then(() => console.log('⚠️ Session marked as abandoned'))
      }
    }
  }
}, [sessionId, capturedPhotos.length, currentStep])
```

---

## 🧪 Testing Checklist

After integration, test this flow:

- [ ] Open guided capture
- [ ] Check browser console: "✅ Session created: [id]"
- [ ] Capture 1st photo
- [ ] Check console: "✅ Session updated: 1/4 photos"
- [ ] Capture 2nd, 3rd, 4th photos
- [ ] Click "Save All"
- [ ] Check console logs:
  - "✅ Event created: [id]"
  - "✅ Uploaded 1/4: receipt"
  - "✅ Uploaded 2/4: odometer"
  - "✅ Uploaded 3/4: gauge"
  - "✅ Uploaded 4/4: additives"
  - "✅ Metadata saved for receipt"
  - (repeat for all photos)
  - "✅ Linked photo 1/4"
  - (repeat for all photos)
  - "✅ Session completed"
- [ ] Verify redirect to event page
- [ ] Check database:
  - `capture_sessions` has 1 completed session
  - `vehicle_events` has 1 new event
  - `vehicle_images` has 4 new images
  - `photo_metadata` has 4 new records
  - `event_photos` has 4 new links
- [ ] Check storage bucket:
  - `vehicles/[id]/events/[id]/` has 4 photos

---

## 🔧 Common Issues

### Issue 1: "tenant_id is missing"
```tsx
// Get tenant_id from Supabase auth
const { data: { user } } = await supabase.auth.getUser()
const tenantId = user?.user_metadata?.tenant_id
```

### Issue 2: "photos not showing in timeline"
```tsx
// Query event with photos:
const { data: event } = await supabase
  .from('vehicle_events')
  .select(`
    *,
    event_photos (
      sequence,
      vehicle_images (
        public_url
      )
    )
  `)
  .eq('id', eventId)
  .single()
```

### Issue 3: "GPS coordinates not saving"
```tsx
// Make sure location is captured:
if (capturedPhoto.metadata.location) {
  // Has lat, lng, accuracy
} else {
  // Location not captured - check permissions
}
```

---

## 🎯 Next Steps

After integration works:

1. **Test abandonment:** Quit halfway through capture
2. **Check analytics:** Query `capture_session_analytics` view
3. **Verify storage:** Check Supabase storage bucket
4. **Test timeline:** View event with 4 photos

---

## 📊 Expected Results

**Database after 1 complete capture:**
- `capture_sessions`: 1 row (status: 'completed')
- `vehicle_events`: 1 row
- `vehicle_images`: 4 rows
- `photo_metadata`: 4 rows
- `event_photos`: 4 rows

**Storage after 1 complete capture:**
```
vehicle-events/
  vehicles/
    [vehicle-id]/
      events/
        [event-id]/
          receipt_compressed_[timestamp].webp
          odometer_compressed_[timestamp].webp
          gauge_compressed_[timestamp].webp
          additives_compressed_[timestamp].webp
```

---

**You're 1 hour away from production!** 🚀
