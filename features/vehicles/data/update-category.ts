import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

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
  const { category, data } = req.body

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  if (!category || !data) {
    return res.status(400).json({ error: 'Category and data required' })
  }

  try {
    // Get existing category data
    const { data: existing, error: fetchError } = await supabase
      .from('vehicle_spec_enhancements')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .eq('category', category)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    // Merge user data with existing data
    const mergedData = {
      ...(existing?.data || {}),
      ...data
    }

    // Get existing sources and add user_override
    const sources = existing?.sources || []
    if (!sources.includes('user_override')) {
      sources.push('user_override')
    }

    // Upsert the category with user data
    const { data: updated, error: upsertError } = await supabase
      .from('vehicle_spec_enhancements')
      .upsert({
        vehicle_id: vehicleId,
        category,
        status: 'completed',
        data: mergedData,
        sources,
        confidence: 'high', // User-provided data is high confidence
        completed_at: new Date().toISOString()
      }, {
        onConflict: 'vehicle_id,category'
      })
      .select()
      .single()

    if (upsertError) {
      throw upsertError
    }

    return res.status(200).json({
      success: true,
      data: updated
    })

  } catch (error) {
    console.error('Error updating category:', error)
    return res.status(500).json({
      error: 'Failed to update category',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


export default withTenantIsolation(handler)
