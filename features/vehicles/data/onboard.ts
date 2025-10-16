import { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { handleApiError, ValidationError, DatabaseError } from '../../../lib/utils/errors'
import { withTenantIsolation } from '../../../lib/middleware/tenant-context'

// Lean onboarding schema - just the essentials
const onboardSchema = z.object({
  // VIN path (primary)
  vin: z.string().length(17, 'VIN must be exactly 17 characters').optional(),
  
  // Manual path (fallback)
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  trim: z.string().optional(),
  
  // Required for timeline
  current_mileage: z.number().int().min(0).max(999999),
  
  // Optional personalization
  nickname: z.string().optional(),
  color: z.string().optional(),
  license_plate: z.string().optional().nullable().transform(val => val || null),
  garage_id: z.string().uuid().optional()
})

async function onboardHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get tenant ID and supabase client from middleware
    const tenantId = (req as any).tenantId
    const supabase = (req as any).supabase
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized - no tenant context' })
    }
    
    // Ensure tenant exists (create if first-time user)
    const { error: tenantCheckError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', tenantId)
      .single()
    
    if (tenantCheckError) {
      // Create tenant record
      const { error: tenantCreateError } = await supabase
        .from('tenants')
        .insert({ id: tenantId, name: 'My Account' })
        .select()
        .single()
      
      if (tenantCreateError && tenantCreateError.code !== '23505') {
        // Ignore duplicate key errors (23505), fail on other errors
        console.error('Failed to create tenant:', tenantCreateError)
      } else {
        console.log('✅ Created tenant record:', tenantId)
      }
    }
    
    // Validate request body
    const data = onboardSchema.parse(req.body)
    
    // Ensure we have either VIN or manual vehicle data
    if (!data.vin && (!data.year || !data.make || !data.model)) {
      throw new ValidationError('Either VIN or year/make/model is required')
    }

    let vehicleData: any = {}

    // Path 1: VIN provided - decode it
    if (data.vin) {
      console.log('🔍 Decoding VIN for onboarding:', data.vin)
      
      try {
        // ELITE: Use environment-aware URL builder (rebrand-proof)
        const { absoluteApiUrl } = await import('@/lib/utils/api-url')
        
        const decodeResponse = await fetch(absoluteApiUrl('/api/decode-vin'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vin: data.vin })
        })
        
        const decodeResult = await decodeResponse.json()
        
        if (decodeResult.success && decodeResult.specs) {
          vehicleData = {
            vin: data.vin,
            year: decodeResult.specs.year,
            make: decodeResult.specs.make,
            model: decodeResult.specs.model,
            trim: decodeResult.specs.trim,
            manufacturer_mpg: decodeResult.smart_defaults?.baseline_mpg,
            manufacturer_service_interval_miles: decodeResult.smart_defaults?.service_intervals?.oil_change_miles
          }
          console.log('✅ VIN decoded successfully:', vehicleData)
        } else {
          console.warn('⚠️ VIN decode failed, falling back to manual data')
          // Fall back to manual data if provided
          if (data.year && data.make && data.model) {
            vehicleData = {
              vin: data.vin, // Keep VIN even if decode failed
              year: data.year,
              make: data.make,
              model: data.model,
              trim: data.trim
            }
          } else {
            throw new ValidationError('VIN decode failed and no manual vehicle data provided')
          }
        }
      } catch (decodeError) {
        console.error('VIN decode error:', decodeError)
        // Fall back to manual data if available
        if (data.year && data.make && data.model) {
          vehicleData = {
            vin: data.vin,
            year: data.year,
            make: data.make,
            model: data.model,
            trim: data.trim
          }
        } else {
          throw new ValidationError('VIN decode failed and no fallback data available')
        }
      }
    } else {
      // Path 2: Manual entry
      vehicleData = {
        year: data.year,
        make: data.make,
        model: data.model,
        trim: data.trim
      }
    }

    // Get or create default garage
    let garageId = data.garage_id
    if (!garageId) {
      // Try to find existing garage first
      const { data: garages, error: garageError } = await supabase
        .from('garages')
        .select('id')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .limit(1)

      if (!garageError && garages && garages.length > 0) {
        // Use existing garage
        garageId = garages[0].id
        console.log('✅ Using existing garage:', garageId)
      } else {
        // Create new garage
        const { data: newGarage, error: createGarageError } = await supabase
          .from('garages')
          .insert({
            tenant_id: tenantId,
            name: 'My Garage',
            address: null
          })
          .select('id')
          .maybeSingle()

        if (createGarageError) {
          console.error('Garage creation error:', createGarageError)
          // If conflict (409), try to fetch again - might have been created by another request
          const { data: retryGarages } = await supabase
            .from('garages')
            .select('id')
            .eq('tenant_id', tenantId)
            .is('deleted_at', null)
            .limit(1)
          
          if (retryGarages && retryGarages.length > 0) {
            garageId = retryGarages[0].id
            console.log('✅ Using garage after conflict:', garageId)
          } else {
            throw new DatabaseError('Failed to create default garage')
          }
        } else if (newGarage) {
          garageId = newGarage.id
          console.log('✅ Created new garage:', garageId)
        } else {
          throw new DatabaseError('Failed to create default garage')
        }
      }
    }

    // Create vehicle record using correct column names
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: tenantId,
        garage_id: garageId,
        vin: vehicleData.vin || null,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        trim: vehicleData.trim || null,
        license_plate: data.license_plate || null,
        nickname: data.nickname || null,
        manufacturer_mpg: vehicleData.manufacturer_mpg || null,
        manufacturer_service_interval_miles: vehicleData.manufacturer_service_interval_miles || null
      })
      .select('id, nickname, year, make, model')
      .single()

    if (vehicleError || !vehicle) {
      console.error('Vehicle creation error:', vehicleError)
      throw new DatabaseError(`Failed to create vehicle: ${vehicleError?.message}`)
    }

    // Create initial odometer event (critical for timeline)
    const { data: initialEvent, error: eventError } = await supabase
      .from('vehicle_events')
      .insert({
        tenant_id: tenantId,
        vehicle_id: vehicle.id,
        type: 'odometer',
        date: new Date().toISOString().split('T')[0], // Today's date
        miles: data.current_mileage,
        payload: {
          source: 'onboarding',
          method: data.vin ? 'vin_decode' : 'manual_entry'
        },
        notes: 'Initial mileage from vehicle onboarding'
      })
      .select('id, miles, date')
      .single()

    if (eventError || !initialEvent) {
      console.error('Initial event creation error:', eventError)
      // Don't fail the whole onboarding if event creation fails
      console.warn('⚠️ Vehicle created but initial mileage event failed')
    }

    // Create display name for response
    const displayName = vehicle.nickname || 
      (vehicle.year && vehicle.make && vehicle.model 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : `${vehicle.make} ${vehicle.model}`)

    // Trigger specification enhancement (NHTSA API lookup)
    // This runs synchronously but fast (~5-10 seconds)
    console.log('🔄 Triggering spec enhancement for vehicle:', vehicle.id)
    try {
      // ELITE: Use environment-aware URL builder (rebrand-proof)
      const { absoluteApiUrl } = await import('@/lib/utils/api-url')
      
      // Add timeout protection - abort after 20 seconds
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      
      const specResponse = await fetch(absoluteApiUrl(`/api/vehicles/${vehicle.id}/specs/enhance`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      
      if (specResponse.ok) {
        const specData = await specResponse.json()
        console.log('✅ NHTSA spec enhancement completed:', specData.status)
        
        // Trigger AI enhancement immediately after NHTSA completes
        console.log('🤖 Triggering AI enhancement for vehicle:', vehicle.id)
        try {
          const aiResponse = await fetch(absoluteApiUrl(`/api/vehicles/${vehicle.id}/specs/enhance-ai`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          
          if (aiResponse.ok) {
            console.log('✅ AI enhancement started (processing in background)')
          } else {
            console.warn('⚠️ AI enhancement failed to start')
          }
        } catch (aiError) {
          console.error('❌ AI enhancement trigger error:', aiError)
          // Don't fail onboarding if AI enhancement fails to trigger
        }
      } else {
        console.warn('⚠️ Spec enhancement failed, vehicle created without specs')
      }
    } catch (specError) {
      if (specError instanceof Error && specError.name === 'AbortError') {
        console.warn('⚠️ Spec enhancement timeout, vehicle created without specs')
      } else {
        console.error('❌ Spec enhancement error:', specError)
      }
      // Don't fail onboarding if spec enhancement fails
    }

    console.log('✅ Vehicle onboarded successfully:', {
      vehicle_id: vehicle.id,
      display_name: displayName,
      initial_mileage: data.current_mileage
    })

    return res.status(201).json({
      success: true,
      vehicle_id: vehicle.id,
      initial_event_id: initialEvent?.id,
      vehicle: {
        id: vehicle.id,
        display_name: displayName,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model
      },
      initial_mileage: data.current_mileage,
      redirect_to: `/vehicles/${vehicle.id}`,
      message: `${displayName} added successfully!`
    })

  } catch (error) {
    console.error('❌ Vehicle onboarding error:', error)
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

// Export handler wrapped with tenant isolation middleware
export default withTenantIsolation(onboardHandler)
