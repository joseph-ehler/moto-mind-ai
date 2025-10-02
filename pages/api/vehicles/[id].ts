// MotoMindAI: Individual Vehicle API - Archive/Restore/Get
// Handles operations on specific vehicles by ID

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Mock auth for development
function mockAuth(req: NextApiRequest) {
  return {
    tenantId: '550e8400-e29b-41d4-a716-446655440000', // Demo tenant UUID
    userId: '550e8400-e29b-41d4-a716-446655440001',   // Demo user UUID
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const auth = mockAuth(req)
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Vehicle ID is required' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetVehicle(req, res, auth, id)
      case 'DELETE':
        return await handleArchiveVehicle(req, res, auth, id)
      case 'PATCH':
        return await handleRestoreVehicle(req, res, auth, id)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Vehicle API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      suggestion: 'Please try again later'
    })
  }
}

async function handleGetVehicle(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  id: string
) {
  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        tenant_id,
        make,
        model,
        year,
        vin,
        display_name,
        nickname,
        trim,
        license_plate,
        manufacturer_mpg,
        manufacturer_service_interval_miles,
        hero_image_url,
        garage_id,
        created_at,
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
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' })
      }
      return res.status(500).json({ error: 'Failed to fetch vehicle' })
    }

    // Use existing display_name or create one from year/make/model
    const displayName = vehicle.display_name || 
      (vehicle.year && vehicle.make && vehicle.model 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : vehicle.make && vehicle.model 
          ? `${vehicle.make} ${vehicle.model}`
          : 'Unknown Vehicle')

    const transformedVehicle = {
      ...vehicle,
      display_name: displayName,
      // Keep original nickname separate from display_name
      nickname: vehicle.nickname || null,
      // Legacy compatibility fields
      baseline_fuel_mpg: vehicle.manufacturer_mpg,
      baseline_service_interval_miles: vehicle.manufacturer_service_interval_miles,
      enrichment: {
        trim: vehicle.trim,
        // Add other enrichment fields as needed
      }
    }

    return res.status(200).json({ vehicle: transformedVehicle })
  } catch (error) {
    console.error('Error fetching vehicle:', error)
    return res.status(500).json({ error: 'Failed to fetch vehicle' })
  }
}

async function handleArchiveVehicle(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  id: string
) {
  try {
    // First check if vehicle exists and belongs to tenant
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, tenant_id, nickname, make, model, deleted_at')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' })
      }
      return res.status(500).json({ error: 'Failed to check vehicle' })
    }

    if (existingVehicle.deleted_at) {
      return res.status(400).json({ error: 'Vehicle is already archived' })
    }

    // Soft delete by setting deleted_at timestamp
    const { data: archivedVehicle, error: deleteError } = await supabase
      .from('vehicles')
      .update({ 
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (deleteError) {
      console.error('Archive error:', deleteError)
      return res.status(500).json({ error: 'Failed to archive vehicle' })
    }

    console.log(`✅ Vehicle archived: ${existingVehicle.nickname || existingVehicle.make + ' ' + existingVehicle.model}`)

    return res.status(200).json({ 
      message: 'Vehicle archived successfully',
      vehicle: archivedVehicle
    })
  } catch (error) {
    console.error('Error archiving vehicle:', error)
    return res.status(500).json({ error: 'Failed to archive vehicle' })
  }
}

async function handleRestoreVehicle(
  req: NextApiRequest,
  res: NextApiResponse,
  auth: { tenantId: string; userId: string },
  id: string
) {
  try {
    // Handle hero image update
    if (req.body.hero_image_url !== undefined) {
      const { data: updatedVehicle, error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          hero_image_url: req.body.hero_image_url
        })
        .eq('id', id)
        .eq('tenant_id', auth.tenantId)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return res.status(500).json({ error: 'Failed to update hero image' })
      }

      console.log(`✅ Hero image updated for vehicle: ${id}`)
      return res.status(200).json({ 
        message: 'Hero image updated successfully',
        vehicle: updatedVehicle
      })
    }

    // Check if vehicle exists and is archived
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, tenant_id, nickname, make, model, deleted_at')
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Vehicle not found' })
      }
      return res.status(500).json({ error: 'Failed to check vehicle' })
    }

    if (!existingVehicle.deleted_at) {
      return res.status(400).json({ error: 'Vehicle is not archived' })
    }

    // Restore by clearing deleted_at timestamp
    const { data: restoredVehicle, error: restoreError } = await supabase
      .from('vehicles')
      .update({ 
        deleted_at: null
      })
      .eq('id', id)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (restoreError) {
      console.error('Restore error:', restoreError)
      return res.status(500).json({ error: 'Failed to restore vehicle' })
    }

    console.log(`✅ Vehicle restored: ${existingVehicle.nickname || existingVehicle.make + ' ' + existingVehicle.model}`)

    return res.status(200).json({ 
      message: 'Vehicle restored successfully',
      vehicle: restoredVehicle
    })
  } catch (error) {
    console.error('Error restoring vehicle:', error)
    return res.status(500).json({ error: 'Failed to restore vehicle' })
  }
}
