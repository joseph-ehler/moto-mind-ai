import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

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
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { year, make, model, trim, nickname, vin, license_plate, garage_id, manufacturer_mpg, manufacturer_service_interval_miles } = req.body

  try {
    // Validate required fields
    if (!year || !make || !model) {
      return res.status(400).json({ error: 'Year, make, and model are required' })
    }

    // Update vehicle in Supabase
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        year: parseInt(year),
        make: make.trim(),
        model: model.trim(),
        trim: trim?.trim() || null,
        nickname: nickname?.trim() || null,
        vin: vin?.trim() || null,
        license_plate: license_plate?.trim() || null,
        garage_id: garage_id?.trim() || null,
        manufacturer_mpg: manufacturer_mpg ? parseInt(manufacturer_mpg) : null,
        manufacturer_service_interval_miles: manufacturer_service_interval_miles ? parseInt(manufacturer_service_interval_miles) : null,
        // Update display_name based on nickname or fallback to vehicle name
        display_name: nickname?.trim() || `${parseInt(year)} ${make.trim()} ${model.trim()}`
      })
      .eq('id', id)
      .select(`
        *,
        garage:garages(
          id,
          name,
          address,
          lat,
          lng,
          timezone,
          is_default
        )
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Failed to update vehicle' })
    }

    res.status(200).json({ 
      success: true, 
      vehicle: data,
      message: 'Vehicle updated successfully'
    })
  } catch (error) {
    console.error('Update vehicle error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}


export default withTenantIsolation(handler)
