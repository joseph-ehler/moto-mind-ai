import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { garageId } = req.body

  try {
    // Validate that the garage exists
    if (garageId) {
      const { data: garage, error: garageError } = await supabase
        .from('garages')
        .select('id, name')
        .eq('id', garageId)
        .single()

      if (garageError || !garage) {
        return res.status(400).json({ error: 'Invalid garage ID' })
      }
    }

    // Update the vehicle's garage assignment
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        garage_id: garageId || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        garage:garages(id, name, address)
      `)
      .single()

    if (error) {
      console.error('Error moving vehicle:', error)
      return res.status(500).json({ error: 'Failed to move vehicle' })
    }

    res.status(200).json({ 
      success: true, 
      vehicle: data,
      message: garageId 
        ? `Vehicle moved to ${data.garage?.name || 'selected garage'}` 
        : 'Vehicle removed from garage'
    })
  } catch (error) {
    console.error('Move vehicle error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}


export default withTenantIsolation(handler)
