import { createClient } from '@supabase/supabase-js'
import { DatabaseError, NotFoundError, ConflictError } from '@/lib/utils/errors'

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

export async function deleteGarage(tenantId: string, garageId: string): Promise<void> {
  try {
    // Check if garage has vehicles
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('garage_id', garageId)
      .is('deleted_at', null)

    if (vehicleError) {
      throw new DatabaseError(`Failed to check vehicles: ${vehicleError.message}`)
    }

    if (vehicles && vehicles.length > 0) {
      throw new ConflictError(`Cannot delete garage with ${vehicles.length} vehicles. Move vehicles first.`)
    }

    // Delete the garage
    const { error } = await supabase
      .from('garages')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', garageId)

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Garage', garageId)
      }
      throw new DatabaseError(`Failed to delete garage: ${error.message}`)
    }
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof DatabaseError) {
      throw error
    }
    throw new DatabaseError(`Unexpected error deleting garage: ${error}`)
  }
}
