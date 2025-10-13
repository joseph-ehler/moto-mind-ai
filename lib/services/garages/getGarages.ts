import { createClient } from '@supabase/supabase-js'
import { NotFoundError, DatabaseError } from '@/lib/utils/errors'
import type { GarageQuery } from '@/lib/validation/vehicless'

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

export interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default: boolean
  vehicleCount: number
  created_at: string
  updated_at: string
}

export async function getGarages(tenantId: string, query: Partial<GarageQuery> = {}): Promise<Garage[]> {
  try {
    // Get all garages and vehicle counts in parallel
    const [garagesResult, countsResult] = await Promise.all([
      supabase
        .from('garages')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: true })
        .range(query.offset || 0, (query.offset || 0) + (query.limit || 50) - 1),
      
      supabase
        .from('vehicles')
        .select('garage_id')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
    ])

    if (garagesResult.error) {
      throw new DatabaseError(`Failed to fetch garages: ${garagesResult.error.message}`)
    }

    if (countsResult.error) {
      throw new DatabaseError(`Failed to fetch vehicle counts: ${countsResult.error.message}`)
    }

    // Count vehicles per garage
    const vehicleCounts = countsResult.data.reduce((acc: Record<string, number>, vehicle) => {
      if (vehicle.garage_id) {
        acc[vehicle.garage_id] = (acc[vehicle.garage_id] || 0) + 1
      }
      return acc
    }, {})

    // Combine garages with vehicle counts
    const garages: Garage[] = garagesResult.data.map(garage => ({
      ...garage,
      vehicleCount: vehicleCounts[garage.id] || 0
    }))

    return garages
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Unexpected error fetching garages: ${error}`)
  }
}

export async function getGarageById(tenantId: string, garageId: string): Promise<Garage> {
  try {
    const { data, error } = await supabase
      .from('garages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', garageId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Garage', garageId)
      }
      throw new DatabaseError(`Failed to fetch garage: ${error.message}`)
    }

    // Get vehicle count for this garage
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('garage_id', garageId)
      .is('deleted_at', null)

    if (vehicleError) {
      throw new DatabaseError(`Failed to fetch vehicle count: ${vehicleError.message}`)
    }

    return {
      ...data,
      vehicleCount: vehicles?.length || 0
    }
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Unexpected error fetching garage: ${error}`)
  }
}
