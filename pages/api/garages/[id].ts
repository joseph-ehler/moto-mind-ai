import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getGarageById, updateGarage, deleteGarage } from '@/lib/services/garages'
import { garageIdSchema, updateGarageRequestSchema } from '@/lib/validation/garages'
import { handleApiError, ValidationError, DatabaseError } from '@/lib/utils/errors'

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
  try {
    // Mock tenant ID for development - replace with real auth
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'
    
    // Validate garage ID
    const { id } = garageIdSchema.parse(req.query)

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, tenantId, id)
      case 'PATCH':
        return handlePatch(req, res, tenantId, id)
      case 'DELETE':
        return handleDelete(req, res, tenantId, id)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, tenantId: string, id: string) {
  try {
    // Get garage using service
    const garage = await getGarageById(tenantId, id)
    
    return res.status(200).json({ garage })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handlePatch(req: NextApiRequest, res: NextApiResponse, tenantId: string, id: string) {
  try {
    // Validate request body
    const garageData = updateGarageRequestSchema.parse({
      ...req.body,
      is_default: req.body.isDefault // Handle frontend naming
    })
    
    // Update garage using service
    const garage = await updateGarage(tenantId, id, garageData)
    
    return res.status(200).json({ 
      success: true, 
      garage,
      message: 'Garage updated successfully'
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, tenantId: string, id: string) {
  try {
    const { reassignTo, force } = req.query
    
    // Validate garage belongs to tenant before deletion
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id, name, tenant_id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null) // Only active garages
      .single()

    if (garageError || !garage) {
      throw new ValidationError('Garage not found or access denied')
    }

    // If force delete is requested, use hard delete (admin only)
    if (force === 'true') {
      const { error: deleteError } = await supabase
        .from('garages')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (deleteError) {
        throw new DatabaseError(`Failed to force delete garage: ${deleteError.message}`)
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Garage permanently deleted (force)',
        type: 'permanent'
      })
    }

    // Use graceful deletion function
    const { data: result, error: functionError } = await supabase
      .rpc('graceful_delete_garage', {
        garage_id_to_delete: id,
        reassign_to_garage_id: reassignTo as string || null
      })

    if (functionError) {
      throw new DatabaseError(`Failed to delete garage: ${functionError.message}`)
    }

    if (!result.success) {
      return res.status(400).json({
        error: result.error,
        success: false
      })
    }
    
    return res.status(200).json({ 
      success: true,
      message: result.message,
      vehiclesMoved: result.vehicles_moved,
      targetGarageId: result.target_garage_id,
      targetGarageName: result.target_garage_name,
      type: 'soft_delete',
      canRestore: true,
      restoreDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
