import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { handleApiError, ValidationError, DatabaseError } from '../../../lib/utils/errors'
import { withTenantIsolation } from '../../../lib/middleware/tenant-context'

// Supabase client will be created by tenant isolation middleware

// Event validation schema for the unified vehicle_events table
const saveEventSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  type: z.enum(['fuel', 'maintenance', 'odometer', 'document', 'reminder', 'inspection']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  miles: z.number().int().min(0).optional(),
  payload: z.record(z.any()).default({}),
  notes: z.string().optional()
})

async function saveEventHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get tenant ID and supabase client from middleware
    const tenantId = (req as any).tenantId || '550e8400-e29b-41d4-a716-446655440000'
    const supabase = (req as any).supabase || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    // Validate request body
    const eventData = saveEventSchema.parse(req.body)
    
    // Verify vehicle exists and belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, nickname, make, model')
      .eq('tenant_id', tenantId)
      .eq('id', eventData.vehicle_id)
      .is('deleted_at', null)
      .single()

    if (vehicleError || !vehicle) {
      throw new ValidationError('Vehicle not found or access denied')
    }

    // Mileage validation for events that should have mileage
    if (['odometer', 'fuel'].includes(eventData.type) && !eventData.miles) {
      throw new ValidationError(`Miles required for ${eventData.type} events`)
    }

    // Get latest mileage for validation if miles provided
    if (eventData.miles) {
      const { data: latestMileageEvents, error: mileageError } = await supabase
        .from('vehicle_events')
        .select('miles, date')
        .eq('vehicle_id', eventData.vehicle_id)
        .not('miles', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)

      if (mileageError) {
        console.warn('Could not check latest mileage:', mileageError.message)
      }

      const latestMileage = latestMileageEvents?.[0]
      
      // Validate non-decreasing mileage (with rollover allowance)
      if (latestMileage?.miles && eventData.miles < latestMileage.miles) {
        const allowRollover = eventData.payload?.allow_rollover === true
        if (!allowRollover) {
          throw new ValidationError(
            `Mileage cannot decrease. Latest: ${latestMileage.miles}, provided: ${eventData.miles}. ` +
            `Set allow_rollover: true if this is intentional (e.g., odometer rollover).`
          )
        }
      }
    }

    // Create the event in the unified table
    console.log('🔄 Attempting to insert event into vehicle_events table...')
    console.log('📊 Event data:', {
      tenant_id: tenantId,
      vehicle_id: eventData.vehicle_id,
      type: eventData.type,
      date: eventData.date,
      miles: eventData.miles
    })
    
    const { data: event, error: createError } = await supabase
      .from('vehicle_events')
      .insert({
        tenant_id: tenantId,
        vehicle_id: eventData.vehicle_id,
        type: eventData.type,
        date: eventData.date,
        miles: eventData.miles || null,
        payload: eventData.payload,
        notes: eventData.notes || null
      })
      .select(`
        id,
        type,
        date,
        miles,
        payload,
        notes,
        created_at
      `)
      .single()

    if (createError) {
      console.error('❌ Database error creating event:', createError)
      console.error('❌ Error details:', {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint
      })
      throw new DatabaseError(`Failed to create event: ${createError.message}`)
    }

    const vehicleDisplayName = vehicle.nickname || `${vehicle.make} ${vehicle.model}`
    
    console.log('✅ Event saved successfully:', {
      id: event.id,
      type: event.type,
      vehicle: vehicleDisplayName,
      date: event.date
    })

    return res.status(201).json({
      success: true,
      event,
      message: `${eventData.type} event saved to timeline`
    })

  } catch (error) {
    console.error('❌ Error saving event:', error)
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

// Export handler wrapped with tenant isolation middleware
export default withTenantIsolation(saveEventHandler)
