/**
 * Temporary Photo Upload for Chat
 * 
 * Uploads photos to Supabase storage temporarily
 * Returns URLs that can be attached to events
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Disable body parser for file upload
export const config = {
  api: {
    bodyParser: false
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFiles: 3,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: function ({ mimetype }) {
        // Only accept images
        return mimetype?.startsWith('image/') ?? false
      }
    })

    const [fields, files] = await form.parse(req)

    const uploadedFiles = files.photos || []
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No photos provided' })
    }

    const uploadedUrls: string[] = []

    // Upload each file to Supabase storage
    for (const file of uploadedFiles) {
      if (!file.filepath) continue

      // Read the file
      const fileBuffer = await fs.readFile(file.filepath)
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const extension = file.originalFilename?.split('.').pop() || 'jpg'
      const fileName = `chat_${timestamp}_${randomId}.${extension}`
      const filePath = `vehicles/${vehicleId}/${fileName}`

      // Upload to Supabase storage (using existing vehicle-events bucket)
      const { data, error } = await supabase.storage
        .from('vehicle-events')
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype || 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw error
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vehicle-events')
        .getPublicUrl(filePath)

      uploadedUrls.push(urlData.publicUrl)

      // Clean up temp file
      await fs.unlink(file.filepath)
    }

    console.log(`✅ Uploaded ${uploadedUrls.length} photos for vehicle ${vehicleId}`)

    return res.status(200).json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length
    })
  } catch (error: any) {
    console.error('Photo upload error:', error)
    return res.status(500).json({ 
      error: 'Failed to upload photos',
      details: error.message 
    })
  }
}


export default withTenantIsolation(handler)
