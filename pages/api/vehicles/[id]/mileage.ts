/**
 * Vehicle Mileage Management API
 * 
 * GET: Get current mileage with metadata
 * POST: Set manual override
 * DELETE: Remove override (revert to computed)
 */

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

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID is required' })
  }

  // Verify authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = session.user.id

  try {
    // Verify vehicle ownership
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, user_id, current_mileage, current_mileage_override, mileage_last_updated_at, mileage_computed_from')
      .eq('id', vehicleId)
      .eq('user_id', userId)
      .single()

    if (vehicleError || !vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }

    // Handle different methods
    switch (req.method) {
      case 'GET':
        return handleGet(res, vehicle)
      
      case 'POST':
        return handlePost(req, res, supabase, vehicleId, userId)
      
      case 'DELETE':
        return handleDelete(res, supabase, vehicleId)
      
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Mileage API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// GET: Return mileage with metadata
function handleGet(res: NextApiResponse, vehicle: any) {
  return res.status(200).json({
    current_mileage: vehicle.current_mileage,
    override: vehicle.current_mileage_override,
    source: vehicle.mileage_computed_from,
    last_updated_at: vehicle.mileage_last_updated_at,
    is_override_active: vehicle.current_mileage_override !== null,
    metadata: {
      description: vehicle.mileage_computed_from === 'override' 
        ? 'Manually set by user'
        : 'Computed from latest event'
    }
  })
}

// POST: Set manual override
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  supabase: any,
  vehicleId: string,
  userId: string
) {
  const { mileage, reason } = req.body

  // Validate input
  if (typeof mileage !== 'number' || mileage < 0) {
    return res.status(400).json({ error: 'Valid mileage value required (>= 0)' })
  }

  if (mileage > 1000000) {
    return res.status(400).json({ error: 'Mileage seems unrealistic (> 1M)' })
  }

  // Update override
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      current_mileage_override: mileage,
      current_mileage: mileage, // Will be set by trigger, but set here too for immediate effect
      mileage_computed_from: 'override',
      mileage_last_updated_at: new Date().toISOString()
    })
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Failed to set mileage override:', error)
    return res.status(500).json({ error: 'Failed to update mileage' })
  }

  // Log the change (optional - create an audit log table if needed)
  console.log(`✏️  User ${userId} set mileage override for vehicle ${vehicleId}: ${mileage} mi${reason ? ` (${reason})` : ''}`)

  return res.status(200).json({
    success: true,
    current_mileage: data.current_mileage,
    source: 'override',
    message: 'Mileage override set successfully'
  })
}

// DELETE: Remove override
async function handleDelete(
  res: NextApiResponse,
  supabase: any,
  vehicleId: string
) {
  // Remove override - this will trigger recomputation from events
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      current_mileage_override: null
      // Trigger will automatically recompute from events
    })
    .eq('id', vehicleId)
    .select()
    .single()

  if (error) {
    console.error('Failed to remove mileage override:', error)
    return res.status(500).json({ error: 'Failed to remove override' })
  }

  return res.status(200).json({
    success: true,
    current_mileage: data.current_mileage,
    source: 'event',
    message: 'Mileage override removed - now using computed value from events'
  })
}
