import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { withValidation, validationSchemas } from '../../../lib/utils/api-validation'

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
    // Demo tenant ID for now - in production, get from auth
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    if (req.method === 'GET') {
      // TEMPORARY: Return mock garage data until garages table is created
      // TODO: Replace with real Supabase query once garages table exists
      try {
        const { data: garages, error } = await supabase
          .from('garages')
          .select('*')
          .eq('tenant_id', tenantId)
          .is('deleted_at', null)  // Only active garages
          .order('is_default', { ascending: false })  // Default first
          .order('last_used', { ascending: false, nullsFirst: false })  // Most recent next
          .order('name', { ascending: true })  // Alphabetical fallback

        if (error) {
          console.log('⚠️ Garages table missing, returning mock data:', error.message)
          
          // Return mock garage for development
          const mockGarages = [{
            id: '550e8400-e29b-41d4-a716-446655440001',
            tenant_id: tenantId,
            name: 'My Garage',
            address: 'Home',
            is_default: true,
            vehicle_count: 0,
            last_used: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted_at: null
          }]
          
          return res.status(200).json({
            success: true,
            garages: mockGarages,
            warning: 'Using mock data - garages table needs to be created'
          })
        }

        return res.status(200).json({
          success: true,
          garages: garages || []
        })
      } catch (err) {
        console.log('⚠️ Garages endpoint fallback to mock data')
        
        const mockGarages = [{
          id: '550e8400-e29b-41d4-a716-446655440001',
          tenant_id: tenantId,
          name: 'My Garage',
          address: 'Home',
          is_default: true,
          vehicle_count: 0,
          last_used: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null
        }]
        
        return res.status(200).json({
          success: true,
          garages: mockGarages,
          warning: 'Using mock data - garages table needs to be created'
        })
      }
    }

    if (req.method === 'POST') {
      // Create new garage
      const { name, address, lat, lng, timezone } = req.body

      if (!name) {
        return res.status(400).json({
          error: 'Name is required'
        })
      }

      try {
        const garageId = uuidv4()
        
        // Build garage data matching actual table structure
        const garageData: any = {
          id: garageId,
          tenant_id: tenantId,
          name,
          address: address || '',
          // created_at and updated_at will use database defaults (now())
          // vehicle_count will use database default (0)
          last_used: new Date().toISOString(),  // Set as just used
          is_default: false  // New garages are not default by default
        }

        // Add geographic data if provided (columns added via migration)
        if (lat !== undefined && lat !== null) garageData.lat = lat
        if (lng !== undefined && lng !== null) garageData.lng = lng
        if (timezone) garageData.timezone = timezone

        console.log('🏠 Creating garage with data:', garageData)

        const { data: garage, error } = await supabase
          .from('garages')
          .insert(garageData)
          .select()
          .single()

        if (error) {
          console.error('❌ Garage creation error:', error)
          console.error('📊 Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          console.error('📝 Attempted to insert:', garageData)
          
          // Return more specific error
          return res.status(500).json({
            error: 'Failed to create garage',
            message: error.message,
            code: error.code,
            details: error.details
          })
        }

        console.log('✅ Created garage successfully:', garage.name)

        return res.status(201).json({
          success: true,
          garage
        })
      } catch (err) {
        console.error('❌ Unexpected error creating garage:', err)
        return res.status(500).json({
          error: 'Unexpected error creating garage',
          message: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('Garages API error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
