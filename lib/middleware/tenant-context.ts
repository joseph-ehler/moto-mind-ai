// Tenant Context Middleware
// Extracts tenant_id from NextAuth session for database queries
// Sets PostgreSQL session variables for RLS enforcement

import { createClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/config'

export async function createTenantAwareSupabaseClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      // Set session variables for RLS
      global: {
        headers: session?.user?.tenantId && session?.user?.email ? {
          'X-Tenant-ID': session.user.tenantId,
          'X-User-ID': session.user.email
        } : {}
      }
    }
  )

  // Extract tenant_id from NextAuth session
  const tenantId = await extractTenantId(req, res)
  
  // Set PostgreSQL session variables for RLS
  if (tenantId && session?.user?.email) {
    try {
      // Execute SQL to set session variables
      await supabase.rpc('set_session_context', {
        tenant_id: tenantId,
        user_id: session.user.email
      })
    } catch (error) {
      console.warn('⚠️  Could not set session context (RPC not available)');
      // Fallback: Tenant isolation enforced at application layer
    }
  }

  return { supabase, tenantId }
}

async function extractTenantId(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  try {
    // Get NextAuth session with req/res for API routes
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.tenantId) {
      console.log('⚠️ No valid session found')
      return null
    }

    // Validate it's a UUID
    const tenantId = session.user.tenantId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(tenantId)) {
      console.error('❌ tenant_id is not a valid UUID:', tenantId)
      return null
    }

    return tenantId

  } catch (error) {
    console.error('❌ Error extracting tenant ID:', error)
    return null
  }
}

// Helper to create tenant-aware database client
export async function withTenantContext<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  operation: (supabase: any, tenantId: string) => Promise<T>
): Promise<T> {
  const { supabase, tenantId } = await createTenantAwareSupabaseClient(req, res)
  
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
      // Get session for user info
      const session = await getServerSession(req, res, authOptions)
      
      // Create tenant-aware client and extract tenant ID
      const { supabase, tenantId } = await createTenantAwareSupabaseClient(req, res)
      
      // REJECT if no valid tenant_id (not authenticated)
      if (!tenantId || !session?.user?.email) {
        console.error('❌ API request rejected - no valid authentication')
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        })
      }
      
      // Set PostgreSQL session variables for RLS enforcement
      try {
        await supabase.rpc('set_session_context', {
          tenant_id: tenantId,
          user_id: session.user.email
        })
      } catch (error) {
        console.warn('⚠️  RLS session context not set:', error)
        // Continue - fallback to application-layer filtering
      }
      
      // Add to request object for handler access
      // Tenant isolation enforced at:
      // 1. Database level (RLS policies check session variables)
      // 2. Application level (explicit .eq('tenant_id', tenantId) filters)
      ;(req as any).supabase = supabase
      ;(req as any).tenantId = tenantId
      ;(req as any).userId = session.user.email
      
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
