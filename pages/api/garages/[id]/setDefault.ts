import { NextApiRequest, NextApiResponse } from 'next'
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    // First, unset all other garages as default
    const { error: unsetError } = await supabase
      .from('garages')
      .update({ is_default: false })
      .neq('id', id)

    if (unsetError) {
      console.error('Error unsetting default garages:', unsetError)
      return res.status(500).json({ error: 'Failed to update default garage' })
    }

    // Then set this garage as default
    const { data, error } = await supabase
      .from('garages')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error setting default garage:', error)
      return res.status(500).json({ error: 'Failed to set default garage' })
    }

    res.status(200).json({ 
      success: true, 
      garage: data,
      message: `${data.name} is now your default garage`
    })
  } catch (error) {
    console.error('Set default garage error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
