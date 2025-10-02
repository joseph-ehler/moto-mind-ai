# Supabase Storage Setup for Canonical Vehicle Images
## Complete Integration Guide

*Updated: 2024-09-24*

---

## 🎯 Overview

This guide walks through setting up Supabase Storage for the canonical vehicle image system. Supabase Storage provides reliable, scalable image storage with excellent performance and built-in CDN capabilities.

## 📋 Prerequisites

1. **Supabase Project**: Active Supabase project with database access
2. **Environment Variables**: Supabase URL and service role key configured
3. **Dependencies**: `@supabase/supabase-js` package installed

## 🔧 Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 🗄️ Step 2: Create Storage Bucket

### Option A: Via Supabase Dashboard

1. **Navigate to Storage** in your Supabase dashboard
2. **Create New Bucket**:
   - **Name**: `vehicle-images`
   - **Bucket Type**: Standard bucket (S3 compatible)
   - **Public Bucket**: ✅ Allow anyone to read objects without authorization
   - **File Size Limit**: 5MB (prevents oversized uploads)
   - **MIME Types**: Restrict to `image/jpeg`, `image/png`, `image/webp`

### Option B: Via SQL (Automated)

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images', 
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Set up RLS policies for the bucket
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

CREATE POLICY "Service role can manage all files" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
```

## 🔐 Step 3: Environment Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (for image generation)
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## 🗃️ Step 4: Run Database Migrations

Execute the canonical images migration:

```bash
# Run the migration to create vehicle image tables
psql $DATABASE_URL -f migrations/005_canonical_vehicle_images.sql
```

This creates:
- `vehicle_images` table for storing image metadata
- `vehicle_generations` table for year-range mapping
- `image_generation_queue` table for async processing

## 📁 Step 5: Storage Organization

The system organizes images with this folder structure:

```
vehicle-images/
├── honda/
│   └── civic/
│       └── 2012-2015/
│           └── sedan/
│               ├── front_3q_neutral_silver.jpg
│               ├── side_neutral_silver.jpg
│               └── rear_3q_neutral_silver.jpg
├── ford/
│   └── f-150/
│       └── 2015-2020/
│           └── truck/
│               └── front_3q_oxford_white.jpg
└── toyota/
    └── camry/
        └── 2018-2024/
            └── sedan/
                └── front_3q_pearl_white.jpg
```

**Benefits:**
- **Organized**: Easy to browse and manage
- **Predictable**: Consistent naming convention
- **Scalable**: Handles millions of images efficiently
- **CDN-Friendly**: Optimal for caching and delivery

## 🚀 Step 6: Test the Integration

### Test Image Upload

```bash
# Test canonical image generation
curl -X POST "http://localhost:3000/api/canonical-image" \
  -H "Content-Type: application/json" \
  -d '{
    "specs": {
      "year": 2020,
      "make": "Honda",
      "model": "Civic",
      "bodyStyle": "sedan",
      "color": "Pearl White"
    },
    "angles": ["front_3q"],
    "async": false
  }'
```

### Test Image Retrieval

```bash
# Get canonical image
curl "http://localhost:3000/api/canonical-image?year=2020&make=honda&model=civic&bodyStyle=sedan&angle=front_3q"
```

### Expected Response

```json
{
  "success": true,
  "image": {
    "id": "uuid-here",
    "canonicalKey": "2018-2024|honda|civic|sedan|pearl_white|usdm",
    "url": "https://your-project.supabase.co/storage/v1/object/public/vehicle-images/honda/civic/2018-2024/sedan/front_3q_pearl_white.jpg",
    "angle": "front_3q",
    "verified": true,
    "createdAt": "2024-09-24T18:00:00.000Z"
  },
  "specs": {
    "year": 2020,
    "make": "Honda",
    "model": "Civic",
    "bodyStyle": "sedan",
    "color": "Pearl White"
  },
  "cached": false
}
```

## 📊 Step 7: Monitor Storage Usage

### Via Supabase Dashboard

1. **Navigate to Storage** → **vehicle-images** bucket
2. **View Usage Statistics**:
   - Total files stored
   - Storage size used
   - Bandwidth consumption
   - Request metrics

### Via API

```typescript
import { supabaseStorage } from '@/lib/supabase-storage'

