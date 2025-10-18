/**
 * API: Initialize Onboarding
 * POST /api/onboarding/initialize
 * 
 * Creates onboarding record for user
 */

import { NextResponse } from 'next/server'
import { requireUserServer } from '@/lib/auth/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Authenticate user
    const { user } = await requireUserServer()
    
    // Get or create user's tenant
    let { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    
    // If no tenant exists, create one (new user)
    if (tenantError || !userTenant) {
      console.log('[Onboarding/Initialize] No tenant found, creating for user:', user.id)
      
      // Create tenant
      const { data: newTenant, error: createTenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Personal',
          is_active: true,
        })
        .select()
        .single()
      
      if (createTenantError || !newTenant) {
        console.error('[Onboarding/Initialize] Failed to create tenant:', createTenantError)
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
        console.error('[Onboarding/Initialize] Failed to link user to tenant:', linkError)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }
      
      userTenant = { tenant_id: newTenant.id }
      console.log('[Onboarding/Initialize] Created tenant:', newTenant.id)
    }

    // Initialize onboarding (idempotent)
    const { data, error } = await supabase.rpc('initialize_user_onboarding', {
      p_user_id: user.id,
      p_tenant_id: userTenant.tenant_id,
    })

    if (error) {
      console.error('[Onboarding/Initialize] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to initialize onboarding' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      onboarding_id: data,
    })
  } catch (error: any) {
    console.error('[Onboarding/Initialize] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
