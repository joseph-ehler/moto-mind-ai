import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10MB
    },
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get tenant context from middleware
  const tenantId = (req as any).tenantId
  const supabase = (req as any).supabase
  
  if (!tenantId || !supabase) {
    return res.status(401).json({ error: 'Unauthorized - no tenant context' })
  }

  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  try {
    const { photo, filename } = req.body

    if (!photo) {
      return res.status(400).json({ error: 'No photo provided' })
    }

    // Convert base64 to buffer
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const fileExt = filename?.split('.').pop() || 'jpg'
    const fileName = `${vehicleId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Map file extension to proper MIME type
    const mimeTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif'
    }
    const contentType = mimeTypeMap[fileExt.toLowerCase()] || 'image/jpeg'

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload photo' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(fileName)

    // Save to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('vehicle_images')
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        public_url: publicUrl,
        filename: filename || fileName,
        image_type: 'general',
        is_primary: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({ error: 'Failed to save photo record' })
    }

    // Trigger background processing
    // ELITE: Use environment-aware URL builder (rebrand-proof)
    const { absoluteApiUrl } = await import('@/lib/utils/api-url')
    const processUrl = absoluteApiUrl(`/api/vehicles/${vehicleId}/photos/process`)
    
    console.log(`🚀 Triggering AI processing for image ${photoRecord.id}`)
    
    fetch(processUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId: photoRecord.id,
        imageUrl: publicUrl
      })
    })
      .then(res => {
        if (!res.ok) {
          console.error(`❌ Processing endpoint returned ${res.status}`)
          return res.text().then(text => console.error('Response:', text))
        }
        return res.json().then(data => console.log('✅ Processing started:', data))
      })
      .catch(err => console.error('❌ Background processing request failed:', err.message))

    return res.status(200).json({
      success: true,
      photo: photoRecord,
      message: 'Photo uploaded successfully',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ error: 'Failed to upload photo' })
  }
}


export default withTenantIsolation(handler)
