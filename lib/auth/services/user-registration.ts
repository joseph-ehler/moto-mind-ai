/**
 * User Registration Service
 * 
 * Handles user creation and tenant linking for credentials-based auth
 * Integrates with existing NextAuth + Supabase tenant system
 */

import { getSupabaseClient } from '@/lib/supabase/client'
import { hashPassword } from './password-service'
import { sendEmailVerification } from './email-verification'

// Service role client (has full access, bypasses RLS)
const supabaseAdmin = getSupabaseClient()

/**
 * User registration data
 */
export interface UserRegistrationData {
  email: string
  password: string
  name?: string
}

/**
 * Registration result
 */
export interface RegistrationResult {
  success: boolean
  userId?: string
  tenantId?: string
  error?: string
  code?: string
}

/**
 * Register a new user with credentials
 * Creates user account and links to a new tenant (following existing pattern)
 */
export async function registerUser(
  data: UserRegistrationData
): Promise<RegistrationResult> {
  try {
    const { email, password, name } = data

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('user_tenants')
      .select('user_id')
      .eq('user_id', email)
      .single()

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
        code: 'USER_EXISTS',
      }
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password)

    // 3. Create tenant (following existing pattern from lib/auth/config.ts)
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: name || email.split('@')[0],
        is_active: true,
        subscription_tier: 'free',
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      console.error('[REGISTRATION] Tenant creation failed:', tenantError)
      return {
        success: false,
        error: 'Failed to create account',
        code: 'TENANT_CREATE_FAILED',
      }
    }

    // 4. Create user_tenant link (owner role)
    const { error: userTenantError } = await supabaseAdmin
      .from('user_tenants')
      .insert({
        user_id: email, // Using email as user_id (matches OAuth pattern)
        tenant_id: tenant.id,
        role: 'owner',
      })

    if (userTenantError) {
      console.error('[REGISTRATION] User-tenant link failed:', userTenantError)
      
      // Rollback: Delete the tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)

      return {
        success: false,
        error: 'Failed to create account',
        code: 'USER_TENANT_LINK_FAILED',
      }
    }

    // 5. Store credentials (using NextAuth accounts table pattern)
    // Note: NextAuth will handle this via CredentialsProvider
    // We store the password hash for verification
    const { error: credentialsError } = await supabaseAdmin
      .from('credentials')
      .insert({
        user_id: email,
        password_hash: passwordHash,
        provider: 'credentials',
      })

    if (credentialsError) {
      console.error('[REGISTRATION] Credentials storage failed:', credentialsError)
      
      // Rollback: Delete user_tenant and tenant
      await supabaseAdmin.from('user_tenants').delete().eq('user_id', email)
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)

      return {
        success: false,
        error: 'Failed to create account',
        code: 'CREDENTIALS_STORE_FAILED',
      }
    }

    console.log('[REGISTRATION] User registered successfully:', {
      email,
      tenantId: tenant.id,
    })

    // 6. Send verification email (don't block on this)
    sendEmailVerification(email).catch((err) => {
      console.error('[REGISTRATION] Failed to send verification email:', err)
      // Don't fail registration if email fails to send
    })

    return {
      success: true,
      userId: email,
      tenantId: tenant.id,
    }
  } catch (error) {
    console.error('[REGISTRATION] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Get user credentials for authentication
 */
export async function getUserCredentials(email: string): Promise<{
  found: boolean
  passwordHash?: string
  tenantId?: string
  role?: string
}> {
  try {
    // Get credentials
    const { data: credentials } = await supabaseAdmin
      .from('credentials')
      .select('password_hash')
      .eq('user_id', email)
      .eq('provider', 'credentials')
      .single()

    if (!credentials) {
      return { found: false }
    }

    // Get tenant info
    const { data: userTenant } = await supabaseAdmin
      .from('user_tenants')
      .select('tenant_id, role')
      .eq('user_id', email)
      .single()

    if (!userTenant) {
      return { found: false }
    }

    return {
      found: true,
      passwordHash: credentials.password_hash,
      tenantId: userTenant.tenant_id,
      role: userTenant.role,
    }
  } catch (error) {
    console.error('[REGISTRATION] Get credentials error:', error)
    return { found: false }
  }
}

/**
 * Check if email is available for registration
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('user_tenants')
      .select('user_id')
      .eq('user_id', email)
      .single()

    return !data // Available if no user found
  } catch (error) {
    return true // Assume available on error
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const passwordHash = await hashPassword(newPassword)

    const { error } = await supabaseAdmin
      .from('credentials')
      .update({ password_hash: passwordHash })
      .eq('user_id', email)
      .eq('provider', 'credentials')

    if (error) {
      console.error('[REGISTRATION] Password update failed:', error)
      return {
        success: false,
        error: 'Failed to update password',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[REGISTRATION] Password update error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