// Get storage statistics
const stats = await supabaseStorage.getStorageStats()
console.log('Storage Stats:', stats)
```

## 🔧 Step 8: Performance Optimization

### CDN Configuration

Supabase Storage includes built-in CDN, but you can optimize further:

```typescript
// Enable aggressive caching for canonical images
const imageUrl = supabase.storage
  .from('vehicle-images')
  .getPublicUrl('honda/civic/2018-2024/sedan/front_3q_pearl_white.jpg', {
    transform: {
      width: 800,
      height: 450,
      resize: 'cover'
    }
  })
```

### Image Transformations

Supabase supports on-the-fly image transformations:

```typescript
// Generate different sizes for responsive design
const thumbnailUrl = supabase.storage
  .from('vehicle-images')
  .getPublicUrl(imagePath, {
    transform: {
      width: 400,
      height: 225,
      resize: 'cover',
      quality: 80
    }
  })
```

## 🛡️ Step 9: Security & Access Control

### Row Level Security (RLS)

The migration automatically sets up RLS policies:

```sql
-- Public read access for all vehicle images
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'vehicle-images');

-- Service role can manage all files
CREATE POLICY "Service role can manage all files" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
```

### API Key Security

- ✅ **Service Role Key**: Only used server-side for uploads
- ✅ **Public URLs**: Images are publicly readable (no auth required)
- ✅ **CORS**: Properly configured for web access

## 🧹 Step 10: Maintenance & Cleanup

### Automated Cleanup

```typescript
// Clean up old or unused images (optional)
const cleanupCount = await supabaseStorage.cleanupOldImages(30) // 30 days
console.log(`Cleaned up ${cleanupCount} old images`)
```

### Manual Cleanup

```sql
-- Find images older than 90 days with no recent access
SELECT storage_path, created_at 
FROM vehicle_images 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 📈 Step 11: Scaling Considerations

### Cost Optimization

- **Storage**: $0.021/GB/month (very affordable)
- **Bandwidth**: $0.09/GB (first 2GB free monthly)
- **Requests**: Generous free tier, then $0.40/million requests

### Performance Scaling

- **Global CDN**: Automatic worldwide distribution
- **Edge Caching**: Images cached at edge locations
- **Concurrent Uploads**: Handle multiple generations simultaneously

### Capacity Planning

```typescript
// Estimate storage needs
const estimatedImages = 24000 // Total canonical images needed
const avgImageSize = 150 * 1024 // 150KB per image
const totalStorage = estimatedImages * avgImageSize / (1024 * 1024 * 1024) // GB

console.log(`Estimated storage needed: ${totalStorage.toFixed(2)} GB`)
console.log(`Monthly cost: $${(totalStorage * 0.021).toFixed(2)}`)
```

## ✅ Step 12: Verification Checklist

- [ ] **Supabase project** configured with Storage enabled
- [ ] **Dependencies** installed (`@supabase/supabase-js`)
- [ ] **Environment variables** set correctly
- [ ] **Storage bucket** created with proper settings
- [ ] **Database migrations** executed successfully
- [ ] **RLS policies** configured for security
- [ ] **Test uploads** working correctly
- [ ] **Public URLs** accessible
- [ ] **Image transformations** functioning (optional)
- [ ] **Monitoring** dashboard accessible

## 🎉 Success!

Your Supabase Storage integration is now complete! The canonical vehicle image system will:

1. **Generate** studio-quality vehicle images using AI
2. **Upload** to organized Supabase Storage buckets
3. **Serve** via global CDN for fast delivery
4. **Scale** automatically as your fleet grows
5. **Cost-optimize** through intelligent caching

**Next Steps:**
- Integrate canonical images into vehicle onboarding UI
- Set up async queue processing for bulk generation
- Monitor usage and optimize based on real-world patterns

The system is now production-ready with enterprise-grade storage! 🚗✨
