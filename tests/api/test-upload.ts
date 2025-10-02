// Test upload endpoint to debug formidable
import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 Test upload API called:', { method: req.method })
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📝 Parsing form data...')
    
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    
    console.log('📋 Parsed successfully:', {
      fields: Object.keys(fields),
      files: Object.keys(files),
      fieldValues: fields,
      fileDetails: Object.entries(files).map(([key, file]) => ({
        key,
        size: Array.isArray(file) ? (file[0] as any)?.size : (file as any)?.size,
        name: Array.isArray(file) ? (file[0] as any)?.originalFilename : (file as any)?.originalFilename
      }))
    })

    return res.status(200).json({
      success: true,
      fields: Object.keys(fields),
      files: Object.keys(files),
      details: {
        fieldCount: Object.keys(fields).length,
        fileCount: Object.keys(files).length
      }
    })

  } catch (error) {
    console.error('❌ Test upload error:', error)
    return res.status(500).json({ 
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
