/**
 * API: Add Vehicle (Onboarding)
 * POST /api/onboarding/vehicle
 * 
 * Adds first vehicle and updates onboarding progress
 */

import { NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AddVehicleRequest {
  make: string
  model: string
  year: number
  nickname?: string
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { user } = await requireUserServer()
    
    // Parse request body
    const body: AddVehicleRequest = await request.json()
    const { make, model, year, nickname } = body

    // Validate
    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      )
    }

    if (year < 1900 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      )
    }

    // Get or create user's tenant
    let { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    
    // If no tenant exists, create one (new user)
    if (tenantError || !userTenant) {
      console.log('[Onboarding/Vehicle] No tenant found, creating for user:', user.id)
      
      // Create tenant
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Personal', // Default tenant name
          is_active: true,
        })
        .select()
        .single()
      
      if (createTenantError || !newTenant) {
        console.error('[Onboarding/Vehicle] Failed to create tenant:', createTenantError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }
      
      // Link user to tenant
      const { error: linkError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: user.id,
          tenant_id: newTenant.id,
          role: 'owner',
          email_verified: false,
        })
      
      if (linkError) {
        console.error('[Onboarding/Vehicle] Failed to link user to tenant:', linkError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }
      
      // Use newly created tenant
      userTenant = { tenant_id: newTenant.id }
      console.log('[Onboarding/Vehicle] Created tenant:', newTenant.id)
    }

    // Add vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: userTenant.tenant_id,
        make,
        model,
        year,
        nickname: nickname || null,
        current_mileage: 0,
        specs_enhancement_status: 'pending',
      })
      .select()
      .single()

    if (vehicleError) {
      console.error('[Onboarding/Vehicle] Failed to add vehicle:', vehicleError)
      return NextResponse.json(
        { error: 'Failed to add vehicle' },
        { status: 500 }
      )
    }

    // Update onboarding progress
    const { error: progressError } = await supabase.rpc('update_onboarding_progress', {
      p_user_id: user.id,
      p_step: 'add_vehicle',
      p_flags: JSON.stringify({ vehicle_added: true }),
    })

    if (progressError) {
      console.warn('[Onboarding/Vehicle] Failed to update progress:', progressError)
      // Don't fail the request - vehicle was added successfully
    }

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        nickname: vehicle.nickname,
      },
    })
  } catch (error: any) {
    console.error('[Onboarding/Vehicle] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
