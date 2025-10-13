// Tenant Context Middleware
// Sets app.tenant_id in database sessions for RLS policies

import { createClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'

// Demo tenant ID - in production, extract from JWT or session
const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

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

  // Set tenant context for RLS policies
  // In production, extract tenant_id from JWT token or session
  const tenantId = await extractTenantId(req) || DEMO_TENANT_ID

  // Set the tenant context for this database session
  await supabase.rpc('set_config', {
    setting_name: 'app.tenant_id',
    setting_value: tenantId,
    is_local: true
  })

  return { supabase, tenantId }
}

async function extractTenantId(req?: NextApiRequest): Promise<string | null> {
  if (!req) return DEMO_TENANT_ID

  try {
    // Extract auth token from cookies or Authorization header
    const authHeader = req.headers.authorization
    const authCookie = req.cookies['sb-access-token'] || 
                      req.cookies['supabase-auth-token']
    
    if (!authHeader && !authCookie) {
      console.log('⚠️ No auth token found, using demo tenant')
      return DEMO_TENANT_ID
    }

    // Get token from either source
    const token = authHeader?.replace('Bearer ', '') || authCookie

    // Verify token and get user from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('⚠️ Failed to get user from token:', error?.message)
      return DEMO_TENANT_ID
    }

    console.log('✅ Extracted tenant ID from Supabase user:', user.id)
    return user.id

  } catch (error) {
    console.error('❌ Error extracting tenant ID:', error)
    return DEMO_TENANT_ID
  }
}

// Helper to create RLS-aware database client
export async function withTenantContext<T>(
  req: NextApiRequest,
  operation: (supabase: any, tenantId: string) => Promise<T>
): Promise<T> {
  const { supabase, tenantId } = await createTenantAwareSupabaseClient(req)
  
  try {
    // Set tenant context
    await supabase.rpc('set_config', {
      setting_name: 'app.tenant_id', 
      setting_value: tenantId,
      is_local: true
    })
    
    // Execute the operation with tenant-aware client
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
      // Create tenant-aware client
      const { supabase, tenantId } = await createTenantAwareSupabaseClient(req)
      
      // Set tenant context
      await supabase.rpc('set_config', {
        setting_name: 'app.tenant_id',
        setting_value: tenantId, 
        is_local: true
      })
      
      // Add to request object for handler access
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
