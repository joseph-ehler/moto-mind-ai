import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { handleApiError, ValidationError, DatabaseError } from '@/lib/utils/errors'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Vehicle ID validation
const vehicleIdSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format')
})

interface VehicleStats {
  service: {
    last_oil_change_miles: number | null
    current_miles: number | null
    interval_miles: number
    miles_until_service: number | null
    next_service_due: number | null
  }
  costs: {
    month_total: number
    month_count: number
    quarter_total: number
    quarter_count: number
  }
  activity: Array<{
    id: string
    type: string
    date: string
    summary: string | null
    miles: number | null
    total_amount: number | null
  }>
  health: {
    warning_lights: string[]
    last_dashboard_date: string | null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Mock tenant ID for development
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    // Validate vehicle ID
    const { id: vehicleId } = vehicleIdSchema.parse(req.query)

    return await handleGetStats(req, res, tenantId, vehicleId)
  } catch (error) {
    console.error('❌ Stats API Error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleGetStats(
  req: NextApiRequest,
  res: NextApiResponse,
  tenantId: string,
  vehicleId: string
) {
  try {
    // Verify vehicle exists (no need to select service interval columns yet)
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', vehicleId)
      .single()

    if (vehicleError) {
      console.error('Vehicle query error:', vehicleError)
      throw new ValidationError(`Vehicle not found or access denied: ${vehicleError.message}`)
    }
    
    if (!vehicle) {
      throw new ValidationError('Vehicle not found or access denied')
    }

    // Default to 5000 miles for oil change interval
    // TODO: Add manufacturer_service_interval_miles column to vehicles table
    const intervalMiles = 5000

    // Run aggregation queries in parallel
    const [serviceData, costsData, activityData, healthData] = await Promise.all([
      getServiceStats(vehicleId, intervalMiles),
      getCostsStats(vehicleId),
      getRecentActivity(vehicleId, 5),
      getHealthStats(vehicleId)
    ])

    const stats: VehicleStats = {
      service: serviceData,
      costs: costsData,
      activity: activityData,
      health: healthData
    }

    return res.status(200).json(stats)
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

// Get service prediction stats
async function getServiceStats(vehicleId: string, intervalMiles: number) {
  // Get last oil change mileage
  const { data: lastOilChange } = await supabase
    .from('vehicle_events')
    .select('miles')
    .eq('vehicle_id', vehicleId)
    .eq('type', 'maintenance')
    .not('miles', 'is', null)
    .or('payload->>services.cs.{"oil_change"},payload->>service_type.eq.oil_change')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .single()

  const lastOilChangeMiles = lastOilChange?.miles || null

  // Get current mileage - HIGHEST mileage recorded, not just most recent
  // This prevents old documents from overwriting current mileage
  const { data: currentMileage } = await supabase
    .from('vehicle_events')
    .select('miles')
    .eq('vehicle_id', vehicleId)
    .not('miles', 'is', null)
    .order('miles', { ascending: false })  // Order by HIGHEST mileage
    .limit(1)
    .single()

  const currentMiles = currentMileage?.miles || null

  // Calculate next service
  let milesUntilService: number | null = null
  let nextServiceDue: number | null = null

  if (lastOilChangeMiles !== null && currentMiles !== null) {
    const calculatedNextService = lastOilChangeMiles + intervalMiles
    nextServiceDue = calculatedNextService
    milesUntilService = calculatedNextService - currentMiles
  }

  return {
    last_oil_change_miles: lastOilChangeMiles,
    current_miles: currentMiles,
    interval_miles: intervalMiles,
    miles_until_service: milesUntilService,
    next_service_due: nextServiceDue
  }
}

// Get cost aggregations
async function getCostsStats(vehicleId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0]

  // Month total
  const { data: monthData } = await supabase
    .from('vehicle_events')
    .select('payload')
    .eq('vehicle_id', vehicleId)
    .gte('date', monthStart)
    .not('payload->total_amount', 'is', null)

  const monthTotal = monthData?.reduce((sum, event) => {
    const amount = event.payload?.total_amount || 0
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0)
  }, 0) || 0

  // Quarter total
  const { data: quarterData } = await supabase
    .from('vehicle_events')
    .select('payload')
    .eq('vehicle_id', vehicleId)
    .gte('date', quarterStart)
    .not('payload->total_amount', 'is', null)

  const quarterTotal = quarterData?.reduce((sum, event) => {
    const amount = event.payload?.total_amount || 0
    return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0)
  }, 0) || 0

  return {
    month_total: Math.round(monthTotal * 100) / 100,
    month_count: monthData?.length || 0,
    quarter_total: Math.round(quarterTotal * 100) / 100,
    quarter_count: quarterData?.length || 0
  }
}

// Get recent activity
async function getRecentActivity(vehicleId: string, limit: number) {
  const { data: events } = await supabase
    .from('vehicle_events')
    .select('id, type, date, miles, payload, created_at')
    .eq('vehicle_id', vehicleId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })  // Order by creation time, not date!
    .limit(limit)

  return events?.map(event => ({
    id: event.id,
    type: event.type,
    date: event.date,
    created_at: event.created_at,  // Include actual creation timestamp!
    summary: event.payload?.summary || null,
    miles: event.miles,
    total_amount: event.payload?.total_amount || null
  })) || []
}

// Get health stats (warning lights)
async function getHealthStats(vehicleId: string) {
  const { data: lastDashboard } = await supabase
    .from('vehicle_events')
    .select('date, payload')
    .eq('vehicle_id', vehicleId)
    .eq('type', 'dashboard_snapshot')
    .order('date', { ascending: false })
    .order('id', { ascending: false })
    .limit(1)
    .single()

  const warningLights = lastDashboard?.payload?.warning_lights || []
  const lastDashboardDate = lastDashboard?.date || null

  return {
    warning_lights: Array.isArray(warningLights) ? warningLights : [],
    last_dashboard_date: lastDashboardDate
  }
}
