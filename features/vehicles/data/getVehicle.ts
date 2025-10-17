import { supabaseAdmin } from '@/lib/clients/supabase'
import { apiErrors } from '@/lib/utils/api-error'

export interface Vehicle {
  id: string
  tenant_id: string
  display_name: string
  nickname?: string
  make: string
  model: string
  year: number
  vin?: string
  garage_id?: string
  hero_image_url?: string
  enrichment?: any
  smart_defaults?: any
  service_intervals?: any
  created_at: string
  updated_at: string
}

export async function getVehicle(vehicleId: string, tenantId: string): Promise<Vehicle> {
  const { data: vehicle, error } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    console.error('Database error fetching vehicle:', error)
    throw apiErrors.notFound('Vehicle not found')
  }

  if (!vehicle) {
    throw apiErrors.notFound('Vehicle not found')
  }

  return vehicle
}

export async function getVehicles(tenantId: string): Promise<Vehicle[]> {
  const { data: vehicles, error } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Database error fetching vehicles:', error)
    throw apiErrors.badRequest('Failed to fetch vehicles')
  }

  return vehicles || []
}
