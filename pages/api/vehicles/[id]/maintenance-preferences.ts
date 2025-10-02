import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: vehicleId } = req.query

  // Note: Using service role for simplicity. In production, implement proper RLS and user auth.
  // RLS policies in migration will enforce user_id matching

  // GET - Fetch user preferences for this vehicle
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_maintenance_preferences')
      .select('*')
      .eq('vehicle_id', vehicleId)

    if (error) {
      console.error('Error fetching maintenance preferences:', error)
      return res.status(500).json({ error: 'Failed to fetch preferences' })
    }

    return res.status(200).json({ preferences: data || [] })
  }

  // POST/PUT - Upsert user preference
  if (req.method === 'POST' || req.method === 'PUT') {
    const { user_id, interval_type, interval_value, interval_unit = 'miles', notes, source } = req.body

    if (!user_id || !interval_type || !interval_value) {
      return res.status(400).json({ error: 'user_id, interval_type and interval_value are required' })
    }

    const { data, error } = await supabase
      .from('user_maintenance_preferences')
      .upsert({
        user_id,
        vehicle_id: vehicleId,
        interval_type,
        interval_value: parseInt(interval_value),
        interval_unit,
        notes,
        source
      }, {
        onConflict: 'vehicle_id,interval_type'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving maintenance preference:', error)
      return res.status(500).json({ 
        error: 'Failed to save preference',
        details: error.message,
        code: error.code 
      })
    }

    return res.status(200).json({ preference: data })
  }

  // DELETE - Remove user preference
  if (req.method === 'DELETE') {
    const { user_id, interval_type } = req.body

    if (!user_id || !interval_type) {
      return res.status(400).json({ error: 'user_id and interval_type are required' })
    }

    const { error } = await supabase
      .from('user_maintenance_preferences')
      .delete()
      .eq('vehicle_id', vehicleId)
      .eq('user_id', user_id)
      .eq('interval_type', interval_type)

    if (error) {
      console.error('Error deleting maintenance preference:', error)
      return res.status(500).json({ error: 'Failed to delete preference' })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
