// Tenant Context Middleware
// Sets app.tenant_id in database sessions for RLS policies

import { createClient } from '@supabase/supabase-js'
import { NextApiRequest } from 'next'

// Demo tenant ID - in production, extract from JWT or session
const DEMO_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

export function createTenantAwareSupabaseClient(req?: NextApiRequest) {
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
  const tenantId = extractTenantId(req) || DEMO_TENANT_ID

  // Set the tenant context for this database session
  supabase.rpc('set_config', {
    setting_name: 'app.tenant_id',
    setting_value: tenantId,
    is_local: true
  })

  return { supabase, tenantId }
}

function extractTenantId(req?: NextApiRequest): string | null {
  // TODO: In production, implement proper tenant extraction
  // Options:
  // 1. From JWT token: req.headers.authorization
  // 2. From session cookie
  // 3. From subdomain: req.headers.host
  // 4. From API key header
  
  // For now, return demo tenant
  return DEMO_TENANT_ID
}

// Helper to create RLS-aware database client
export async function withTenantContext<T>(
  req: NextApiRequest,
  operation: (supabase: any, tenantId: string) => Promise<T>
): Promise<T> {
  const { supabase, tenantId } = createTenantAwareSupabaseClient(req)
  
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
      const { supabase, tenantId } = createTenantAwareSupabaseClient(req)
      
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
