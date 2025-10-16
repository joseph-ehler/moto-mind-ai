import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Event validation schema
const createEventSchema = z.object({
  type: z.enum(['fuel', 'maintenance', 'odometer', 'document', 'reminder', 'inspection']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  miles: z.number().int().min(0).optional(),
  payload: z.record(z.any()).default({}),
  notes: z.string().optional(),
  total_amount: z.number().optional(),
  gallons: z.number().optional(),
  vendor: z.string().optional()
})

/**
 * GET /api/vehicles/[vehicleId]/events
 * List all events for a specific vehicle (HIERARCHICAL)
 * 
 * This endpoint enforces ownership - events belong to vehicles
 * 
 * Query params:
 * - type: filter by event type
 * - limit: number of results (default 20)
 * - offset: pagination offset (default 0)
 * - start_date: filter by date range
 * - end_date: filter by date range
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params
  const searchParams = request.nextUrl.searchParams
  
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Verify user has access to this vehicle

    // Verify vehicle exists
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('id', vehicleId)
      .is('deleted_at', null)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('vehicle_events')
      .select('*', { count: 'exact' })
      .eq('vehicle_id', vehicleId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: events, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      events: events || [],
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year
      },
      pagination: {
        total: count || 0,
        limit,
        offset,
        has_more: count ? (offset + limit) < count : false
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vehicles/[vehicleId]/events
 * Create a new event for this vehicle (HIERARCHICAL - OWNERSHIP)
 * 
 * This is THE RIGHT WAY to create events - ownership is explicit!
 * 
 * Body:
 * - type: event type (required)
 * - date: event date (required)
 * - miles: odometer reading (optional but recommended)
 * - payload: event-specific data (optional)
 * - notes: user notes (optional)
 * - total_amount: cost (optional)
 * - gallons: fuel amount (optional)
 * - vendor: service provider (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { vehicleId: string } }
) {
  const { vehicleId } = params

  try {
    const body = await request.json()
    
    // Validate request body
    const eventData = createEventSchema.parse(body)
    
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // TODO: Get tenant_id from auth context
    const tenantId = body.tenant_id // Temporary

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized - no tenant context' },
        { status: 401 }
      )
    }

    // Verify vehicle exists and user has access
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, nickname')
      .eq('id', vehicleId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or access denied' },
        { status: 404 }
      )
    }

    // Mileage validation for events that should have mileage
    if (['odometer', 'fuel'].includes(eventData.type) && !eventData.miles) {
      return NextResponse.json(
        { error: `Miles required for ${eventData.type} events` },
        { status: 400 }
      )
    }

    // Get latest mileage for validation
    if (eventData.miles) {
      const { data: latestEvent } = await supabase
        .from('vehicle_events')
        .select('miles, date')
        .eq('vehicle_id', vehicleId)
        .not('miles', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (latestEvent?.miles && eventData.miles < latestEvent.miles) {
        const allowRollover = eventData.payload?.allow_rollover === true
        if (!allowRollover) {
          return NextResponse.json(
            { 
              error: `Mileage cannot decrease. Latest: ${latestEvent.miles}, provided: ${eventData.miles}`,
              latest_miles: latestEvent.miles,
              provided_miles: eventData.miles
            },
            { status: 400 }
          )
        }
      }
    }

    // Create event with explicit vehicle ownership
    const { data: event, error: createError } = await supabase
      .from('vehicle_events')
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicleId, // EXPLICIT OWNERSHIP
        type: eventData.type,
        date: eventData.date,
        miles: eventData.miles || null,
        payload: eventData.payload,
        notes: eventData.notes || null,
        total_amount: body.total_amount || null,
        gallons: body.gallons || null,
        vendor: body.vendor || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating event:', createError)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    const vehicleDisplayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

    console.log('✅ Event created successfully:', {
      id: event.id,
      type: event.type,
      vehicle: vehicleDisplayName,
      date: event.date
    })

    return NextResponse.json(
      {
        event,
        vehicle: {
          id: vehicle.id,
          name: vehicleDisplayName
        },
        message: `${eventData.type} event created for ${vehicleDisplayName}`
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
