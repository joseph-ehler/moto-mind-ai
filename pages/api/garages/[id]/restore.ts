import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { garageIdSchema } from '@/lib/validation/vehicless'
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Mock tenant ID for development - replace with real auth
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'
    
    // Validate garage ID
    const { id } = garageIdSchema.parse(req.query)

    // Validate garage belongs to tenant and is deleted
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id, name, tenant_id, deleted_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .not('deleted_at', 'is', null) // Only deleted garages
      .single()

    if (garageError || !garage) {
      throw new ValidationError('Deleted garage not found or access denied')
    }

    // Use restore function
    const { data: result, error: functionError } = await supabase
      .rpc('restore_deleted_garage', {
        garage_id_to_restore: id
      })

    if (functionError) {
      throw new DatabaseError(`Failed to restore garage: ${functionError.message}`)
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
      garage: {
        id: garage.id,
        name: garage.name
      }
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}
