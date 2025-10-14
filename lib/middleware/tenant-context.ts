// Tenant Context Middleware
// Extracts tenant_id from NextAuth session for database queries

import { createClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../app/api/auth/[...nextauth]/route'

export async function createTenantAwareSupabaseClient(req?: NextApiRequest) {
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

  // Extract tenant_id from NextAuth session
  const tenantId = await extractTenantId(req)

  return { supabase, tenantId }
}

async function extractTenantId(req?: NextApiRequest): Promise<string | null> {
  if (!req) {
    console.error('❌ No request object provided to tenant middleware')
    return null
  }

  try {
    // Get NextAuth session
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      console.log('⚠️ No NextAuth session found')
      return null
    }

    // Extract tenant_id from session (set by auth callback)
    const tenantId = (session.user as any).tenant_id
    
    if (!tenantId) {
      console.error('❌ Session exists but no tenant_id found')
      console.error('Session user:', JSON.stringify(session.user, null, 2))
      return null
    }

    // Validate it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(tenantId)) {
      console.error('❌ tenant_id is not a valid UUID:', tenantId)
      return null
    }

    console.log('✅ Extracted tenant ID from NextAuth session:', tenantId)
    return tenantId

  } catch (error) {
    console.error('❌ Error extracting tenant ID:', error)
    return null
  }
}

// Helper to create tenant-aware database client
export async function withTenantContext<T>(
  req: NextApiRequest,
  operation: (supabase: any, tenantId: string) => Promise<T>
): Promise<T> {
  const { supabase, tenantId } = await createTenantAwareSupabaseClient(req)
  
  if (!tenantId) {
    throw new Error('UNAUTHORIZED: No valid session found')
  }
  
  try {
    // Execute the operation with tenant-aware client
    // Tenant isolation is handled by explicitly setting tenant_id in queries
    return await operation(supabase, tenantId)
    
  } catch (error) {
    console.error('Tenant context operation failed:', error)
    throw error
  }
}

// Middleware for API routes
export function withTenantIsolation(handler: any) {
  return async (req: NextApiRequest, res: any) => {
    try {
      // Create tenant-aware client and extract tenant ID
      const { supabase, tenantId } = await createTenantAwareSupabaseClient(req)
      
      // REJECT if no valid tenant_id (not authenticated)
      if (!tenantId) {
        console.error('❌ API request rejected - no valid authentication')
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        })
      }
      
      // Add to request object for handler access
      // Tenant isolation is handled by explicitly setting tenant_id in all queries
      ;(req as any).supabase = supabase
      ;(req as any).tenantId = tenantId
      
      // Call the original handler
      return await handler(req, res)
      
    } catch (error) {
      console.error('Tenant isolation middleware failed:', error)
      return res.status(500).json({
        error: 'TENANT_CONTEXT_ERROR',
        message: 'Failed to establish tenant context'
      })
    }
  }
}
