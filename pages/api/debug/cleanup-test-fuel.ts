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

  // Delete all fuel events from July 2020 (test data)
  const { data, error } = await supabase
    .from('vehicle_events')
    .delete()
    .eq('vehicle_id', '75bf28ae-b576-4628-abb0-9728dfc01ec0')
    .eq('type', 'fuel')
    .gte('date', '2020-07-09')
    .lte('date', '2020-07-10')
    .select()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    success: true,
    deleted_count: data?.length || 0,
    message: `Deleted ${data?.length || 0} test fuel entries`
  })
}
