// MotoMindAI: Individual Vehicle API - Archive/Restore/Get
// Handles operations on specific vehicles by ID

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '../../../lib/middleware/tenant-context'

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const tenantId = (req as any).tenantId
    const supabase = (req as any).supabase
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Vehicle ID is required' })
    }

    switch (req.method) {
      case 'GET':
        return await handleGetVehicle(supabase, res, tenantId, id)
      case 'DELETE':
        return await handleArchiveVehicle(supabase, res, tenantId, id)
      case 'PATCH':
        return await handleRestoreVehicle(supabase, res, tenantId, id, req)
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
  supabase: any,
  res: NextApiResponse,
  tenantId: string,
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
      .eq('tenant_id', tenantId)
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
  supabase: any,
  res: NextApiResponse,
  tenantId: string,
  id: string
) {
  try {
    // First check if vehicle exists and belongs to tenant
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, tenant_id, nickname, make, model, deleted_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
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
      .eq('tenant_id', tenantId)
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
  supabase: any,
  res: NextApiResponse,
  tenantId: string,
  id: string,
  req: NextApiRequest
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
        .eq('tenant_id', tenantId)
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
      .eq('tenant_id', tenantId)
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
      .eq('tenant_id', tenantId)
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

export default withTenantIsolation(handler)
