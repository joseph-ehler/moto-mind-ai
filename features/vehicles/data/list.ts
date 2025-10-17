import { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, year, display_name, tenant_id')
      .limit(10)

    if (error) {
      console.error('Error fetching vehicles:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ vehicles: data || [] })
  } catch (error: any) {
    console.error('Failed to fetch vehicles:', error)
    return res.status(500).json({ error: error.message })
  }
}


export default withTenantIsolation(handler)
