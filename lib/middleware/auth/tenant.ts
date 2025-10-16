/**
 * Tenant Isolation Logic
 * 
 * Enforces tenant isolation by verifying user-tenant relationships.
 * Integrates with database RLS for defense-in-depth security.
 * 
 * @module lib/middleware/auth/tenant
 */

import { createClient } from '@supabase/supabase-js'
import type { AuthUser, TenantContext, AuthResult } from './types'
import {
  createMissingTenantError,
  createTenantMismatchError,
  createInternalError,
} from './errors'

// ============================================================================
// Constants
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ============================================================================
// Tenant Lookup
// ============================================================================

/**
 * Get user's tenant associations from user_tenants table
 * 
 * @param userId - User ID
 * @param token - JWT token for auth
 * @returns Array of tenant IDs
 */
export async function getUserTenants(
  userId: string,
  token: string
): Promise<AuthResult<TenantContext[]>> {
  try {
    // Create Supabase client with user's token
    // This respects RLS policies
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    
    // Query user_tenants table
    // Note: user_id is TEXT in database, not UUID
    const { data, error } = await supabase
      .from('user_tenants')
      .select(`
        tenant_id,
        tenants (
          name
        )
      `)
      .eq('user_id', userId)
    
    if (error) {
      console.error('[TENANT] Database query error:', error)
      return {
        ok: false,
        error: createInternalError(error),
      }
    }
    
    if (!data || data.length === 0) {
      return {
        ok: false,
        error: createMissingTenantError(userId),
      }
    }
    
    // Map to TenantContext array
    const tenants: TenantContext[] = data.map((row: any) => ({
      tenantId: row.tenant_id,
      tenantName: row.tenants?.name,
    }))
    
    return {
      ok: true,
      value: tenants,
    }
    
  } catch (error) {
    console.error('[TENANT] Lookup error:', error)
    return {
      ok: false,
      error: createInternalError(error),
    }
  }
}

// ============================================================================
// Tenant Selection
// ============================================================================

/**
 * Select active tenant from available tenants
 * 
 * Priority:
 * 1. x-tenant-id header (if valid)
 * 2. First available tenant
 * 
 * @param availableTenants - User's available tenants
 * @param requestedTenantId - Tenant ID from header (optional)
 * @returns Selected tenant context
 */
export function selectTenant(
  availableTenants: TenantContext[],
  requestedTenantId?: string | null
): AuthResult<TenantContext> {
  if (availableTenants.length === 0) {
    return {
      ok: false,
      error: createMissingTenantError('unknown'),
    }
  }
  
  // If tenant ID is requested, verify user has access
  if (requestedTenantId) {
    const matchingTenant = availableTenants.find(
      t => t.tenantId === requestedTenantId
    )
    
    if (!matchingTenant) {
      // User requested a tenant they don't have access to
      return {
        ok: false,
        error: createTenantMismatchError(
          requestedTenantId,
          availableTenants.map(t => t.tenantId).join(', ')
        ),
      }
    }
    
    return {
      ok: true,
      value: matchingTenant,
    }
  }
  
  // Default to first available tenant
  return {
    ok: true,
    value: availableTenants[0],
  }
}

// ============================================================================
// Complete Tenant Resolution
// ============================================================================

/**
 * Complete tenant resolution pipeline
 * 
 * 1. Lookup user's tenants from database
 * 2. Select active tenant (header or default)
 * 3. Return tenant context
 * 
 * @param user - Authenticated user
 * @param token - JWT token
 * @param requestedTenantId - Tenant ID from x-tenant-id header
 * @returns AuthResult with tenant context
 */
export async function resolveTenant(
  user: AuthUser,
  token: string,
  requestedTenantId?: string | null
): Promise<AuthResult<TenantContext>> {
  // Service role has access to all tenants
  if (user.role === 'service_role') {
    if (!requestedTenantId) {
      // Service role MUST specify tenant ID
      return {
        ok: false,
        error: createMissingTenantError('service-role'),
      }
    }
    
    return {
      ok: true,
      value: {
        tenantId: requestedTenantId,
        tenantName: 'Service Role',
        tenantRole: 'service_role',
      },
    }
  }
  
  // Get user's available tenants
  const tenantsResult = await getUserTenants(user.id, token)
  
  if (!tenantsResult.ok) {
    return tenantsResult
  }
  
  // Select active tenant
  return selectTenant(tenantsResult.value, requestedTenantId)
}

// ============================================================================
// Tenant Validation
// ============================================================================

/**
 * Validate that a resource belongs to the active tenant
 * 
 * Use this when handling resources that have tenant_id:
 * - Vehicles
 * - Events
 * - Garages
 * - etc.
 * 
 * @param resourceTenantId - Tenant ID from resource
 * @param activeTenantId - Active tenant ID from context
 * @returns true if valid, AuthError if mismatch
 */
export function validateResourceTenant(
  resourceTenantId: string,
  activeTenantId: string
): AuthResult<true> {
  if (resourceTenantId !== activeTenantId) {
    return {
      ok: false,
      error: createTenantMismatchError(activeTenantId, resourceTenantId),
    }
  }
  
  return {
    ok: true,
    value: true,
  }
}

// ============================================================================
// Tenant Context Helpers
// ============================================================================

/**
 * Set tenant context in Supabase for RLS
 * This sets app.current_tenant_id for current_setting RLS policies
 * 
 * @param supabase - Supabase client
 * @param tenantId - Tenant ID to set
 */
export async function setTenantContext(
  supabase: any,
  tenantId: string
): Promise<void> {
  try {
    // Set runtime config for current_setting RLS policies
    await supabase.rpc('set_config', {
      setting: 'app.current_tenant_id',
      value: tenantId,
      is_local: true,
    })
  } catch (error) {
    console.error('[TENANT] Failed to set context:', error)
    // Don't throw - RLS will still work via user_tenants lookup
  }
}

/**
 * Create Supabase client with tenant context
 * 
 * @param token - JWT token
 * @param tenantId - Tenant ID
 * @returns Supabase client with tenant context
 */
export function createTenantClient(token: string, tenantId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  
  // Set tenant context for current_setting RLS policies
  setTenantContext(supabase, tenantId)
  
  return supabase
}
