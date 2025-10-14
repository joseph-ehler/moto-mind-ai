/**
 * Conversation Threads API
 * 
 * GET  - List all conversation threads for a vehicle
 * POST - Create new conversation thread
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/lib/middleware/tenant-context'

import { createClient } from '@supabase/supabase-js'
import { VehicleContextBuilder } from '@/lib/ai/vehicle-context-builder'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: vehicleId } = req.query

  if (!vehicleId || typeof vehicleId !== 'string') {
    return res.status(400).json({ error: 'Vehicle ID required' })
  }

  // GET - List threads
  if (req.method === 'GET') {
    try {
      console.log('📋 Listing threads for vehicle:', vehicleId)

      const { data: threads, error } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('❌ Failed to list threads:', error)
        throw error
      }

      console.log('✅ Found threads:', threads?.length || 0)
      return res.status(200).json({ threads })
    } catch (error: any) {
      console.error('❌ Failed to list threads:', error)
      return res.status(500).json({ 
        error: 'Failed to load conversations',
        details: error.message 
      })
    }
  }

  // POST - Create thread
  if (req.method === 'POST') {
    try {
      const { vehicleContext } = req.body

      console.log('📝 Creating new thread for vehicle:', vehicleId)

      // Try to get authenticated user from Supabase Auth
      // If no auth, use demo user for development
      let userId = '00000000-0000-0000-0000-000000000001' // Demo user

      try {
        // Check if there's an authenticated user
        const authHeader = req.headers.authorization
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '')
          const { data: { user }, error: authError } = await supabase.auth.getUser(token)
          if (!authError && user) {
            userId = user.id
          }
        }
      } catch (authError) {
        console.log('⚠️  No auth user, using demo user')
      }

      console.log('✅ User ID:', userId)

      // Build vehicle context snapshot for this conversation
      const contextBuilder = new VehicleContextBuilder(supabase)
      let contextSnapshot = null
      
      try {
        const vehicleData = await contextBuilder.buildContext(vehicleId, {
          includeRecentEvents: true,
          includeSpecs: false, // Don't need full specs in snapshot
          includeImages: false,
          eventLimit: 5,
          dateRangeMonths: 12
        })
        
        // Create simplified snapshot for storage
        contextSnapshot = {
          current_mileage: vehicleData.vehicle.mileage,
          last_service: vehicleData.maintenance.last_service,
          upcoming_maintenance: vehicleData.maintenance.upcoming,
          total_events: vehicleData.maintenance.total_events,
          total_spent_ytd: vehicleData.costs.total_spent_ytd,
          vehicle_age_years: new Date().getFullYear() - vehicleData.vehicle.year,
          snapshot_date: new Date().toISOString()
        }
        
        console.log('📸 Context snapshot created:', {
          mileage: contextSnapshot.current_mileage,
          cost_ytd: contextSnapshot.total_spent_ytd
        })
      } catch (error) {
        console.warn('⚠️  Could not build context snapshot:', error)
      }

      // Create new thread with context snapshot
      const { data: thread, error } = await supabase
        .from('conversation_threads')
        .insert({
          vehicle_id: vehicleId,
          user_id: userId,
          title: null, // Will be auto-generated from first message
          context_snapshot: contextSnapshot
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Failed to insert thread:', error)
        throw error
      }

      console.log('✅ Thread created:', thread.id)
      return res.status(201).json({ thread })
    } catch (error: any) {
      console.error('❌ Failed to create thread:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details
      })
      return res.status(500).json({ 
        error: 'Failed to create conversation',
        details: error.message 
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}


export default withTenantIsolation(handler)
