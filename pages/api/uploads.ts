// MotoMindAI: File Upload API
// Handles smartphone photo/document uploads with local storage

import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { withTenantTransaction } from '../../backend/database'
import { FleetErrors, getErrorStatusCode } from '../../backend/error-types'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface UploadResponse {
  id: string
  url: string
  kind: string
  bytes: number
  mimeType: string
}

// Mock auth for development
function mockAuth(req: NextApiRequest) {
  return {
    tenantId: 'demo-tenant-123',
    userId: 'demo-user-456',
    role: 'owner'
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse | { error: string; suggestion?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = mockAuth(req)
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadsDir, { recursive: true })

    // Parse multipart form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
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
    const kind = Array.isArray(fields.kind) ? fields.kind[0] : fields.kind
    const vehicleId = Array.isArray(fields.vehicleId) ? fields.vehicleId[0] : fields.vehicleId

    if (!file) {
      throw FleetErrors.validationError('file', 'No file uploaded')
    }

    if (!kind || !['odometer_photo', 'fuel_receipt', 'maintenance_doc', 'issue_photo', 'trip_csv'].includes(kind)) {
      throw FleetErrors.validationError('kind', 'Invalid upload kind')
    }

    if (!vehicleId) {
      throw FleetErrors.validationError('vehicleId', 'Vehicle ID required')
    }

    // Generate unique filename
    const fileId = uuidv4()
    const extension = path.extname(file.originalFilename || '')
    const filename = `${fileId}${extension}`
    const newPath = path.join(uploadsDir, filename)
    
    // Move file to permanent location
    await fs.rename(file.filepath, newPath)
    
    // Store in database
    const result = await withTenantTransaction(
      { tenantId: auth.tenantId, userId: auth.userId },
      async (client) => {
        const insertResult = await client.query(`
          INSERT INTO uploads (
            tenant_id, user_id, vehicle_id, kind, storage_url, 
            mime_type, bytes, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, now())
          RETURNING *
        `, [
          auth.tenantId,
          auth.userId,
          vehicleId,
          kind,
          `/uploads/${filename}`,
          file.mimetype || 'application/octet-stream',
          file.size
        ])

        return insertResult.rows[0]
      }
    )

    const response: UploadResponse = {
      id: result.id,
      url: result.storage_url,
      kind: result.kind,
      bytes: result.bytes,
      mimeType: result.mime_type
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Upload API error:', error)

    if (error instanceof Error && error.name === 'FleetError') {
      const fleetError = error as any
      return res.status(getErrorStatusCode(fleetError.category)).json(fleetError.toJSON())
    }

    const systemError = FleetErrors.systemError('file upload')
    return res.status(getErrorStatusCode(systemError.category)).json(systemError.toJSON())
  }
}
