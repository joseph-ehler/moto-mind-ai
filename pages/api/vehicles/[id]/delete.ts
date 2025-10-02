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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    console.log('Attempting to delete vehicle:', id)

    // First, delete associated images
    const { error: imagesError } = await supabase
      .from('vehicle_images')
      .delete()
      .eq('vehicle_id', id)

    if (imagesError) {
      console.error('Error deleting vehicle images:', imagesError)
      // Continue anyway, don't fail the whole operation
    }

    // Delete the vehicle
    const { data, error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Supabase error deleting vehicle:', error)
      return res.status(500).json({ error: 'Failed to delete vehicle', details: error.message })
    }

    console.log('Vehicle deleted successfully:', data)

    res.status(200).json({ 
      success: true, 
      message: 'Vehicle deleted successfully'
    })
  } catch (error) {
    console.error('Delete vehicle error:', error)
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
