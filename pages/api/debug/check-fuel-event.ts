import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the most recent fuel event
  const { data, error } = await supabase
    .from('vehicle_events')
    .select('*')
    .eq('type', 'fuel')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    event: data,
    has_display_vendor: !!data.display_vendor,
    has_display_summary: !!data.display_summary,
    has_geocoded_address: !!data.geocoded_address,
  })
}
