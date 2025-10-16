import { getSupabaseServer } from '@/lib/supabase-server'
import { DatabaseError, ConflictError } from '@/lib/utils/errors'
import type { CreateGarageRequest } from '@/lib/validation/garages'
import type { Garage } from './getGarages'

export async function createGarage(tenantId: string, garageData: CreateGarageRequest): Promise<Garage> {
  const supabase = getSupabaseServer()
  
  try {
    // If this is being set as default, unset other defaults first
    if (garageData.is_default) {
      const { error: updateError } = await supabase
        .from('garages')
        .update({ is_default: false })
        .eq('tenant_id', tenantId)
        .eq('is_default', true)

      if (updateError) {
        throw new DatabaseError(`Failed to update existing defaults: ${updateError.message}`)
      }
    }

    // Create the garage
    const { data, error } = await supabase
      .from('garages')
      .insert({
        tenant_id: tenantId,
        ...garageData
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictError('A garage with this name already exists')
      }
      throw new DatabaseError(`Failed to create garage: ${error.message}`)
    }

    return {
      ...data,
      vehicleCount: 0 // New garage has no vehicles
    }
  } catch (error) {
    if (error instanceof ConflictError || error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Unexpected error creating garage: ${error}`)
  }
}
