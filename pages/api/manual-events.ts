// MotoMindAI: Manual Events API
// Creates structured events from OCR extraction or manual entry

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantTransaction } from '../../backend/database'
import { FleetErrors, getErrorStatusCode } from '../../backend/error-types'
import { z } from 'zod'

// Validation schemas for different event types
const OdometerReadingSchema = z.object({
  miles: z.number().int().min(0).max(999999),
  ocr_confidence: z.number().int().min(0).max(100).optional(),
  parsed_digits: z.string().optional()
})

const FuelPurchaseSchema = z.object({
  gallons: z.number().min(0).max(200),
  price_total: z.number().min(0),
  unit_price: z.number().min(0).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  station: z.string().optional(),
  ocr_confidence: z.number().int().min(0).max(100).optional()
})

const MaintenanceSchema = z.object({
  service_type: z.string(),
  parts: z.array(z.string()).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
  cost: z.number().min(0).optional(),
  odometer_miles: z.number().int().min(0).optional()
})

const IssueReportSchema = z.object({
  category: z.enum(['brakes', 'engine', 'tires', 'electrical', 'body', 'other']),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  note: z.string(),
  photo_ids: z.array(z.string()).optional()
})

const TripBatchSchema = z.object({
  trips: z.array(z.object({
    miles: z.number().min(0),
    start_location: z.string().optional(),
    end_location: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })),
  period: z.string(),
  total_miles: z.number().min(0).optional()
})

const RequestSchema = z.object({
  vehicleId: z.string().uuid(),
  sourceUploadId: z.string().uuid().optional(),
  eventType: z.enum(['odometer_reading', 'fuel_purchase', 'maintenance', 'issue_report', 'trip_batch']),
  payload: z.record(z.any()),
  confidence: z.number().int().min(0).max(100).optional(),
  verifiedByUser: z.boolean().default(false)
})

interface ManualEventResponse {
  id: string
  eventType: string
  confidence: number
  verifiedByUser: boolean
  createdAt: string
}

// Mock auth for development
function mockAuth(req: NextApiRequest) {
  return {
    tenantId: 'demo-tenant-123',
    userId: 'demo-user-456',
    role: 'owner'
  }
}

function validatePayload(eventType: string, payload: any) {
  switch (eventType) {
    case 'odometer_reading':
      return OdometerReadingSchema.parse(payload)
    case 'fuel_purchase':
      return FuelPurchaseSchema.parse(payload)
    case 'maintenance':
      return MaintenanceSchema.parse(payload)
    case 'issue_report':
      return IssueReportSchema.parse(payload)
    case 'trip_batch':
      return TripBatchSchema.parse(payload)
    default:
      throw new Error(`Unknown event type: ${eventType}`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ManualEventResponse | { error: string; suggestion?: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = mockAuth(req)
    
    // Validate request body
    const body = RequestSchema.parse(req.body)
    
    // Validate payload based on event type
    const validatedPayload = validatePayload(body.eventType, body.payload)
    
    // Create manual event
    const result = await withTenantTransaction(
      { tenantId: auth.tenantId, userId: auth.userId },
      async (client) => {
        // Verify vehicle belongs to tenant
        const vehicleCheck = await client.query(
          'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
          [body.vehicleId, auth.tenantId]
        )
        
        if (vehicleCheck.rows.length === 0) {
          throw FleetErrors.validationError('vehicleId', 'Vehicle not found or access denied')
        }

        // Verify upload belongs to tenant if provided
        let sourceUploadId = body.sourceUploadId
        if (sourceUploadId) {
          const uploadCheck = await client.query(
            'SELECT id FROM uploads WHERE id = $1 AND tenant_id = $2',
            [sourceUploadId, auth.tenantId]
          )
          
          if (uploadCheck.rows.length === 0) {
            sourceUploadId = undefined // Ignore invalid upload ID
          }
        }

        // Insert manual event
        const insertResult = await client.query(`
          INSERT INTO manual_events (
            tenant_id, vehicle_id, source_upload_id, event_type, 
            payload, confidence, verified_by_user, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          auth.tenantId,
          body.vehicleId,
          sourceUploadId,
          body.eventType,
          JSON.stringify(validatedPayload),
          body.confidence || 80,
          body.verifiedByUser,
          auth.userId
        ])

        return insertResult.rows[0]
      }
    )

    const response: ManualEventResponse = {
      id: result.id,
      eventType: result.event_type,
      confidence: result.confidence,
      verifiedByUser: result.verified_by_user,
      createdAt: result.created_at
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error('Manual events API error:', error)

    if (error instanceof z.ZodError) {
      const validationError = FleetErrors.validationError(
        'payload',
        `Invalid ${req.body?.eventType || 'event'} data: ${error.errors.map(e => e.message).join(', ')}`
      )
      return res.status(getErrorStatusCode(validationError.category)).json(validationError.toJSON())
    }

    if (error instanceof Error && error.name === 'FleetError') {
      const fleetError = error as any
      return res.status(getErrorStatusCode(fleetError.category)).json(fleetError.toJSON())
    }

    const systemError = FleetErrors.systemError('manual event creation')
    return res.status(getErrorStatusCode(systemError.category)).json(systemError.toJSON())
  }
}
