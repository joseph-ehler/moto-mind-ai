// BULLETPROOF UPLOAD ENDPOINT - SIMPLE NAME TO AVOID FILE NUMBERING BUG
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { withApiError, apiErrors, apiSuccess } from '@/lib/utils/api-error'
import formidable from 'formidable'
import { promises as fs } from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    throw apiErrors.methodNotAllowed(req.method || 'UNKNOWN')
  }

  // Mock tenant ID for development
  const tenantId = '550e8400-e29b-41d4-a716-446655440000'

  try {
    // Parse the multipart form data
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    })

    const [fields, files] = await form.parse(req)
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    const vehicleId = Array.isArray(fields.vehicleId) ? fields.vehicleId[0] : fields.vehicleId

    if (!file) {
      throw apiErrors.badRequest('No file uploaded')
    }

    console.log('📁 BULLETPROOF UPLOAD - File received:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      vehicleId: vehicleId
    })

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.originalFilename || 'image'
    const extension = originalName.split('.').pop() || 'jpg'
    const fileName = `${vehicleId || 'temp'}-${timestamp}.${extension}`
    const filePath = `vehicle-photos/${fileName}`

    // Read file data
    const fileData = await fs.readFile(file.filepath)
    
    // REAL UPLOAD TO SUPABASE STORAGE
    console.log('📸 BULLETPROOF API - Uploading to Supabase storage:', filePath)
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('vehicle-images')
      .upload(filePath, fileData, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError)
      throw apiErrors.badRequest(`Upload failed: ${uploadError.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('vehicle-images')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    console.log('📸 BULLETPROOF UPLOAD SUCCESS:', {
      fileName,
      filePath,
      publicUrl,
      size: fileData.length,
      uploadPath: uploadData.path
    })

    // Clean up temporary file
    try {
      await fs.unlink(file.filepath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError)
    }

    return res.status(200).json(apiSuccess({
      url: publicUrl,
      filename: fileName,
      size: fileData.length,
    }, (req as any).requestId))

  } catch (error) {
    console.error('❌ Upload error:', error)
    throw error
  }
}

export default withApiError(handler)
