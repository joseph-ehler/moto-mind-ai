// Simple file upload for testing Vision API
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Parse multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    })

    const [fields, files] = await form.parse(req)
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const ext = path.extname(file.originalFilename || '.jpg')
    const filename = `${fileId}${ext}`
    const newPath = path.join(uploadsDir, filename)

    // Move file to final location
    await fs.rename(file.filepath, newPath)

    // Return file info
    return res.status(200).json({
      id: fileId,
      url: `/uploads/${filename}`,
      originalName: file.originalFilename,
      size: file.size,
      mimeType: file.mimetype
    })

  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
