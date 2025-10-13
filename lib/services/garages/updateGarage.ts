import { createClient } from '@supabase/supabase-js'
import { DatabaseError, NotFoundError, ConflictError } from '@/lib/utils/errors'
import type { UpdateGarageRequest } from '@/lib/validation/vehicless'
import type { Garage } from './getGarages'

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

export async function updateGarage(
  tenantId: string, 
  garageId: string, 
  updates: UpdateGarageRequest
): Promise<Garage> {
  try {
    // If this is being set as default, unset other defaults first
    if (updates.is_default) {
      const { error: updateError } = await supabase
        .from('garages')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('is_default', true)
        .neq('id', garageId) // Don't update the current garage

      if (updateError) {
        throw new DatabaseError(`Failed to update existing defaults: ${updateError.message}`)
      }
    }

    // Update the garage
    const { data, error } = await supabase
      .from('garages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('id', garageId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Garage', garageId)
      }
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('A garage with this name already exists')
      }
      throw new DatabaseError(`Failed to update garage: ${error.message}`)
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
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Unexpected error updating garage: ${error}`)
  }
}
