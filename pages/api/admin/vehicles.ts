// Admin API for viewing all vehicles (including archived)
// Used for testing adaptive layouts

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Mock auth for development
function mockAuth(req: NextApiRequest) {
  return {
    tenantId: '550e8400-e29b-41d4-a716-446655440000', // Demo tenant UUID
    userId: '550e8400-e29b-41d4-a716-446655440001',   // Demo user UUID
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const auth = mockAuth(req)

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get ALL vehicles (including archived) for admin view
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        tenant_id,
        label,
        nickname,
        make,
        model,
        year,
        vin,
        garage_id,
        enrichment,
        smart_defaults,
        service_intervals,
        created_at,
        updated_at,
        deleted_at
      `)
      .eq('tenant_id', auth.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to fetch vehicles' })
    }

    // Transform data to include year from enrichment
    const transformedVehicles = vehicles?.map(vehicle => ({
      ...vehicle,
      year: vehicle.year || vehicle.enrichment?.year || new Date().getFullYear()
    })) || []

    return res.status(200).json({ 
      vehicles: transformedVehicles,
      total: transformedVehicles.length,
      active: transformedVehicles.filter(v => !v.deleted_at).length,
      archived: transformedVehicles.filter(v => v.deleted_at).length
    })
  } catch (error) {
    console.error('Admin vehicles API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      suggestion: 'Please try again later'
    })
  }
}
