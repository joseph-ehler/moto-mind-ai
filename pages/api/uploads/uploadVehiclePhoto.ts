import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/clients/supabase'
import { withApiError, apiErrors, apiSuccess } from '@/lib/utils/api-error'
import formidable from 'formidable'
import { promises as fs } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadResponse {
  success: boolean
  url?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      multiples: false
    })

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const vehicleId = Array.isArray(fields.vehicleId) ? fields.vehicleId[0] : fields.vehicleId

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    // Validate file type
    if (!file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'File must be an image' })
    }

    // Read file data
    const fileBuffer = await fs.readFile(file.filepath)
    
    // Generate unique filename
    const fileExt = file.originalFilename?.split('.').pop() || 'jpg'
    const fileName = `${vehicleId || 'temp'}-${Date.now()}.${fileExt}`
    const filePath = `vehicle-photos/${fileName}`

    // Upload to Supabase Storage using service role
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('vehicle-images')
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return res.status(500).json({ 
        success: false, 
        error: `Upload failed: ${uploadError.message}` 
      })
    }

    // Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('vehicle-images')
      .getPublicUrl(filePath)

    // If vehicleId is provided, create a record in vehicle_images table
    if (vehicleId && vehicleId !== 'temp') {
      try {
        // Mock auth for development
        const tenantId = '550e8400-e29b-41d4-a716-446655440000'
        
        await supabaseAdmin
          .from('vehicle_images')
          .insert({
            tenant_id: tenantId,
            vehicle_id: vehicleId,
            storage_path: filePath,
            public_url: publicUrl,
            filename: file.originalFilename || fileName,
            image_type: 'general', // Default type for uploaded images
            is_primary: false
          })
      } catch (dbError) {
        console.warn('Failed to create vehicle_images record:', dbError)
        // Don't fail the upload if DB record creation fails
      }
    }

    // Clean up temporary file
    try {
      await fs.unlink(file.filepath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError)
    }

    return res.status(200).json({
      success: true,
      url: publicUrl
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    })
  }
}
