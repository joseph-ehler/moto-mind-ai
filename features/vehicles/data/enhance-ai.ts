import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  try {
    // Verify vehicle exists and has NHTSA data
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('specs_enhancement_status')
      .eq('id', vehicleId)
      .single()

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Check if NHTSA enhancement is complete
    if (vehicle.specs_enhancement_status === 'pending') {
      return res.status(400).json({ 
        error: 'NHTSA enhancement not complete yet. Please wait for baseline specs first.' 
      })
    }

    // Call Supabase Edge Function (runs async)
    const { data, error } = await supabase.functions.invoke('enhance-vehicle-specs-ai', {
      body: { vehicleId }
    })

    if (error) {
      console.error('Edge function error:', error)
      return res.status(500).json({ error: 'Failed to start AI enhancement' })
    }

    return res.status(202).json({
      success: true,
      message: 'AI enhancement started',
      poll_url: `/api/vehicles/${vehicleId}/specs`
    })

  } catch (error) {
    console.error('AI enhancement trigger error:', error)
    return res.status(500).json({ error: 'Failed to trigger AI enhancement' })
  }
}


export default withTenantIsolation(handler)
