import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { handleApiError, ValidationError, DatabaseError } from '@/lib/utils/errors'
import { visionMetrics } from '@/lib/monitoring/vision-metrics'
import { databaseVisionMetrics } from '@/lib/monitoring/database-metrics'
import { withTenantIsolation } from '@/features/auth'

// Event validation schema
const eventSchema = z.object({
  type: z.enum([
    'odometer', 'maintenance', 'fuel', 'document', // existing
    'repair', 'inspection', 'insurance', 'accident', // new Tier 1
    'dashboard_snapshot' // dashboard capture
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  miles: z.number().int().min(0).optional(),
  image_id: z.string().uuid().nullable().optional(), // Link to vehicle_images
  payload: z.record(z.any()).default({})
})

// Vehicle ID validation
const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format')
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tenantId = (req as any).tenantId
    const supabase = (req as any).supabase

    // Validate vehicle ID
    const { id: vehicleId } = vehicleIdSchema.parse(req.query)

    switch (req.method) {
      case 'POST':
        return handleCreateEvent(req, res, tenantId, vehicleId, supabase)
      case 'GET':
        return handleGetEvents(req, res, tenantId, vehicleId, supabase)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

export default withTenantIsolation(handler)

async function handleCreateEvent(
  req: NextApiRequest, 
  res: NextApiResponse, 
  tenantId: string, 
  vehicleId: string,
  supabase: any
) {
  try {
    console.log('📝 Events API - Raw request body:', JSON.stringify(req.body, null, 2))
    
    // Validate request body
    const eventData = eventSchema.parse(req.body)
    console.log('✅ Events API - Validation passed:', eventData)
    
    // Set default date for dashboard_snapshot events
    if (eventData.type === 'dashboard_snapshot' && !eventData.date) {
      eventData.date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    }

    // Verify vehicle exists and belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      throw new ValidationError('Vehicle not found or access denied')
    }

    // Mileage validation and inference for events (skip for dashboard_snapshot)
    if (['odometer', 'maintenance', 'fuel'].includes(eventData.type)) {
      // Get current mileage from the latest event for validation and inference
      const { data: latestMileageEvents, error: mileageError } = await supabase
        .from('vehicle_events')
        .select('miles, date')
        .eq('vehicle_id', vehicleId)
        .not('miles', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (mileageError) {
        throw new DatabaseError(`Failed to check current mileage: ${mileageError.message}`)
      }

      const currentMileage = latestMileageEvents?.[0] || null

      // Handle mileage requirements and inference
      if (eventData.miles) {
        // Validate non-decreasing mileage (unless rollover allowed)
        if (currentMileage?.miles && eventData.miles < currentMileage.miles) {
          const allowRollover = eventData.payload?.allow_rollover === true
          if (!allowRollover) {
            throw new ValidationError(
              `Mileage cannot decrease. Current: ${currentMileage.miles}, provided: ${eventData.miles}. ` +
              `Use allow_rollover: true if this is intentional (e.g., odometer rollover).`
            )
          }
        }
      } else {
        // Miles not provided - handle by event type
        if (eventData.type === 'odometer') {
          throw new ValidationError('Miles required for odometer events')
        } else if (eventData.type === 'maintenance' && currentMileage?.miles) {
          // Infer miles for maintenance events
          eventData.miles = currentMileage.miles
          eventData.payload = {
            ...eventData.payload,
            miles_inferred: true,
            inferred_from_date: currentMileage.date
          }
        } else if (eventData.type === 'fuel' && currentMileage?.miles) {
          // Infer miles for fuel events (fuel receipts rarely have odometer readings)
          eventData.miles = currentMileage.miles
          eventData.payload = {
            ...eventData.payload,
            miles_inferred: true,
            inferred_from_date: currentMileage.date
          }
        }
        // If no current mileage exists, allow fuel/maintenance events without miles
      }
    }

    // Create the event
    const now = new Date().toISOString()
    const { data: event, error: createError } = await supabase
      .from('vehicle_events')
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        type: eventData.type,
        date: eventData.date,
        miles: eventData.miles,
        image_id: eventData.image_id || null,
        payload: eventData.payload
      })
      .select()
      .single()

    if (createError) {
      throw new DatabaseError(`Failed to create event: ${createError.message}`)
    }

    // Record metrics for vision processing events
    if (eventData.payload?.processing_metadata) {
      const processingTime = eventData.payload.processing_metadata.processing_ms || 0
      const confidence = eventData.payload.confidence || 0
      const documentType = eventData.payload.type || eventData.type
      
      // Try database first, fallback to in-memory
      try {
        await databaseVisionMetrics.recordRequest({
          document_type: documentType,
          processing_time_ms: processingTime,
          success: true,
          confidence: confidence
        })
        console.log('📊 Recorded vision metrics to database:', {
          document_type: documentType,
          processing_time_ms: processingTime,
          success: true,
          confidence: confidence
        })
      } catch (dbError) {
        console.log('📊 Database recording failed, using in-memory fallback')
        visionMetrics.recordRequest({
          document_type: documentType,
          processing_time_ms: processingTime,
          success: true,
          confidence: confidence
        })
      }
    }

    return res.status(201).json({ 
      success: true, 
      event,
      message: `${eventData.type} event created successfully` 
    })
  } catch (error) {
    console.error('❌ Events API Error in handleCreateEvent:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleGetEvents(
  req: NextApiRequest, 
  res: NextApiResponse, 
  tenantId: string, 
  vehicleId: string,
  supabase: any
) {
  try {
    // Parse query parameters
    const { 
      after,  // cursor: base64(date__id)
      limit = '30',
      types,  // comma-separated event types
      since   // ISO date for filtering
    } = req.query

    const limitNum = Math.min(parseInt(limit as string, 10), 100) // Max 100 per page

    // Verify vehicle exists and belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      throw new ValidationError('Vehicle not found or access denied')
    }

    // Parse cursor if provided
    let cursorDate: string | null = null
    let cursorId: string | null = null
    if (after && typeof after === 'string') {
      try {
        const decoded = Buffer.from(after, 'base64').toString('utf-8')
        const [date, id] = decoded.split('__')
        cursorDate = date
        cursorId = id
      } catch (e) {
        throw new ValidationError('Invalid cursor format')
      }
    }

    // Parse types filter
    const typesList = types 
      ? (types as string).split(',').map(t => t.trim())
      : null

    // Build query with keyset pagination including photo data
    let query = supabase
      .from('vehicle_events')
      .select(`
        *,
        image:vehicle_images!image_id(
          id,
          public_url,
          filename,
          ai_category,
          ai_description,
          detected_text,
          vehicle_details,
          vehicle_match,
          parts_visible,
          condition_data,
          maintenance_indicators,
          suggested_actions
        )
      `)
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)

    // Apply type filter
    if (typesList && typesList.length > 0) {
      query = query.in('type', typesList)
    }

    // Apply since filter
    if (since && typeof since === 'string') {
      query = query.gte('date', since)
    }

    // Apply keyset cursor (date, id) for pagination
    if (cursorDate && cursorId) {
      // For records with date < cursorDate OR (date = cursorDate AND id < cursorId)
      // We need to use or() with multiple filters
      query = query.or(`date.lt.${cursorDate},and(date.eq.${cursorDate},id.lt.${cursorId})`)
    }

    // Order by date DESC, id DESC (matches keyset)
    query = query
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(limitNum + 1) // Fetch one extra to check if there are more

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      throw new DatabaseError(`Failed to fetch events: ${eventsError.message}`)
    }

    // Check if there are more results
    const hasMore = events && events.length > limitNum
    const returnEvents = hasMore ? events.slice(0, limitNum) : events || []

    // Generate next cursor if there are more results
    let nextCursor: string | null = null
    if (hasMore && returnEvents.length > 0) {
      const lastEvent = returnEvents[returnEvents.length - 1]
      const cursorString = `${lastEvent.date}__${lastEvent.id}`
      nextCursor = Buffer.from(cursorString).toString('base64')
    }

    return res.status(200).json({ 
      events: returnEvents,
      count: returnEvents.length,
      next_cursor: nextCursor,
      has_more: hasMore
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
