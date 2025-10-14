import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  try {
    // Get vehicle with enhancement status
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('specs_enhancement_status, specs_categories_completed, specs_last_enhanced')
      .eq('id', vehicleId)
      .single()

    if (vehicleError) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Get all category enhancements
    const { data: categories, error: categoriesError } = await supabase
      .from('vehicle_spec_enhancements')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('category')

    if (categoriesError) {
      return res.status(500).json({ error: 'Failed to fetch specifications' })
    }

    return res.status(200).json({
      overall_status: vehicle.specs_enhancement_status,
      categories_completed: vehicle.specs_categories_completed,
      last_enhanced: vehicle.specs_last_enhanced,
      categories: categories || []
    })
  } catch (error) {
    console.error('Specs fetch error:', error)
    return res.status(500).json({ error: 'Failed to fetch specifications' })
  }
}


export default withTenantIsolation(handler)
