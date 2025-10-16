import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createTenantClient, type AuthContext } from '@/lib/middleware'
import { z } from 'zod'
import { handleApiError, ValidationError, DatabaseError } from '@/lib/utils/errors'
// Event validation schema for the unified vehicle_events table
const saveEventSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  type: z.enum(['fuel', 'maintenance', 'odometer', 'document', 'reminder', 'inspection']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  miles: z.number().int().min(0).optional(),
  payload: z.record(z.any()).default({}),
  notes: z.string().optional(),
  tenant_id: z.string().uuid().optional() // TODO: Get from auth context
})

/**
 * POST /api/events/save
 * Creates a new vehicle event
 * 
 * App Router version - migrated from pages/api/events/save.ts
 */
export const POST = withAuth(async (
  request: NextRequest,
  { user, tenant, token }: AuthContext
) => {
  try {
    const body = await request.json()
    
    // TODO: Get tenant ID from auth context
    // For now, expect it in the request body
    const tenantId = body.tenant_id
    
    if (!tenantId) {
      return NextResponse.json(
      { 
        ok: false,
        error: {
          code: 'EVENTS_UNAUTHORIZED_-_NO_TENANT_CONTEXT',
          message: 'Unauthorized - no tenant context'
        }
      },
        { status: 401 }
      )
    }
    
    // Validate request body
    const eventData = saveEventSchema.parse(body)
    
    const supabase = createTenantClient(token, tenant.tenantId)
    
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

    return NextResponse.json({
      ok: true,
      data: { success: true,
      event,
      message: `${eventData.type }
    } event saved to timeline`
    }, { status: 201 })

  } catch (error) {
    console.error('[EVENTS] ❌ Error saving event:', {
      tenantId: tenant.tenantId,
      userId: user.id,
      error,
    })
    const { status, body } = handleApiError(error, request.url)
    return NextResponse.json(body, { status })
  }
})
