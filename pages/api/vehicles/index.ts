import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { handleApiError, ValidationError } from '@/lib/utils/errors'
import { listEnvelope, trackEnvelopeUsage } from '@/lib/utils/http-envelope'
import { getVehicleDisplayName } from '@/lib/domain/types'
import { withTenantIsolation } from '@/features/auth'
import { z } from 'zod'

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

// Query validation schema
const vehicleQuerySchema = z.object({
  garage_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

// Type definitions for the new unified schema
interface VehicleEvent {
  vehicle_id: string
  miles: number | null
  date: string
}

interface Vehicle {
  id: string
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  vin: string | null
  nickname: string | null
  manufacturer_mpg: number | null
  manufacturer_service_interval_miles: number | null
  notes: string | null
  garage_id: string | null
  hero_image_url: string | null
  created_at: string
  updated_at: string
  garage: { id: string; name: string; address: string | null } | null
}

async function vehiclesHandler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get tenant ID from middleware (set by withTenantIsolation)
    const tenantId = (req as any).tenantId
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - no tenant context' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetVehicles(req, res, tenantId)
      case 'POST':
        return await handleCreateVehicle(req, res, tenantId)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

// Export handler wrapped with tenant isolation middleware
export default withTenantIsolation(vehiclesHandler)

async function handleGetVehicles(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // Use tenant-aware supabase client from middleware
    const supabase = (req as any).supabase || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    
    // Validate query parameters
    const query = vehicleQuerySchema.parse(req.query)

    // Build the vehicles query - using all available columns
    let vehiclesQuery = supabase
      .from('vehicles')
      .select(`
        id,
        tenant_id,
        make,
        model,
        year,
        vin,
        display_name,
        created_at,
        garage_id,
        trim,
        license_plate,
        nickname,
        manufacturer_mpg,
        manufacturer_service_interval_miles
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1)

    const { data: vehicles, error: vehiclesError } = await vehiclesQuery

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`)
    }

    // Get current mileage for each vehicle from the unified events table
    const vehicleIds = vehicles?.map((v: Vehicle) => v.id) || []
    let currentMileageMap = new Map<string, { miles: number; date: string }>()

    if (vehicleIds.length > 0) {
      // Query the latest odometer reading for each vehicle from vehicle_events
      const { data: mileageData, error: mileageError } = await supabase
        .from('vehicle_events')
        .select('vehicle_id, miles, date')
        .in('vehicle_id', vehicleIds)
        .not('miles', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (!mileageError && mileageData) {
        // Get the most recent mileage for each vehicle
        const latestMileageMap = new Map<string, { miles: number; date: string }>()
        ;(mileageData as VehicleEvent[]).forEach((event: VehicleEvent) => {
          if (!latestMileageMap.has(event.vehicle_id) && event.miles !== null) {
            latestMileageMap.set(event.vehicle_id, { miles: event.miles, date: event.date })
          }
        })
        currentMileageMap = latestMileageMap
      }
    }

    // Enhance vehicles with current mileage and display name
    const enhancedVehicles = (vehicles || []).map((vehicle: Vehicle) => {
      // Create display name from available data
      const displayName = vehicle.nickname || 
        (vehicle.year && vehicle.make && vehicle.model 
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
          : vehicle.make && vehicle.model 
            ? `${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
            : 'Unknown Vehicle')

      return {
        ...vehicle,
        display_name: displayName,
        currentMileage: currentMileageMap.get(vehicle.id)?.miles || null,
        mileageDate: currentMileageMap.get(vehicle.id)?.date || null
      }
    })

    // Track envelope usage for monitoring
    trackEnvelopeUsage('/api/vehicles', process.env.NEW_API_ENVELOPE === 'true' ? 'new' : 'legacy')
    
    // Use dual envelope format
    const response = listEnvelope('vehicles', enhancedVehicles, enhancedVehicles.length)
    response.hasMore = enhancedVehicles.length === query.limit
    
    return res.status(200).json(response)

  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleCreateVehicle(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // For now, return method not implemented
    // Vehicle creation should go through the onboarding flow
    return res.status(501).json({ 
      error: 'Vehicle creation not implemented',
      message: 'Use the vehicle onboarding flow to add new vehicles'
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
