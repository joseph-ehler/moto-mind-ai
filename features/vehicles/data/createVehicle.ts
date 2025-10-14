import { supabaseAdmin } from '@/lib/clients/supabase'
import { apiErrors } from '@/lib/utils/api-error'
import { z } from 'zod'

export interface CreateVehicleInput {
  nickname: string
  make: string
  model: string
  vin?: string
  garage_id?: string
  hero_image_url?: string | null
  enrichment?: {
    year: number
    trim?: string
    body_class?: string
    engine?: any
    drivetrain?: string
    transmission?: string
    manufactured?: any
  }
  smart_defaults?: any
  onboarding_duration_ms?: number
  source?: string
}

export async function createVehicle(
  input: CreateVehicleInput,
  tenantId: string
): Promise<{ id: string; vehicle: any }> {
  // Extract year from enrichment or default to current year
  const year = input.enrichment?.year || new Date().getFullYear()

  // Prepare vehicle data (matching actual database schema)
  const vehicleData = {
    tenant_id: tenantId,
    label: `${year} ${input.make} ${input.model}`,
    nickname: input.nickname,
    make: input.make,
    model: input.model,
    vin: input.vin,
    garage_id: input.garage_id || null,
    hero_image_url: input.hero_image_url,
    enrichment: {
      year: year,
      ...input.enrichment
    },
    smart_defaults: input.smart_defaults || {},
    service_intervals: {},
  }

  console.log('🚗 Creating vehicle with data:', {
    nickname: vehicleData.nickname,
    hero_image_url: vehicleData.hero_image_url,
    hasHeroImage: !!vehicleData.hero_image_url,
  })

  // Insert vehicle
  const { data: vehicle, error } = await supabaseAdmin
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single()

  if (error) {
    console.error('Database error creating vehicle:', error)
    throw apiErrors.badRequest('Failed to create vehicle')
  }

  console.log('✅ Vehicle created successfully:', vehicle.id)

  // If hero_image_url is provided, create a corresponding vehicle_images record
  if (input.hero_image_url) {
    try {
      console.log('🖼️ Creating hero image record for vehicle:', vehicle.id, 'with URL:', input.hero_image_url)
      
      // Extract filename from URL
      const urlParts = input.hero_image_url.split('/')
      const filename = urlParts[urlParts.length - 1] || 'hero-image.jpg'
      
      // Extract storage path (everything after the domain)
      const storagePath = input.hero_image_url.includes('/vehicle-photos/') 
        ? input.hero_image_url.split('/vehicle-photos/')[1]
        : `vehicle-photos/${filename}`

      const { error: imageError } = await supabaseAdmin
        .from('vehicle_images')
        .insert({
          tenant_id: tenantId,
          vehicle_id: vehicle.id,
          storage_path: storagePath,
          public_url: input.hero_image_url,
          filename: filename,
          image_type: 'hero',
          is_primary: true,
        })

      if (imageError) {
        console.warn('Failed to create vehicle_images record:', imageError)
        // Don't fail the vehicle creation if image record creation fails
      } else {
        console.log('✅ Hero image record created successfully')
      }
    } catch (imageError) {
      console.warn('Error creating hero image record:', imageError)
      // Don't fail the vehicle creation if image record creation fails
    }
  }

  return {
    id: vehicle.id,
    vehicle,
  }
}
